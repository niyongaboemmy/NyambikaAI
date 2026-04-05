import axios, { AxiosError } from "axios";

/**
 * ApiError
 * A custom error class to handle API responses.
 */
export class ApiError extends Error {
  public status: number;
  public details: any;
  public success: boolean;

  constructor(message: string, status: number = 500, details: any = null) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.details = details;
    this.success = false;

    // Set the prototype explicitly for extending built-in classes in TS
    Object.setPrototypeOf(this, ApiError.prototype);
  }
}

/**
 * ApiErrorService
 * Centralized logic for parsing Axios errors and mapping them to user-friendly messages.
 */
export const ApiErrorService = {
  /**
   * Parse an unknown error into a standardized ApiError.
   */
  parse(error: unknown): ApiError {
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError<any>;
      const status = axiosError.response?.status || 500;
      const data = axiosError.response?.data;

      // Extract message from common backend formats (message or error)
      const message =
        data?.message ||
        data?.error ||
        this.getDefaultMessage(status) ||
        axiosError.message ||
        "An unexpected network error occurred";

      return new ApiError(message, status, data?.details || data);
    }

    if (error instanceof Error) {
      return new ApiError(error.message);
    }

    return new ApiError("An unknown error occurred");
  },

  /**
   * Get a user-friendly default message based on the HTTP status code.
   */
  getDefaultMessage(status: number): string {
    const messages: Record<number, string> = {
      400: "Invalid request. Please check your data and try again.",
      401: "Your session has expired. Please log in again to continue.",
      403: "You do not have permission to perform this action.",
      404: "The requested resource was not found.",
      408: "The request timed out. Please check your connection.",
      422: "There was a validation error with your input.",
      429: "Too many requests. Please slow down and try again later.",
      500: "A server error occurred. Our team has been notified.",
      502: "Bad gateway. The server is currently unavailable.",
      503: "Service unavailable. We're performing maintenance.",
      504: "Gateway timeout. Please try again in a moment.",
    };

    return messages[status] || "An unexpected error occurred. Please try again.";
  },

  /**
   * Handle common errors globally (e.g., triggering a sign-out on 401).
   * Returns true if the error was handled globally, false otherwise.
   */
  handleGlobal(error: ApiError, callbacks?: { onUnauthorized?: () => void }): boolean {
    if (error.status === 401) {
      if (callbacks?.onUnauthorized) {
        callbacks.onUnauthorized();
      }
      return true;
    }
    return false;
  },
};
