import { Router, Request, Response } from "express";
import { db } from "../db";
import { tryOnSessions } from "../shared/schema.dialect";
import jwt from "jsonwebtoken";
import { randomUUID } from "crypto";

const router = Router();

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

// POST /api/try-on/sessions - Create a new try-on session
router.post("/sessions", requireAuth, async (req: Request, res: Response) => {
  try {
    const { productId, productName, customerImageUrl, status = "processing" } = req.body;

    if (!productId || !productName || !customerImageUrl) {
      return res.status(400).json({
        success: false,
        error: "Product ID, name, and customer image are required",
      });
    }

    const sessionId = randomUUID();
    const session = await db
      .insert(tryOnSessions)
      .values({
        id: sessionId,
        userId: req.user!.id,
        customerImageUrl,
        productId,
        status,
        isFavorite: false,
      })
      .returning();

    res.status(201).json({
      success: true,
      session: session[0],
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
    const { limit = 20, offset = 0, status } = req.query;

    let query = db.select().from(tryOnSessions).where({
      userId: req.user!.id,
    });

    if (status) {
      query = query.where({ status: status as any });
    }

    query = query
      .orderBy(tryOnSessions.createdAt, "desc")
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
router.get("/sessions/:id", requireAuth, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const session = await db
      .select()
      .from(tryOnSessions)
      .where({
        id,
        userId: req.user!.id,
      })
      .limit(1);

    if (session.length === 0) {
      return res.status(404).json({
        success: false,
        error: "Try-on session not found",
      });
    }

    res.json({
      success: true,
      session: session[0],
    });
  } catch (error) {
    console.error("Error fetching try-on session:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch try-on session",
    });
  }
});

// PUT /api/try-on/sessions/:id - Update a try-on session
router.put("/sessions/:id", requireAuth, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { tryOnImageUrl, status, fitRecommendation, isFavorite, notes, rating } = req.body;

    const updateData: any = {};

    if (tryOnImageUrl !== undefined) updateData.tryOnImageUrl = tryOnImageUrl;
    if (status !== undefined) updateData.status = status;
    if (fitRecommendation !== undefined) updateData.fitRecommendation = fitRecommendation;
    if (isFavorite !== undefined) updateData.isFavorite = isFavorite;
    if (notes !== undefined) updateData.notes = notes;
    if (rating !== undefined) updateData.rating = rating;

    const updatedSession = await db
      .update(tryOnSessions)
      .set(updateData)
      .where({
        id,
        userId: req.user!.id,
      })
      .returning();

    if (updatedSession.length === 0) {
      return res.status(404).json({
        success: false,
        error: "Try-on session not found",
      });
    }

    res.json({
      success: true,
      session: updatedSession[0],
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
router.delete("/sessions/:id", requireAuth, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const deletedSession = await db
      .delete(tryOnSessions)
      .where({
        id,
        userId: req.user!.id,
      })
      .returning();

    if (deletedSession.length === 0) {
      return res.status(404).json({
        success: false,
        error: "Try-on session not found",
      });
    }

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
});

export default router;
