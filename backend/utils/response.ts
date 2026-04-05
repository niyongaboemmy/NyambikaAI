import { Response } from "express";

/**
 * Standardized API response utility for NyambikaAI.
 * Ensures all responses have a consistent structure.
 */

export const sendSuccess = (
  res: Response,
  data: any = null,
  message: string = "Success",
  status: number = 200
) => {
  return res.status(status).json({
    success: true,
    message,
    data,
  });
};

export const sendError = (
  res: Response,
  status: number = 500,
  message: string = "An internal server error occurred",
  details: any = null
) => {
  // Mapping of common status codes to user-friendly messages if not provided
  const statusMessages: Record<number, string> = {
    400: "Invalid request. Please check your input.",
    401: "Authentication required. Please log in.",
    403: "Permission denied. You do not have access to this resource.",
    404: "Resource not found.",
    422: "Validation failed.",
    429: "Too many requests. Please try again later.",
    500: "Internal server error. Our team has been notified.",
  };

  const finalMessage = message || statusMessages[status] || "An unexpected error occurred";

  return res.status(status).json({
    success: false,
    message: finalMessage,
    details,
  });
};
