"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { AppLoader } from "./custom-ui/AppLoader";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/");
    }
  }, [isAuthenticated, isLoading, router]);

  // Show loader while checking authentication
  if (isLoading) {
    return <AppLoader />;
  }

  // If not authenticated, don't render children (redirect will happen)
  if (!isAuthenticated) {
    return <AppLoader />;
  }

  return <>{children}</>;
}
