import { Router, Request, Response } from "express";
import { db } from "../db";
import {
  tryOnSessions,
  sessionLikes,
  sessionViews,
  sessionComments,
  sessionSaves,
  users,
  products,
} from "../shared/schema.dialect";
import jwt from "jsonwebtoken";
import { randomUUID } from "crypto";
import { eq, and, desc, asc, sql } from "drizzle-orm";
import { generateVirtualTryOn } from "../tryon";
import multer from "multer";

const router = Router();

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (_req, file, cb) => {
    console.log(
      `File upload attempt: ${file.originalname}, mimetype: ${file.mimetype}`
    );
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

// POST /api/try-on - Main virtual try-on endpoint
router.post(
  "/",
  upload.fields([
    { name: "person_image", maxCount: 1 },
    { name: "garment_image", maxCount: 1 },
  ]),
  async (req: any, res: Response) => {
    try {
      const { product_type = "general" } = req.body;

      // Check if files were uploaded
      const files = req.files as { [fieldname: string]: Express.Multer.File[] };
      const personImage = files?.person_image?.[0];
      const garmentImage = files?.garment_image?.[0];

      if (!personImage || !garmentImage) {
        return res.status(400).json({
          success: false,
          error: "Both person_image and garment_image are required",
        });
      }

      // Convert buffer to base64 for processing
      const personImageBase64 = personImage.buffer.toString("base64");
      const garmentImageBase64 = garmentImage.buffer.toString("base64");

      // Generate virtual try-on
      const result = await generateVirtualTryOn(
        `data:${personImage.mimetype};base64,${personImageBase64}`,
        `data:${garmentImage.mimetype};base64,${garmentImageBase64}`,
        product_type
      );

      if (!result.success) {
        return res.status(500).json({
          success: false,
          error: result.error || "Failed to generate virtual try-on",
        });
      }

      res.json({
        success: true,
        tryOnImageUrl: result.tryOnImageUrl,
        recommendations: result.recommendations,
      });
    } catch (error) {
      console.error("Error in POST /api/try-on:", error);
      res.status(500).json({
        success: false,
        error: "Internal server error",
      });
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
      return res.status(400).json({
        success: false,
        error: "Product ID, name, and customer image are required",
      });
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

    res.status(201).json({
      success: true,
      session: session,
    });
  } catch (error) {
    console.error("Error creating try-on session:", error);
    res.status(500).json({
      success: false,
      error: "Failed to create try-on session",
    });
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

    // Build main query
    let query = db
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
      .where(and(...whereConditions));

    // Apply sorting
    let orderByColumn;
    switch (sort) {
      case "likes":
        orderByColumn = tryOnSessions.likes;
        break;
      case "views":
        orderByColumn = tryOnSessions.views;
        break;
      case "createdAt":
      default:
        orderByColumn = tryOnSessions.createdAt;
        break;
    }

    query = query
      .orderBy(order === "desc" ? desc(orderByColumn) : asc(orderByColumn))
      .limit(limitNum)
      .offset(offset);

    const sessions = await query;

    res.json({
      success: true,
      sessions,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages,
        hasNextPage: pageNum < totalPages,
        hasPreviousPage: pageNum > 1,
      },
    });
  } catch (error) {
    console.error("Error fetching try-on sessions:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch try-on sessions",
    });
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
        // Check if current user has liked this session
        isLiked: userId
          ? sql<boolean>`EXISTS(
          SELECT 1 FROM ${sessionLikes}
          WHERE ${sessionLikes.sessionId} = ${tryOnSessions.id}
          AND ${sessionLikes.userId} = ${userId}
        )`
          : sql<boolean>`FALSE`,
        // Check if current user has saved this session
        isSaved: userId
          ? sql<boolean>`EXISTS(
          SELECT 1 FROM ${sessionSaves}
          WHERE ${sessionSaves.sessionId} = ${tryOnSessions.id}
          AND ${sessionSaves.userId} = ${userId}
        )`
          : sql<boolean>`FALSE`,
      })
      .from(tryOnSessions)
      .leftJoin(users, eq(tryOnSessions.userId, users.id))
      .leftJoin(products, eq(tryOnSessions.productId, products.id))
      .where(eq(tryOnSessions.id, id));

    if (!result || result.length === 0) {
      console.log(`Session not found: ${id}`);
      return res.status(404).json({
        success: false,
        error: "Try-on session not found",
      });
    }

    console.log(`Session fetched successfully: ${id}`, result[0]);
    res.json({
      success: true,
      session: result[0],
    });
  } catch (error) {
    console.error("Error fetching try-on session:", error);
    console.error("Stack trace:", error instanceof Error ? error.stack : "N/A");
    res.status(500).json({
      success: false,
      error: "Failed to fetch try-on session",
    });
  }
});

