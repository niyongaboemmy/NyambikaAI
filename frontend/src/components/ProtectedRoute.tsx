"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { AppLoader } from "./custom-ui/AppLoader";
import { useLoginPrompt } from "@/contexts/LoginPromptContext";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const { open } = useLoginPrompt();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      // Open login modal instead of redirecting to a login route
      open();
    }
  }, [isAuthenticated, isLoading, open]);

  // Show loader while checking authentication
  if (isLoading) {
    return <AppLoader />;
  }

  // If not authenticated, don't render children (redirect will happen)
  if (!isAuthenticated) {
    // Keep the user on the same page and show loader while the modal handles auth
    return <AppLoader />;
  }

  return <>{children}</>;
}
