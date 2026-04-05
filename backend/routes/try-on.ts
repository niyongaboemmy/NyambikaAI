import { Router, Request, Response } from "express";
import { db } from "../db";
import {
  tryOnSessions,
  sessionComments,
  users,
  products,
} from "../shared/schema.dialect";
import jwt from "jsonwebtoken";
import { randomUUID } from "crypto";
import { eq, and, desc, asc, sql } from "drizzle-orm";
import { processTryOnAsync } from "../tryon";
import multer from "multer";
import { sendSuccess, sendError } from "../utils/response";

const router = Router();

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (_req, file, cb) => {
    const allowedMimes = [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/gif",
      "image/webp",
      "image/bmp",
    ];
    const allowedExtensions = [
      ".jpg",
      ".jpeg",
      ".png",
      ".gif",
      ".webp",
      ".bmp",
    ];

    const isMimeValid =
      file.mimetype.startsWith("image/") ||
      allowedMimes.includes(file.mimetype);
    const isExtensionValid = allowedExtensions.some((ext) =>
      file.originalname.toLowerCase().endsWith(ext)
    );

    if (isMimeValid || isExtensionValid) {
      cb(null, true);
    } else {
      console.error(
        `Rejected file: ${file.originalname} with mimetype: ${file.mimetype}`
      );
      cb(new Error("Only image files are allowed"));
    }
  },
});

const jwtSecret =
  process.env.JWT_SECRET ||
  "o3j3k3m1YwT8c4h1j6JtU9v2bX5rQ7e0sN8aZ3lK1tM9wD2pF6gH4rJ7nV1xB0s";

const requireAuth = async (req: any, res: any, next: any) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Authentication required" });
  }

  const token = authHeader.substring(7);

  try {
    const decoded = jwt.verify(token, jwtSecret) as any;
    req.userId = decoded.userId;
    req.userRole = decoded.role;
    req.user = { id: req.userId, role: req.userRole } as any;
    next();
  } catch {
    return res.status(401).json({ message: "Invalid token" });
  }
};

// POST /api/try-on - Main virtual try-on endpoint (async)
router.post(
  "/",
  upload.fields([
    { name: "person_image", maxCount: 1 },
    { name: "garment_image", maxCount: 1 },
  ]),
  async (req: any, res: Response) => {
    try {
      const { product_type = "general", productId, productName } = req.body;

      // Check if files were uploaded
      const files = req.files as { [fieldname: string]: Express.Multer.File[] };
      const personImage = files?.person_image?.[0];
      const garmentImage = files?.garment_image?.[0];

      if (!personImage || !garmentImage) {
        return sendError(res, 400, "Both person_image and garment_image are required");
      }

      if (!productId || !productName) {
        return sendError(res, 400, "productId and productName are required");
      }

      // Convert buffer to base64 for processing
      const personImageBase64 = personImage.buffer.toString("base64");
      const garmentImageBase64 = garmentImage.buffer.toString("base64");

      // Create try-on session
      const sessionId = randomUUID();
      await db.insert(tryOnSessions).values({
        id: sessionId,
        userId: req.user?.id || null, // Allow anonymous try-ons
        customerImageUrl: `data:${personImage.mimetype};base64,${personImageBase64}`,
        productId,
        status: "processing",
        isFavorite: false,
      });

      // Start async processing (don't await)
      processTryOnAsync(
        sessionId,
        `data:${personImage.mimetype};base64,${personImageBase64}`,
        `data:${garmentImage.mimetype};base64,${garmentImageBase64}`,
        product_type
      );

      sendSuccess(res, { sessionId }, "Try-on session created. Processing in background.");
    } catch (error) {
      console.error("Error in POST /api/try-on:", error);
      sendError(res, 500, "Internal server error", error);
    }
  }
);