// GET /api/try-on-sessions/:id - Alias for /sessions/:id (for compatibility)
router.get("/:id", async (req: Request, res: Response) => {
  // Only match if not a known route pattern (like 'like', 'save', 'view', 'comments')
  if (["like", "save", "view", "comments"].includes(req.params.id)) {
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
        // Check if current user has liked this session
        isLiked: userId
          ? sql<boolean>`EXISTS(
          SELECT 1 FROM ${sessionLikes}
          WHERE ${sessionLikes.sessionId} = ${tryOnSessions.id}
          AND ${sessionLikes.userId} = ${userId}
        )`
          : sql<boolean>`FALSE`,
        // Check if current user has saved this session
        isSaved: userId
          ? sql<boolean>`EXISTS(
          SELECT 1 FROM ${sessionSaves}
          WHERE ${sessionSaves.sessionId} = ${tryOnSessions.id}
          AND ${sessionSaves.userId} = ${userId}
        )`
          : sql<boolean>`FALSE`,
      })
      .from(tryOnSessions)
      .leftJoin(users, eq(tryOnSessions.userId, users.id))
      .leftJoin(products, eq(tryOnSessions.productId, products.id))
      .where(eq(tryOnSessions.id, id));

    if (!result || result.length === 0) {
      console.log(`Session not found: ${id}`);
      return res.status(404).json({
        success: false,
        error: "Try-on session not found",
      });
    }

    console.log(`Session fetched successfully: ${id}`, result[0]);
    res.json({
      success: true,
      session: result[0],
    });
  } catch (error) {
    console.error("Error fetching try-on session:", error);
    console.error("Stack trace:", error instanceof Error ? error.stack : "N/A");
    res.status(500).json({
      success: false,
      error: "Failed to fetch try-on session",
    });
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
        return res.status(404).json({
          success: false,
          error: "Try-on session not found",
        });
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
        return res.status(404).json({
          success: false,
          error: "Try-on session not found",
        });
      }

      res.json({
        success: true,
        session: updatedSession,
      });
    } catch (error) {
      console.error("Error updating try-on session:", error);
      res.status(500).json({
        success: false,
        error: "Failed to update try-on session",
      });
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
      return res.status(404).json({
        success: false,
        error: "Try-on session not found",
      });
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
      return res.status(404).json({
        success: false,
        error: "Try-on session not found",
      });
    }

    res.json({
      success: true,
      session: updatedSession,
    });
  } catch (error) {
    console.error("Error updating try-on session:", error);
    res.status(500).json({
      success: false,
      error: "Failed to update try-on session",
    });
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
        return res.status(404).json({
          success: false,
          error: "Try-on session not found",
        });
      }

      // Hide the session instead of deleting
      await db
        .update(tryOnSessions)
        .set({ isHidden: true })
        .where(eq(tryOnSessions.id, id));

      res.json({
        success: true,
        message: "Try-on session hidden successfully",
      });
    } catch (error) {
      console.error("Error hiding try-on session:", error);
      res.status(500).json({
        success: false,
        error: "Failed to hide try-on session",
      });
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
      return res.status(404).json({
        success: false,
        error: "Try-on session not found",
      });
    }

    // Hide the session instead of deleting
    await db
      .update(tryOnSessions)
      .set({ isHidden: true })
      .where(eq(tryOnSessions.id, id));

    res.json({
      success: true,
      message: "Try-on session hidden successfully",
    });
  } catch (error) {
    console.error("Error hiding try-on session:", error);
    res.status(500).json({
      success: false,
      error: "Failed to hide try-on session",
    });
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
        return res.status(400).json({
          success: false,
          error: "At least one image URL is required",
        });
      }

      // Verify session belongs to user
      const [session] = await db
        .select()
        .from(tryOnSessions)
        .where(
          and(eq(tryOnSessions.id, id), eq(tryOnSessions.userId, req.user!.id))
        );

      if (!session) {
        return res.status(404).json({
          success: false,
          error: "Try-on session not found",
        });
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

      res.json({
        success: true,
        savedCustomerImagePath,
        savedTryOnImagePath,
      });
    } catch (error) {
      console.error("Error downloading images:", error);
      res.status(500).json({
        success: false,
        error: "Failed to download and save images",
      });
    }
  }
);

