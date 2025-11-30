import { Router, Request, Response } from "express";
import { db } from "../db";
import { tryOnSessions } from "../shared/schema.dialect";
import jwt from "jsonwebtoken";
import { randomUUID } from "crypto";
import { eq, and, desc } from "drizzle-orm";
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
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
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

// GET /api/try-on/sessions - Get user's try-on sessions
router.get("/sessions", requireAuth, async (req: Request, res: Response) => {
  try {
    const { limit = 20, offset = 0, status, productId } = req.query;

    let query = db
      .select()
      .from(tryOnSessions)
      .where(eq(tryOnSessions.userId, req.user!.id));

    if (status) {
      query = query.where(eq(tryOnSessions.status, status as any));
    }

    if (productId) {
      query = query.where(eq(tryOnSessions.productId, productId as string));
    }

    query = query
      .orderBy(desc(tryOnSessions.createdAt))
      .limit(Number(limit))
      .offset(Number(offset));

    const sessions = await query;

    res.json({
      success: true,
      sessions,
    });
  } catch (error) {
    console.error("Error fetching try-on sessions:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch try-on sessions",
    });
  }
});

// GET /api/try-on/sessions/:id - Get a specific try-on session
router.get(
  "/sessions/:id",
  requireAuth,
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;

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

      res.json({
        success: true,
        session: session,
      });
    } catch (error) {
      console.error("Error fetching try-on session:", error);
      res.status(500).json({
        success: false,
        error: "Failed to fetch try-on session",
      });
    }
  }
);

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

// DELETE /api/try-on/sessions/:id - Delete a try-on session
router.delete(
  "/sessions/:id",
  requireAuth,
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;

      // First check if session exists
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

      // Delete the session
      await db
        .delete(tryOnSessions)
        .where(
          and(eq(tryOnSessions.id, id), eq(tryOnSessions.userId, req.user!.id))
        );

      res.json({
        success: true,
        message: "Try-on session deleted successfully",
      });
    } catch (error) {
      console.error("Error deleting try-on session:", error);
      res.status(500).json({
        success: false,
        error: "Failed to delete try-on session",
      });
    }
  }
);

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

export default router;