// POST /api/try-on/sessions - Create a new try-on session
router.post("/sessions", requireAuth, async (req: Request, res: Response) => {
  try {
    const {
      productId,
      productName,
      customerImageUrl,
      status = "processing",
    } = req.body;

    if (!productId || !productName || !customerImageUrl) {
      return sendError(res, 400, "Product ID, name, and customer image are required");
    }

    const sessionId = randomUUID();
    await db.insert(tryOnSessions).values({
      id: sessionId,
      userId: req.user!.id,
      customerImageUrl,
      productId,
      status,
      isFavorite: false,
    });

    // Fetch the created session
    const [session] = await db
      .select()
      .from(tryOnSessions)
      .where(eq(tryOnSessions.id, sessionId));

    if (!session) {
      throw new Error("Failed to create try-on session");
    }

    sendSuccess(res, { session }, "Session created", 201);
  } catch (error) {
    console.error("Error creating try-on session:", error);
    sendError(res, 500, "Failed to create try-on session", error);
  }
});

// GET /api/try-on/sessions - Get try-on sessions (public or user's)
router.get("/sessions", async (req: Request, res: Response) => {
  try {
    const {
      page = 1,
      limit = 12,
      sort = "createdAt",
      order = "desc",
      status,
      productId,
    } = req.query;
    const userId = (req as any).user?.id;

    const limitNum = Number(limit);
    const pageNum = Number(page);
    const offset = (pageNum - 1) * limitNum;

    // Build where conditions
    const whereConditions = [eq(tryOnSessions.isHidden, false)];

    // If authenticated, filter by user; if not, show all public sessions
    if (userId) {
      whereConditions.push(eq(tryOnSessions.userId, userId));
    }

    if (status) {
      whereConditions.push(eq(tryOnSessions.status, status as any));
    }

    if (productId) {
      whereConditions.push(eq(tryOnSessions.productId, productId as string));
    }

    // Get total count for pagination
    const totalQuery = await db
      .select({ count: sql<number>`count(*)` })
      .from(tryOnSessions)
      .where(and(...whereConditions));

    const total = totalQuery[0]?.count || 0;
    const totalPages = Math.ceil(total / limitNum);

    // Determine sort column before building query
    const orderByColumn =
      sort === "likes" ? tryOnSessions.likes :
      sort === "views" ? tryOnSessions.views :
      tryOnSessions.createdAt;

    const sessions = await db
      .select({
        id: tryOnSessions.id,
        userId: tryOnSessions.userId,
        customerImageUrl: tryOnSessions.customerImageUrl,
        tryOnImageUrl: tryOnSessions.tryOnImageUrl,
        productId: tryOnSessions.productId,
        productName: products.name,
        productImage: products.imageUrl,
        fitRecommendation: tryOnSessions.fitRecommendation,
        status: tryOnSessions.status,
        isHidden: tryOnSessions.isHidden,
        isFavorite: tryOnSessions.isFavorite,
        notes: tryOnSessions.notes,
        rating: tryOnSessions.rating,
        likes: tryOnSessions.likes,
        views: tryOnSessions.views,
        createdAt: tryOnSessions.createdAt,
      })
      .from(tryOnSessions)
      .leftJoin(products, eq(tryOnSessions.productId, products.id))
      .where(and(...whereConditions))
      .orderBy(order === "desc" ? desc(orderByColumn) : asc(orderByColumn))
      .limit(limitNum)
      .offset(offset);

    sendSuccess(res, { sessions, pagination: { page: pageNum, limit: limitNum, total, totalPages, hasNextPage: pageNum < totalPages, hasPreviousPage: pageNum > 1 } });
  } catch (error) {
    console.error("Error fetching try-on sessions:", error);
    sendError(res, 500, "Failed to fetch try-on sessions", error);
  }
});