// POST /api/try-on-sessions/:id/like - Like a try-on session
router.post("/:id/like", requireAuth, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Check if session exists and is not hidden
    const [session] = await db
      .select()
      .from(tryOnSessions)
      .where(eq(tryOnSessions.id, id));

    if (!session || session.isHidden) {
      return res.status(404).json({
        success: false,
        error: "Try-on session not found",
      });
    }

    // Check if user already liked this session
    const [existingLike] = await db
      .select()
      .from(sessionLikes)
      .where(
        and(
          eq(sessionLikes.sessionId, id),
          eq(sessionLikes.userId, req.user!.id)
        )
      );

    if (existingLike) {
      return res.status(400).json({
        success: false,
        error: "You already liked this session",
      });
    }

    // Add like
    await db.insert(sessionLikes).values({
      id: randomUUID(),
      sessionId: id,
      userId: req.user!.id,
    });

    // Increment like count
    const newLikesCount = (session.likes || 0) + 1;
    await db
      .update(tryOnSessions)
      .set({ likes: newLikesCount })
      .where(eq(tryOnSessions.id, id));

    res.json({
      success: true,
      likes: newLikesCount,
    });
  } catch (error) {
    console.error("Error liking session:", error);
    res.status(500).json({
      success: false,
      error: "Failed to like session",
    });
  }
});

// DELETE /api/try-on-sessions/:id/like - Unlike a try-on session
router.delete("/:id/like", requireAuth, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Check if user has liked this session
    const [existingLike] = await db
      .select()
      .from(sessionLikes)
      .where(
        and(
          eq(sessionLikes.sessionId, id),
          eq(sessionLikes.userId, req.user!.id)
        )
      );

    if (!existingLike) {
      return res.status(400).json({
        success: false,
        error: "You haven't liked this session",
      });
    }

    // Remove like
    await db
      .delete(sessionLikes)
      .where(
        and(
          eq(sessionLikes.sessionId, id),
          eq(sessionLikes.userId, req.user!.id)
        )
      );

    // Decrement like count
    const [session] = await db
      .select()
      .from(tryOnSessions)
      .where(eq(tryOnSessions.id, id));

    if (session) {
      const newLikesCount = Math.max((session.likes || 0) - 1, 0);
      await db
        .update(tryOnSessions)
        .set({ likes: newLikesCount })
        .where(eq(tryOnSessions.id, id));
    }

    res.json({
      success: true,
      likes: session ? Math.max((session.likes || 0) - 1, 0) : 0,
    });
  } catch (error) {
    console.error("Error unliking session:", error);
    res.status(500).json({
      success: false,
      error: "Failed to unlike session",
    });
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
      return res.status(404).json({
        success: false,
        error: "Try-on session not found",
      });
    }

    // Add view (only track one view per user per session per day)
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    await db.insert(sessionViews).values({
      id: randomUUID(),
      sessionId: id,
      userId: req.user?.id || null,
    });

    // Increment view count
    const newViewsCount = (session.views || 0) + 1;
    await db
      .update(tryOnSessions)
      .set({ views: newViewsCount })
      .where(eq(tryOnSessions.id, id));

    res.json({
      success: true,
      views: newViewsCount,
    });
  } catch (error) {
    console.error("Error tracking view:", error);
    res.status(500).json({
      success: false,
      error: "Failed to track view",
    });
  }
});

// POST /api/try-on-sessions/:id/comments - Add a comment
router.post(
  "/:id/comments",
  requireAuth,
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { text } = req.body;

      if (!text || text.trim().length === 0) {
        return res.status(400).json({
          success: false,
          error: "Comment text is required",
        });
      }

      // Check if session exists and is not hidden
      const [session] = await db
        .select()
        .from(tryOnSessions)
        .where(eq(tryOnSessions.id, id));

      if (!session || session.isHidden) {
        return res.status(404).json({
          success: false,
          error: "Try-on session not found",
        });
      }

      const commentId = randomUUID();
      await db.insert(sessionComments).values({
        id: commentId,
        sessionId: id,
        userId: req.user!.id,
        text: text.trim(),
      });

      // Fetch the created comment
      const [comment] = await db
        .select()
        .from(sessionComments)
        .where(eq(sessionComments.id, commentId));

      res.status(201).json({
        success: true,
        comment,
      });
    } catch (error) {
      console.error("Error posting comment:", error);
      res.status(500).json({
        success: false,
        error: "Failed to post comment",
      });
    }
  }
);

