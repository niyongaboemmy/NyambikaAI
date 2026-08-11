import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { eq } from "drizzle-orm";
import { db } from "../db";
import { users } from "../shared/schema";

// Centralized JWT secret — kept identical to routes.ts / routes/try-on.ts
const jwtSecret =
  process.env.JWT_SECRET ||
  "o3j3k3m1YwT8c4h1j6JtU9v2bX5rQ7e0sN8aZ3lK1tM9wD2pF6gH4rJ7nV1xB0s";

interface JwtPayload {
  userId: string;
  email: string;
  role: string;
  iat: number;
  exp: number;
}

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        role: string;
      };
    }
  }
}

import { sendError } from "../utils/response";

export const authMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return sendError(res, 401, 'No token provided');
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      return sendError(res, 401, 'No token provided');
    }

    // Verify token — fallback must match the one in routes.ts and
    // routes/try-on.ts, or tokens issued at login fail to verify here.
    const decoded = jwt.verify(token, jwtSecret) as JwtPayload;

    // Check if user still exists
    const user = await db.query.users.findFirst({
      where: eq(users.id, decoded.userId)
    });

    if (!user) {
      return sendError(res, 401, 'User not found');
    }

    // Add user to request object
    req.user = {
      id: user.id,
      email: user.email,
      role: user.role || 'customer'
    };

    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      return sendError(res, 401, 'Your session has expired. Please log in again.');
    }
    if (error instanceof jwt.JsonWebTokenError) {
      return sendError(res, 401, 'Invalid authentication token');
    }
    console.error('Auth middleware error:', error);
    return sendError(res, 500, 'Authentication failed');
  }
};
