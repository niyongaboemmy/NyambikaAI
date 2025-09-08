"use client";
import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { useRef } from "react";
import { useSafeToast } from "@/hooks/use-safe-toast";
import {
  apiClient,
  handleApiError,
  API_BASE_URL,
  UserInterface,
} from "@/config/api";
import { useLoginPrompt } from "@/contexts/LoginPromptContext";

export interface User {
  id: string;
  email: string;
  name: string;
  role: "customer" | "producer" | "admin" | "agent";
  phone?: string;
  createdAt: string;
  // Optional fields used for verification checks
  isVerified?: boolean | null;
  businessName?: string | null;
}

interface AuthContextType {
  user: UserInterface | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (
    email: string,
    password: string,
    name: string,
    role: "customer" | "producer" | "agent",
    phone?: string
  ) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
  hasRole: (role: string) => boolean;
  requestPasswordReset: (email: string) => Promise<void>;
  loginWithProvider: (provider: "google" | "facebook") => void;
  setSession: (token: string, user?: UserInterface) => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(
  undefined
);

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<UserInterface | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useSafeToast();
  const didCheckRef = useRef(false);
  const { show } = useLoginPrompt();

  // Check for existing session on app load and handle OAuth callback
  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Check for OAuth callback with token in URL hash
        const hash = window.location.hash;
        const tokenMatch = hash.match(/token=([^&]+)/);
        
        if (tokenMatch) {
          const token = decodeURIComponent(tokenMatch[1]);
          localStorage.setItem("auth_token", token);
          // Clean up the URL
          window.history.replaceState(null, "", window.location.pathname + window.location.search);
        }

        const token = localStorage.getItem("auth_token");
        if (!token) {
          setIsLoading(false);
          return;
        }