// GET / — alias handler when this router is mounted at /api/try-on-sessions
// Mirrors GET /sessions so that GET /api/try-on-sessions also returns the list
router.get("/", async (req: Request, res: Response) => {
  const {
    page = 1, limit = 12, sort = "createdAt", order = "desc", status, productId,
  } = req.query;
  const userId = (req as any).user?.id;
  const limitNum = Number(limit);
  const pageNum  = Number(page);
  const offset   = (pageNum - 1) * limitNum;
  const where: Parameters<typeof and>[0][] = [eq(tryOnSessions.isHidden, false)];
  if (userId)    where.push(eq(tryOnSessions.userId,    userId));
  if (status)    where.push(eq(tryOnSessions.status,    status as string));
  if (productId) where.push(eq(tryOnSessions.productId, productId as string));
  try {
    const [{ count }] = await db
      .select({ count: sql<number>`count(*)` })
      .from(tryOnSessions)
      .where(and(...where));
    const total      = Number(count) || 0;
    const totalPages = Math.ceil(total / limitNum);
    const orderCol   = sort === "likes" ? tryOnSessions.likes :
                       sort === "views" ? tryOnSessions.views : tryOnSessions.createdAt;
    const sessions = await db
      .select({
        id: tryOnSessions.id, userId: tryOnSessions.userId,
        customerImageUrl: tryOnSessions.customerImageUrl,
        tryOnImageUrl: tryOnSessions.tryOnImageUrl,
        productId: tryOnSessions.productId,
        productName: products.name, productImage: products.imageUrl,
        fitRecommendation: tryOnSessions.fitRecommendation,
        status: tryOnSessions.status, isHidden: tryOnSessions.isHidden,
        isFavorite: tryOnSessions.isFavorite, notes: tryOnSessions.notes,
        rating: tryOnSessions.rating, likes: tryOnSessions.likes,
        views: tryOnSessions.views, createdAt: tryOnSessions.createdAt,
      })
      .from(tryOnSessions)
      .leftJoin(products, eq(tryOnSessions.productId, products.id))
      .where(and(...where))
      .orderBy(order === "desc" ? desc(orderCol) : asc(orderCol))
      .limit(limitNum).offset(offset);
    sendSuccess(res, { sessions, pagination: { page: pageNum, limit: limitNum, total, totalPages } });
  } catch (error) {
    console.error("Error in GET / (try-on-sessions alias):", error);
    sendError(res, 500, "Failed to fetch sessions", error);
  }
});

// GET /api/try-on/sessions/:id - Get a specific try-on session (public view)
router.get("/sessions/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = (req as any).user?.id;

    const result = await db
      .select({
        id: tryOnSessions.id,
        userId: tryOnSessions.userId,
        customerImageUrl: tryOnSessions.customerImageUrl,
        tryOnImageUrl: tryOnSessions.tryOnImageUrl,
        productId: tryOnSessions.productId,
        productName: products.name,
        productImage: products.imageUrl,
        productCategoryId: products.categoryId,
        fitRecommendation: tryOnSessions.fitRecommendation,
        likes: tryOnSessions.likes,
        views: tryOnSessions.views,
        createdAt: tryOnSessions.createdAt,
        userFullName: users.fullNameRw,
        fullNameRw: users.fullNameRw,
        userName: users.username,
        username: users.username,
        // Check if current user has liked/saved this session via arrays
        isLiked: userId
          ? sql<boolean>`${userId} = ANY(${tryOnSessions.likedBy})`
          : sql<boolean>`FALSE`,
        isSaved: userId
          ? sql<boolean>`${userId} = ANY(${tryOnSessions.savedBy})`
          : sql<boolean>`FALSE`,
      })
      .from(tryOnSessions)
      .leftJoin(users, eq(tryOnSessions.userId, users.id))
      .leftJoin(products, eq(tryOnSessions.productId, products.id))
      .where(eq(tryOnSessions.id, id));

    if (!result || result.length === 0) {
      return sendError(res, 404, "Try-on session not found");
    }

    return sendSuccess(res, { session: result[0] });
  } catch (error) {
    console.error("Error fetching try-on session:", error);
    console.error("Stack trace:", error instanceof Error ? error.stack : "N/A");
    return sendError(res, 500, "Failed to fetch try-on session", error);
  }
});


// ─────────────────────────────────────────────────────────────────────────────
// COMMENTS — declared BEFORE GET /:id so Express resolves /:id/comments first
// ─────────────────────────────────────────────────────────────────────────────

