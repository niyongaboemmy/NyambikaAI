import axios, { AxiosInstance, AxiosError, AxiosResponse } from "axios";

// API Configuration
export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "https://nyambikaai.onrender.com";
export enum RoleEnum {
  ADMIN = "admin",
  AGENT = "agent",
  PRODUCER = "producer",
  CUSTOMER = "customer",
}

export interface UserInterface {
  id: string;
  username: string;
  email: string;
  fullNameRw: string | null;
  phone: string | null;
  location: string | null;
  role: RoleEnum;
  businessName: string | null;
  businessLicense: string | null;
  isVerified: boolean;
  measurements: string | null;
  profileImage: string | null;
  createdAt: string | null;
  name: string | null;
  business_name: string | null;
  business_id: string | null;
}

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
        // Normalize token: OAuth callbacks may have stored a JSON-stringified token with quotes
        const normalizedToken =
          token &&
          token.length > 0 &&
          token[0] === '"' &&
          token[token.length - 1] === '"'
            ? token.slice(1, -1)
            : token;
        if (normalizedToken) {
          config.headers.Authorization = `Bearer ${normalizedToken}`;
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
        const requestUrl = (error.config?.url || "").toString();
        // Do not redirect on login request failures; let the caller (LoginForm) handle UI state
        const isLoginRequest = requestUrl.includes("/api/auth/login");
        if (!isLoginRequest && typeof window !== "undefined") {
          localStorage.removeItem("auth_token");
          // Avoid redundant reload if we're already on the login page
          if (window.location.pathname !== "/login") {
            window.location.href = "/login";
          }
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
  PROFILE: "/api/auth/profile",
  CHANGE_PASSWORD: "/api/auth/change-password",
  FORGOT_PASSWORD: "/api/auth/forgot-password",

  // Products
  PRODUCTS: "/api/products",
  PRODUCT_BY_ID: (id: string) => `/api/products/${id}`,
  PRODUCT_SEARCH: "/api/search",

  // Categories
  CATEGORIES: "/api/categories",
  CATEGORY_BY_ID: (id: string) => `/api/categories/${id}`,

  // Companies
  COMPANIES: "/api/companies",
  COMPANY_BY_ID: (id: string) => `/api/companies/${id}`,
  COMPANY_PRODUCTS: (id: string) => `/api/companies/${id}/products`,
  COMPANY_ME: "/api/companies/me",

  // Cart
  CART: "/api/cart",
  CART_SYNC: "/api/cart/sync",
  CART_ITEM: (id: string) => `/api/cart/${id}`,

  // Orders
  ORDERS: "/api/orders",
  ORDER_BY_ID: (id: string) => `/api/orders/${id}`,
  CANCEL_ORDER: (id: string) => `/api/orders/${id}`,
  ORDER_VALIDATION_STATUS: (id: string) =>
    `/api/orders/${id}/validation-status`,
  ORDER_STATUS: (id: string) => `/api/orders/${id}/status`,
  PRODUCER_ORDERS: "/api/producer/orders",
  ORDERS_BY_PRODUCER: (producerId: string) =>
    `/api/orders/producer/${producerId}`,

  // Try-on
  TRY_ON: "/api/try-on",
  TRY_ON_UPLOAD: "/api/try-on/upload",
  TRY_ON_SESSIONS: "/api/try-on-sessions",
  TRY_ON_SESSION_BY_ID: (id: string) => `/api/try-on-sessions/${id}`,
  TRY_ON_SESSION_PROCESS: (id: string) => `/api/try-on-sessions/${id}/process`,

  // Producers
  PRODUCERS: "/api/producers",
  PRODUCER_BY_ID: (id: string) => `/api/producers/${id}`,
  PRODUCER_PRODUCTS: (id: string) => `/api/producers/${id}/products`,

  // Agent
  AGENT_STATS: "/api/agent/stats",
  AGENT_PRODUCERS: "/api/agent/producers",
  AGENT_AVAILABLE_PRODUCERS: "/api/agent/available-producers",
  AGENT_ASSIGN_PRODUCER: "/api/agent/assign-producer",
  AGENT_PRODUCER_DETAILS: (producerId: string) =>
    `/api/agent/producer/${producerId}`,
  AGENT_COMMISSIONS: "/api/agent/commissions",
  AGENT_PROCESS_PAYMENT: "/api/agent/process-payment",

  // Admin
  ADMIN_STATS: "/api/admin/stats",
  ADMIN_PRODUCERS: "/api/admin/producers",
  ADMIN_AGENTS: "/api/admin/agents",
  ADMIN_CUSTOMERS: "/api/admin/customers",
  ADMIN_ADMINS: "/api/admin/admins",
  ADMIN_CREATE_USER: "/api/admin/users",
  ADMIN_ORDERS: "/api/admin/orders",
  ADMIN_PENDING_APPROVALS: "/api/admin/pending-approvals",
  ADMIN_VERIFY_PRODUCER: (producerId: string) =>
    `/api/admin/producers/${producerId}/verify`,
  ADMIN_VERIFY_AGENT: (agentId: string) =>
    `/api/admin/agents/${agentId}/verify`,
  ADMIN_PRODUCER_COMPANY: (producerId: string) =>
    `/api/admin/producers/${producerId}/company`,

  // Favorites
  FAVORITES: "/api/favorites",
  FAVORITES_ITEM: (productId: string) => `/api/favorites/${productId}`,
  FAVORITES_CHECK: (productId: string) => `/api/favorites/${productId}/check`,

  // Payments
  CREATE_PAYMENT_INTENT: "/api/create-payment-intent",
  UPLOAD_SIZE_EVIDENCE: "/api/upload/size-evidence",

  // AI
  AI_ANALYZE_FASHION: "/api/ai/analyze-fashion",
  AI_SIZE_RECOMMENDATION: "/api/ai/size-recommendation",

  // Subscriptions
  PRODUCER_SUBSCRIPTION_STATUS: "/api/producer/subscription-status",
  SUBSCRIPTION_PLANS_BY_ID: (id: string) => `/api/subscription-plans/${id}`,
  SUBSCRIPTIONS: "/api/subscriptions",
} as const;
