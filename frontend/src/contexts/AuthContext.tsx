"use client";
import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { useRef } from "react";
import { useToast } from "@/hooks/use-toast";
import { apiClient, handleApiError, API_BASE_URL } from "@/config/api";
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
  user: User | null;
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
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const didCheckRef = useRef(false);
  const { show } = useLoginPrompt();

  // Check for existing session on app load
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = localStorage.getItem("auth_token");
        if (!token) {
          setIsLoading(false);
          return;
        }

        try {
          const response = await apiClient.get("/api/auth/me");
          const userData = response.data;
          setUser(userData);
        } catch (error) {
          localStorage.removeItem("auth_token");
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

  const login = async (email: string, password: string) => {
    try {
      setIsLoading(true);
      const response = await apiClient.post("/api/auth/login", {
        email,
        password,
      });

      const { user: userData, token } = response.data;
      // Allow login even if pending verification; RouteProtection shows a blocking modal
      localStorage.setItem("auth_token", token);
      setUser(userData);

      toast({
        title: "Login successful",
        description: `Welcome back, ${userData.name}!`,
      });
    } catch (error: any) {
      // Normalize error message
      const description = handleApiError ? handleApiError(error) : error?.message || "Login failed";
      toast({
        title: "Login failed",
        description,
        variant: "destructive",
      });
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

      const { user: userData, token } = response.data;

      localStorage.setItem("auth_token", token);
      setUser(userData);

      toast({
        title: "Registration successful",
        description: `Welcome to NyambikaAI, ${userData.name}!`,
      });
    } catch (error: any) {
      toast({
        title: "Registration failed",
        description: error.message,
        variant: "destructive",
      });
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

      toast({
        title: "Password reset sent",
        description: "Check your email for a reset link.",
      });
    } catch (error: any) {
      toast({
        title: "Password reset failed",
        description: error.message,
        variant: "destructive",
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem("auth_token");
    setUser(null);
    toast({
      title: "Logged out",
      description: "You have been successfully logged out.",
    });
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
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