interface CommentRow {
  id: string;
  userId: string;
  sessionId: string;
  text: string;
  isDeleted: boolean | null;
  createdAt: Date | null;
  userFullName: string | null;
  userName: string | null;
}

// GET /api/try-on-sessions/:id/comments
router.get("/:id/comments", async (req: Request, res: Response) => {
  const { id } = req.params;
  const limit  = Math.max(1, Math.min(100, Number(req.query.limit  ?? 20)));
  const offset = Math.max(0, Number(req.query.offset ?? 0));
  try {
    const [session] = await db
      .select({ id: tryOnSessions.id })
      .from(tryOnSessions)
      .where(eq(tryOnSessions.id, id));
    if (!session) {
      return sendError(res, 404, "Session not found");
    }

    const comments: CommentRow[] = await db
      .select({
        id:          sessionComments.id,
        userId:      sessionComments.userId,
        sessionId:   sessionComments.sessionId,
        text:        sessionComments.text,
        isDeleted:   sessionComments.isDeleted,
        createdAt:   sessionComments.createdAt,
        userFullName: users.fullName,
        userName:    users.username,
      })
      .from(sessionComments)
      .leftJoin(users, eq(sessionComments.userId, users.id))
      .where(and(eq(sessionComments.sessionId, id), eq(sessionComments.isDeleted, false)))
      .orderBy(desc(sessionComments.createdAt))
      .limit(limit)
      .offset(offset);
    return sendSuccess(res, { comments });
  } catch (err) {
    console.error("GET /:id/comments error:", err);
    return sendError(res, 500, "Failed to fetch comments", err);
  }
});

// POST /api/try-on-sessions/:id/comments
router.post("/:id/comments", requireAuth, async (req: Request, res: Response) => {
  const { id }   = req.params;
  const { text } = req.body as { text?: string };
  if (!text?.trim()) {
    return sendError(res, 400, "Comment text is required");
  }
  try {
    const [session] = await db
      .select({ id: tryOnSessions.id, isHidden: tryOnSessions.isHidden })
      .from(tryOnSessions)
      .where(eq(tryOnSessions.id, id));
    if (!session || session.isHidden) {
      return sendError(res, 404, "Session not found");
    }

    const commentId = randomUUID();
    await db.insert(sessionComments).values({
      id:        commentId,
      sessionId: id,
      userId:    (req as any).user!.id as string,
      text:      text.trim(),
    });
    const [comment] = await db
      .select()
      .from(sessionComments)
      .where(eq(sessionComments.id, commentId));
    return sendSuccess(res, { comment }, "Comment posted successfully", 201);
  } catch (err) {
    console.error("POST /:id/comments error:", err);
    return sendError(res, 500, "Failed to post comment", err);
  }
});