        try {
          const response = await apiClient.get<UserInterface>("/api/auth/me");
          const userData: any = response.data;
          // Normalize isVerified to strict boolean (supports 1/0, "1"/"0", true/false)
          const normalizeVerified = (v: any) => {
            if (typeof v === "boolean") return v;
            if (typeof v === "number") return v === 1;
            if (typeof v === "string") return v === "1" || v.toLowerCase() === "true";
            return false;
          };
          const normalizedFromApi = { ...userData, isVerified: normalizeVerified(userData?.isVerified) } as UserInterface;

          // Also check for user data in localStorage (set by OAuth complete page)
          const storedUser = localStorage.getItem("user");
          if (storedUser) {
            const parsedUser: any = JSON.parse(storedUser);
            const normalizedStored = { ...parsedUser, isVerified: normalizeVerified(parsedUser?.isVerified) } as UserInterface;
            setUser(normalizedStored);
          } else {
            setUser(normalizedFromApi);
          }
        } catch (error) {
          console.error("Failed to fetch user data:", error);
          localStorage.removeItem("auth_token");
          localStorage.removeItem("user");
        }
      } catch (error) {
        console.error("Auth check failed:", error);
      } finally {
        setIsLoading(false);
      }
    };

    if (didCheckRef.current) return;
    didCheckRef.current = true;
    checkAuth();
  }, []);

  // Immediately set token and user; fetch user if not provided
  const setSession = async (token: string, providedUser?: UserInterface) => {
    try {
      if (token) {
        localStorage.setItem("auth_token", token);
      }
      if (providedUser) {
        const normalizeVerified = (v: any) => {
          if (typeof v === "boolean") return v;
          if (typeof v === "number") return v === 1;
          if (typeof v === "string") return v === "1" || v.toLowerCase() === "true";
          return false;
        };
        setUser({ ...(providedUser as any), isVerified: normalizeVerified((providedUser as any)?.isVerified) });
        return;
      }
      // Fetch current user from backend if not provided
      try {
        const response = await apiClient.get<UserInterface>("/api/auth/me");
        const userData: any = response.data;
        const normalizeVerified = (v: any) => {
          if (typeof v === "boolean") return v;
          if (typeof v === "number") return v === 1;
          if (typeof v === "string") return v === "1" || v.toLowerCase() === "true";
          return false;
        };
        setUser({ ...userData, isVerified: normalizeVerified(userData?.isVerified) });
      } catch (e) {
        console.error("Failed to fetch user in setSession:", e);
      }
    } catch (e) {
      console.error("Failed to set session:", e);
    }
  };

  const login = async (email: string, password: string) => {
    try {
      setIsLoading(true);
      const response = await apiClient.post("/api/auth/login", {
        email,
        password,
      });

      const { user: userData, token } = response.data as any;
      // Allow login even if pending verification; RouteProtection shows a blocking modal
      localStorage.setItem("auth_token", token);
      const normalizeVerified = (v: any) => {
        if (typeof v === "boolean") return v;
        if (typeof v === "number") return v === 1;
        if (typeof v === "string") return v === "1" || v.toLowerCase() === "true";
        return false;
      };
      setUser({ ...(userData as any), isVerified: normalizeVerified((userData as any)?.isVerified) });

      // React-safe toast notification
      setTimeout(() => {
        toast({
          title: "Login successful",
          description: `Welcome back, ${userData.name}!`,
        });
      }, 0);
    } catch (error: any) {
      // Normalize error message
      const description = handleApiError
        ? handleApiError(error)
        : error?.message || "Login failed";
      // React-safe error toast
      setTimeout(() => {
        toast({
          title: "Login failed",
          description,
          variant: "destructive",
        });
      }, 0);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (
    email: string,
    password: string,
    name: string,
    role: "customer" | "producer" | "agent",
    phone?: string
  ) => {
    try {
      setIsLoading(true);
      const response = await apiClient.post("/api/auth/register", {
        name,
        email,
        password,
        role,
      });

      const { user: userData, token } = response.data as any;

      localStorage.setItem("auth_token", token);
      const normalizeVerified = (v: any) => {
        if (typeof v === "boolean") return v;
        if (typeof v === "number") return v === 1;
        if (typeof v === "string") return v === "1" || v.toLowerCase() === "true";
        return false;
      };
      setUser({ ...(userData as any), isVerified: normalizeVerified((userData as any)?.isVerified) });

      // React-safe toast notification
      setTimeout(() => {
        toast({
          title: "Registration successful",
          description: `Welcome to NyambikaAI, ${userData.name}!`,
        });
      }, 0);
    } catch (error: any) {
      // React-safe error toast
      setTimeout(() => {
        toast({
          title: "Registration failed",
          description: error.message,
          variant: "destructive",
        });
      }, 0);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const requestPasswordReset = async (email: string) => {
    try {
      setIsLoading(true);
      const response = await apiClient.post("/api/auth/forgot-password", {
        email,
      });

      // React-safe toast notification
      setTimeout(() => {
        toast({
          title: "Password reset sent",
          description: "Check your email for a reset link.",
        });
      }, 0);
    } catch (error: any) {
      // React-safe error toast
      setTimeout(() => {
        toast({
          title: "Password reset failed",
          description: error.message,
          variant: "destructive",
        });
      }, 0);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem("auth_token");
    setUser(null);
    // React-safe toast notification
    setTimeout(() => {
      toast({
        title: "Logged out",
        description: "You have been successfully logged out.",
      });
    }, 0);
  };

  // Initiate OAuth flow via backend routes (server handles redirect & callback)
  const loginWithProvider = (provider: "google" | "facebook") => {
    // Use centralized API base URL to avoid port mismatches
    window.location.href = `${API_BASE_URL}/api/auth/oauth/${provider}`;
  };

  const hasRole = (role: string): boolean => {
    return user?.role === role;
  };

  const value: AuthContextType = {
    user,
    isLoading,
    login,
    register,
    logout,
    isAuthenticated: !!user,
    hasRole,
    requestPasswordReset,
    loginWithProvider,
    setSession,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