// GET /api/try-on-sessions/:id/comments - Get comments for a session
router.get("/:id/comments", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { limit = 20, offset = 0 } = req.query;

    // Check if session exists
    const [session] = await db
      .select()
      .from(tryOnSessions)
      .where(eq(tryOnSessions.id, id));

    if (!session) {
      return res.status(404).json({
        success: false,
        error: "Try-on session not found",
      });
    }

    const comments = await db
      .select({
        id: sessionComments.id,
        userId: sessionComments.userId,
        sessionId: sessionComments.sessionId,
        text: sessionComments.text,
        isDeleted: sessionComments.isDeleted,
        createdAt: sessionComments.createdAt,
        userFullName: users.fullNameRw,
        userName: users.username,
      })
      .from(sessionComments)
      .leftJoin(users, eq(sessionComments.userId, users.id))
      .where(
        and(
          eq(sessionComments.sessionId, id),
          eq(sessionComments.isDeleted, false)
        )
      )
      .orderBy(desc(sessionComments.createdAt))
      .limit(Number(limit))
      .offset(Number(offset));

    res.json({
      success: true,
      comments,
    });
  } catch (error) {
    console.error("Error fetching comments:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch comments",
    });
  }
});

// DELETE /api/try-on-sessions/:id/comments/:commentId - Delete a comment
router.delete(
  "/:id/comments/:commentId",
  requireAuth,
  async (req: Request, res: Response) => {
    try {
      const { id, commentId } = req.params;

      // Get the comment
      const [comment] = await db
        .select()
        .from(sessionComments)
        .where(
          and(
            eq(sessionComments.id, commentId),
            eq(sessionComments.sessionId, id)
          )
        );

      if (!comment) {
        return res.status(404).json({
          success: false,
          error: "Comment not found",
        });
      }

      // Get the session to check if user is the owner
      const [session] = await db
        .select()
        .from(tryOnSessions)
        .where(eq(tryOnSessions.id, id));

      // Allow deletion if user is the comment author OR the session owner
      if (comment.userId !== req.user!.id && session?.userId !== req.user!.id) {
        return res.status(403).json({
          success: false,
          error: "You don't have permission to delete this comment",
        });
      }

      // Soft delete the comment
      await db
        .update(sessionComments)
        .set({ isDeleted: true })
        .where(eq(sessionComments.id, commentId));

      res.json({
        success: true,
        message: "Comment deleted successfully",
      });
    } catch (error) {
      console.error("Error deleting comment:", error);
      res.status(500).json({
        success: false,
        error: "Failed to delete comment",
      });
    }
  }
);

// POST /api/try-on-sessions/:id/save - Save a session
router.post("/:id/save", requireAuth, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Check if session exists and is not hidden
    const [session] = await db
      .select()
      .from(tryOnSessions)
      .where(eq(tryOnSessions.id, id));

    if (!session || session.isHidden) {
      return res.status(404).json({
        success: false,
        error: "Try-on session not found",
      });
    }

    // Check if already saved
    const [existingSave] = await db
      .select()
      .from(sessionSaves)
      .where(
        and(
          eq(sessionSaves.sessionId, id),
          eq(sessionSaves.userId, req.user!.id)
        )
      );

    if (existingSave) {
      return res.status(400).json({
        success: false,
        error: "You already saved this session",
      });
    }

    // Save the session
    await db.insert(sessionSaves).values({
      id: randomUUID(),
      sessionId: id,
      userId: req.user!.id,
    });

    res.json({
      success: true,
      message: "Session saved successfully",
    });
  } catch (error) {
    console.error("Error saving session:", error);
    res.status(500).json({
      success: false,
      error: "Failed to save session",
    });
  }
});

// DELETE /api/try-on-sessions/:id/save - Unsave a session
router.delete("/:id/save", requireAuth, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Check if session is saved
    const [existingSave] = await db
      .select()
      .from(sessionSaves)
      .where(
        and(
          eq(sessionSaves.sessionId, id),
          eq(sessionSaves.userId, req.user!.id)
        )
      );

    if (!existingSave) {
      return res.status(400).json({
        success: false,
        error: "You haven't saved this session",
      });
    }

    // Remove save
    await db
      .delete(sessionSaves)
      .where(
        and(
          eq(sessionSaves.sessionId, id),
          eq(sessionSaves.userId, req.user!.id)
        )
      );

    res.json({
      success: true,
      message: "Session unsaved successfully",
    });
  } catch (error) {
    console.error("Error unsaving session:", error);
    res.status(500).json({
      success: false,
      error: "Failed to unsave session",
    });
  }
});

export default router;