// DELETE /api/try-on-sessions/:id/comments/:commentId
router.delete("/:id/comments/:commentId", requireAuth, async (req: Request, res: Response) => {
  const { id, commentId } = req.params;
  try {
    const [comment] = await db
      .select()
      .from(sessionComments)
      .where(and(eq(sessionComments.id, commentId), eq(sessionComments.sessionId, id)));
    if (!comment) {
      return sendError(res, 404, "Comment not found");
    }
    const [session] = await db
      .select({ userId: tryOnSessions.userId })
      .from(tryOnSessions)
      .where(eq(tryOnSessions.id, id));
    const callerId = (req as any).user!.id as string;
    if (comment.userId !== callerId && session?.userId !== callerId) {
      return sendError(res, 403, "Access denied");
    }
    await db
      .update(sessionComments)
      .set({ isDeleted: true })
      .where(eq(sessionComments.id, commentId));
    return sendSuccess(res, null, "Comment deleted successfully");
  } catch (err) {
    console.error("DELETE /:id/comments/:commentId error:", err);
    return sendError(res, 500, "Failed to delete comment", err);
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/try-on-sessions/:id - Alias for /sessions/:id (for compatibility)
// MUST remain AFTER all /:id/sub-path routes above
// ─────────────────────────────────────────────────────────────────────────────
router.get("/:id", async (req: Request, res: Response) => {
  // Guard: single-word IDs that are really sub-paths fall through here; skip them
  if (["like", "save", "view", "comments", "sessions"].includes(req.params.id)) {
    return;
  }

  try {
    const { id } = req.params;
    const userId = (req as any).user?.id;

    const result = await db
      .select({
        id: tryOnSessions.id,
        userId: tryOnSessions.userId,
        customerImageUrl: tryOnSessions.customerImageUrl,
        tryOnImageUrl: tryOnSessions.tryOnImageUrl,
        productId: tryOnSessions.productId,
        productName: products.name,
        productImage: products.imageUrl,
        productCategoryId: products.categoryId,
        fitRecommendation: tryOnSessions.fitRecommendation,
        likes: tryOnSessions.likes,
        views: tryOnSessions.views,
        createdAt: tryOnSessions.createdAt,
        userFullName: users.fullNameRw,
        fullNameRw: users.fullNameRw,
        userName: users.username,
        username: users.username,
        isLiked: userId
          ? sql<boolean>`${userId} = ANY(${tryOnSessions.likedBy})`
          : sql<boolean>`FALSE`,
        isSaved: userId
          ? sql<boolean>`${userId} = ANY(${tryOnSessions.savedBy})`
          : sql<boolean>`FALSE`,
      })
      .from(tryOnSessions)
      .leftJoin(users, eq(tryOnSessions.userId, users.id))
      .leftJoin(products, eq(tryOnSessions.productId, products.id))
      .where(eq(tryOnSessions.id, id));

    if (!result || result.length === 0) {
      return sendError(res, 404, "Try-on session not found");
    }

    return sendSuccess(res, { session: result[0] });
  } catch (error) {
    console.error("Error fetching try-on session:", error);
    console.error("Stack trace:", error instanceof Error ? error.stack : "N/A");
    return sendError(res, 500, "Failed to fetch try-on session", error);
  }
});


// PUT /api/try-on/sessions/:id - Update a try-on session
router.put(
  "/sessions/:id",
  requireAuth,
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const {
        tryOnImageUrl,
        status,
        fitRecommendation,
        isFavorite,
        notes,
        rating,
      } = req.body;

      // Fetch existing session to preserve customer image and other fields
      const [existingSession] = await db
        .select()
        .from(tryOnSessions)
        .where(
          and(eq(tryOnSessions.id, id), eq(tryOnSessions.userId, req.user!.id))
        );

      if (!existingSession) {
        return sendError(res, 404, "Try-on session not found");
      }


      // Build update data, preserving existing values
      const updateData: any = {};

      if (tryOnImageUrl !== undefined) updateData.tryOnImageUrl = tryOnImageUrl;
      if (status !== undefined) updateData.status = status;
      if (fitRecommendation !== undefined)
        updateData.fitRecommendation = fitRecommendation;
      if (isFavorite !== undefined) updateData.isFavorite = isFavorite;
      if (notes !== undefined) updateData.notes = notes;
      if (rating !== undefined) updateData.rating = rating;

      // Only update if there are changes
      if (Object.keys(updateData).length > 0) {
        await db
          .update(tryOnSessions)
          .set(updateData)
          .where(
            and(
              eq(tryOnSessions.id, id),
              eq(tryOnSessions.userId, req.user!.id)
            )
          );
      }

      // Fetch the updated session
      const [updatedSession] = await db
        .select()
        .from(tryOnSessions)
        .where(eq(tryOnSessions.id, id));

      if (!updatedSession) {
        return sendError(res, 404, "Try-on session not found");
      }

      return sendSuccess(res, { session: updatedSession });
    } catch (error) {
      console.error("Error updating try-on session:", error);
      return sendError(res, 500, "Failed to update try-on session", error);
    }
  }
);


// PUT /api/try-on-sessions/:id - Update a try-on session (direct path when mounted at /api/try-on-sessions)
router.put("/:id", requireAuth, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const {
      tryOnImageUrl,
      status,
      fitRecommendation,
      isFavorite,
      notes,
      rating,
    } = req.body;

    // Fetch existing session to preserve customer image and other fields
    const [existingSession] = await db
      .select()
      .from(tryOnSessions)
      .where(
        and(eq(tryOnSessions.id, id), eq(tryOnSessions.userId, req.user!.id))
      );

    if (!existingSession) {
      return sendError(res, 404, "Try-on session not found");
    }


    // Build update data, preserving existing values
    const updateData: any = {};

    if (tryOnImageUrl !== undefined) updateData.tryOnImageUrl = tryOnImageUrl;
    if (status !== undefined) updateData.status = status;
    if (fitRecommendation !== undefined)
      updateData.fitRecommendation = fitRecommendation;
    if (isFavorite !== undefined) updateData.isFavorite = isFavorite;
    if (notes !== undefined) updateData.notes = notes;
    if (rating !== undefined) updateData.rating = rating;

    // Only update if there are changes
    if (Object.keys(updateData).length > 0) {
      await db
        .update(tryOnSessions)
        .set(updateData)
        .where(
          and(eq(tryOnSessions.id, id), eq(tryOnSessions.userId, req.user!.id))
        );
    }

    // Fetch the updated session
    const [updatedSession] = await db
      .select()
      .from(tryOnSessions)
      .where(eq(tryOnSessions.id, id));

    if (!updatedSession) {
      return sendError(res, 404, "Try-on session not found");
    }

    return sendSuccess(res, { session: updatedSession });
  } catch (error) {
    console.error("Error updating try-on session:", error);
    return sendError(res, 500, "Failed to update try-on session", error);
  }
});


