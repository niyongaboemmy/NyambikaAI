import axios, { AxiosInstance, AxiosError, AxiosResponse } from "axios";

// API Configuration
export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3003";

// Create centralized axios instance
const createAxiosInstance = (): AxiosInstance => {
  const instance = axios.create({
    baseURL: API_BASE_URL,
    timeout: 30000, // Increased to 30 seconds for better reliability
    headers: {
      "Content-Type": "application/json",
    },
  });

  // Request interceptor to add auth token
  instance.interceptors.request.use(
    (config) => {
      if (typeof window !== "undefined") {
        const token = localStorage.getItem("auth_token");
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
      }
      return config;
    },
    (error) => {
      return Promise.reject(error);
    }
  );

  // Response interceptor for error handling
  instance.interceptors.response.use(
    (response: AxiosResponse) => response,
    (error: AxiosError) => {
      if (error.response?.status === 401) {
        // Token expired or invalid
        if (typeof window !== "undefined") {
          localStorage.removeItem("auth_token");
          window.location.href = "/login";
        }
      }
      return Promise.reject(error);
    }
  );

  return instance;
};

// Export the configured axios instance
export const apiClient = createAxiosInstance();

// Helper function for error handling
export const handleApiError = (error: unknown): string => {
  if (axios.isAxiosError(error)) {
    return (
      error.response?.data?.message || error.message || "An error occurred"
    );
  }
  return error instanceof Error ? error.message : "An unknown error occurred";
};

// Common API endpoints
export const API_ENDPOINTS = {
  // Auth
  LOGIN: "/api/auth/login",
  REGISTER: "/api/auth/register",
  LOGOUT: "/api/auth/logout",
  ME: "/api/auth/me",

  // Products
  PRODUCTS: "/api/products",
  PRODUCT_BY_ID: (id: string) => `/api/products/${id}`,

  // Categories
  CATEGORIES: "/api/categories",
  CATEGORY_BY_ID: (id: string) => `/api/categories/${id}`,

  // Companies
  COMPANIES: "/api/companies",
  COMPANY_BY_ID: (id: string) => `/api/companies/${id}`,

  // Cart
  CART: "/api/cart",
  CART_SYNC: "/api/cart/sync",

  // Orders
  ORDERS: "/api/orders",
  ORDER_BY_ID: (id: string) => `/api/orders/${id}`,
  CANCEL_ORDER: (id: string) => `/api/orders/${id}`,

  // Try-on
  TRY_ON: "/api/try-on",
  TRY_ON_UPLOAD: "/api/try-on/upload",
  TRY_ON_SESSIONS: "/api/try-on-sessions",
} as const;