// DELETE /api/try-on/sessions/:id - Hide a try-on session (soft delete)
router.delete(
  "/sessions/:id",
  requireAuth,
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;

      // First check if session exists and belongs to user
      const [existingSession] = await db
        .select()
        .from(tryOnSessions)
        .where(
          and(eq(tryOnSessions.id, id), eq(tryOnSessions.userId, req.user!.id))
        );

      if (!existingSession) {
        return sendError(res, 404, "Try-on session not found");
      }


      // Hide the session instead of deleting
      await db
        .update(tryOnSessions)
        .set({ isHidden: true })
        .where(eq(tryOnSessions.id, id));

      return sendSuccess(res, null, "Try-on session hidden successfully");
    } catch (error) {
      console.error("Error hiding try-on session:", error);
      return sendError(res, 500, "Failed to hide try-on session", error);
    }
  }
);


// DELETE /api/try-on-sessions/:id - Hide a try-on session (direct path when mounted at /api/try-on-sessions)
router.delete("/:id", requireAuth, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // First check if session exists and belongs to user
    const [existingSession] = await db
      .select()
      .from(tryOnSessions)
      .where(
        and(eq(tryOnSessions.id, id), eq(tryOnSessions.userId, req.user!.id))
      );

    if (!existingSession) {
      return sendError(res, 404, "Try-on session not found");
    }


    // Hide the session instead of deleting
    await db
      .update(tryOnSessions)
      .set({ isHidden: true })
      .where(eq(tryOnSessions.id, id));

    return sendSuccess(res, null, "Try-on session hidden successfully");
  } catch (error) {
    console.error("Error hiding try-on session:", error);
    return sendError(res, 500, "Failed to hide try-on session", error);
  }
});


// POST /api/try-on/sessions/:id/download-images - Download and save images locally
router.post(
  "/sessions/:id/download-images",
  requireAuth,
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { customerImageUrl, tryOnImageUrl } = req.body;

      if (!customerImageUrl && !tryOnImageUrl) {
        return sendError(res, 400, "At least one image URL is required");
      }


      // Verify session belongs to user
      const [session] = await db
        .select()
        .from(tryOnSessions)
        .where(
          and(eq(tryOnSessions.id, id), eq(tryOnSessions.userId, req.user!.id))
        );

      if (!session) {
        return sendError(res, 404, "Try-on session not found");
      }


      const fs = require("fs");
      const path = require("path");
      const https = require("https");
      const http = require("http");

      // Create tryon-images directory if it doesn't exist
      const uploadDir = path.join(
        process.cwd(),
        "public",
        "uploads",
        "tryon-images"
      );
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }

      let savedCustomerImagePath: string | null = null;
      let savedTryOnImagePath: string | null = null;

      // Helper function to download image
      const downloadImage = async (
        imageUrl: string,
        filename: string
      ): Promise<string | null> => {
        return new Promise((resolve) => {
          try {
            // Skip data URLs - they're already stored as URLs
            if (imageUrl.startsWith("data:")) {
              resolve(imageUrl);
              return;
            }

            // Handle local uploads that start with /api/uploads/
            if (imageUrl.startsWith("/api/uploads/")) {
              const localPath = path.join(
                process.cwd(),
                "public",
                imageUrl.replace("/api/uploads/", "uploads/")
              );

              if (fs.existsSync(localPath)) {
                // Copy local file
                const destPath = path.join(uploadDir, filename);
                fs.copyFile(
                  localPath,
                  destPath,
                  (err: NodeJS.ErrnoException | null) => {
                    if (err) {
                      console.error("Error copying local file:", err);
                      resolve(null);
                    } else {
                      resolve(`/uploads/tryon-images/${filename}`);
                    }
                  }
                );
                return;
              } else {
                console.error("Local file not found:", localPath);
                resolve(null);
                return;
              }
            }

            const filePath = path.join(uploadDir, filename);
            const file = fs.createWriteStream(filePath);
            const protocol = imageUrl.startsWith("https") ? https : http;

            protocol
              .get(imageUrl, (response: any) => {
                // Handle redirects
                if (
                  response.statusCode === 301 ||
                  response.statusCode === 302
                ) {
                  const redirectUrl = response.headers.location;
                  downloadImage(redirectUrl, filename)
                    .then(resolve)
                    .catch(() => resolve(null));
                  return;
                }

                if (response.statusCode !== 200) {
                  file.destroy();
                  fs.unlink(filePath, () => {});
                  resolve(null);
                  return;
                }

                response.pipe(file);
                file.on("finish", () => {
                  file.close();
                  resolve(`/uploads/tryon-images/${filename}`);
                });
                file.on("error", () => {
                  fs.unlink(filePath, () => {});
                  resolve(null);
                });
              })
              .on("error", () => {
                file.destroy();
                fs.unlink(filePath, () => {});
                resolve(null);
              });
          } catch (error) {
            console.error("Error downloading image:", error);
            resolve(null);
          }
        });
      };

      // Download customer image if provided
      if (customerImageUrl && !customerImageUrl.startsWith("data:")) {
        const customerFilename = `customer-${id}-${Date.now()}.jpg`;
        savedCustomerImagePath = await downloadImage(
          customerImageUrl,
          customerFilename
        );
      }

      // Download try-on result image if provided
      if (tryOnImageUrl && !tryOnImageUrl.startsWith("data:")) {
        const tryOnFilename = `tryon-${id}-${Date.now()}.jpg`;
        savedTryOnImagePath = await downloadImage(tryOnImageUrl, tryOnFilename);
      }

      // Update session with local image paths
      const updateData: any = {};
      if (savedCustomerImagePath) {
        updateData.customerImageLocalPath = savedCustomerImagePath;
      }
      if (savedTryOnImagePath) {
        updateData.tryOnImageLocalPath = savedTryOnImagePath;
      }

      if (Object.keys(updateData).length > 0) {
        await db
          .update(tryOnSessions)
          .set(updateData)
          .where(eq(tryOnSessions.id, id));
      }

      return sendSuccess(res, {
        savedCustomerImagePath,
        savedTryOnImagePath,
      });
    } catch (error) {
      console.error("Error downloading images:", error);
      return sendError(res, 500, "Failed to download and save images", error);
    }
  }
);


// POST /api/try-on-sessions/:id/like - Like a try-on session
router.post("/:id/like", requireAuth, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;

    const [session] = await db
      .select()
      .from(tryOnSessions)
      .where(eq(tryOnSessions.id, id));

    if (!session || session.isHidden) {
      return sendError(res, 404, "Try-on session not found");
    }


    if ((session.likedBy || []).includes(userId)) {
      return sendError(res, 400, "You already liked this session");
    }


    const newLikesCount = (session.likes || 0) + 1;
    await db
      .update(tryOnSessions)
      .set({ likedBy: sql`array_append(${tryOnSessions.likedBy}, ${userId})`, likes: newLikesCount })
      .where(eq(tryOnSessions.id, id));

    return sendSuccess(res, { likes: newLikesCount });
  } catch (error) {
    console.error("Error liking session:", error);
    return sendError(res, 500, "Failed to like session", error);
  }
});


// DELETE /api/try-on-sessions/:id/like - Unlike a try-on session
router.delete("/:id/like", requireAuth, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;

    const [session] = await db
      .select()
      .from(tryOnSessions)
      .where(eq(tryOnSessions.id, id));

    if (!session || !(session.likedBy || []).includes(userId)) {
      return sendError(res, 400, "You haven't liked this session");
    }


    const newLikesCount = Math.max((session.likes || 0) - 1, 0);
    await db
      .update(tryOnSessions)
      .set({ likedBy: sql`array_remove(${tryOnSessions.likedBy}, ${userId})`, likes: newLikesCount })
      .where(eq(tryOnSessions.id, id));

    return sendSuccess(res, { likes: newLikesCount });
  } catch (error) {
    console.error("Error unliking session:", error);
    return sendError(res, 500, "Failed to unlike session", error);
  }
});


// POST /api/try-on-sessions/:id/view - Track a view
router.post("/:id/view", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Check if session exists and is not hidden
    const [session] = await db
      .select()
      .from(tryOnSessions)
      .where(eq(tryOnSessions.id, id));

    if (!session || session.isHidden) {
      return sendError(res, 404, "Try-on session not found");
    }


    // Increment view count
    const newViewsCount = (session.views || 0) + 1;
    await db
      .update(tryOnSessions)
      .set({ views: newViewsCount })
      .where(eq(tryOnSessions.id, id));

    return sendSuccess(res, { views: newViewsCount });
  } catch (error) {
    console.error("Error tracking view:", error);
    return sendError(res, 500, "Failed to track view", error);
  }
});





// POST /api/try-on-sessions/:id/save - Save a session
router.post("/:id/save", requireAuth, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;

    const [session] = await db.select().from(tryOnSessions).where(eq(tryOnSessions.id, id));

    if (!session || session.isHidden) {
      return sendError(res, 404, "Try-on session not found");
    }


    if ((session.savedBy || []).includes(userId)) {
      return sendError(res, 400, "You already saved this session");
    }


    await db
      .update(tryOnSessions)
      .set({ savedBy: sql`array_append(${tryOnSessions.savedBy}, ${userId})` })
      .where(eq(tryOnSessions.id, id));

    return sendSuccess(res, null, "Session saved successfully");
  } catch (error) {
    console.error("Error saving session:", error);
    return sendError(res, 500, "Failed to save session", error);
  }
});


// DELETE /api/try-on-sessions/:id/save - Unsave a session
router.delete("/:id/save", requireAuth, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;

    const [session] = await db.select().from(tryOnSessions).where(eq(tryOnSessions.id, id));

    if (!session || !(session.savedBy || []).includes(userId)) {
      return sendError(res, 400, "You haven't saved this session");
    }


    await db
      .update(tryOnSessions)
      .set({ savedBy: sql`array_remove(${tryOnSessions.savedBy}, ${userId})` })
      .where(eq(tryOnSessions.id, id));

    return sendSuccess(res, null, "Session unsaved successfully");
  } catch (error) {
    console.error("Error unsaving session:", error);
    return sendError(res, 500, "Failed to unsave session", error);
  }
});


export default router;
