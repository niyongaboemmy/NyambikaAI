"use client";

import { usePathname } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { AppLoader } from "@/components/custom-ui/AppLoader";
import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";
import { useCompany } from "@/contexts/CompanyContext";
import { useLoginPrompt } from "@/contexts/LoginPromptContext";
import ProducerPendingVerificationModal from "@/components/ProducerPendingVerificationModal";

// Route protection configuration
const ROUTE_CONFIG = {
  // Public routes (no authentication required)
  public: [
    "/",
    "/companies",
    "/products",
    "/product/[id]",
    "/store/[id]",
    "/register",
    "/try-on-widget/[productId]",
    "/try-on",
  ],

  // Protected routes (authentication required)
  protected: [
    "/profile",
    "/cart",
    "/checkout",
    "/orders",
    "/orders/[id]",
    "/favorites",
  ],

  // Admin only routes
  admin: ["/admin-dashboard", "/admin-users"],

  // Producer only routes
  producer: [
    "/producer-orders",
    "/producer/[producerId]/orders",
    "/product-registration",
    "/product-edit/[id]",
    "/producer-subscription",
  ],

  // Agent only routes
  agent: [
    "/agent-dashboard",
    "/agent/producers-management",
    "/agent/producer/[producerId]",
    "/agent/subscription/renew/[producerId]",
  ],

  // Producer or Admin routes
  producerOrAdmin: ["/producer-orders"],
};

interface RouteProtectionProps {
  children: React.ReactNode;
}

export function RouteProtection({ children }: RouteProtectionProps) {
  const pathname = usePathname();
  const { user, isAuthenticated, isLoading } = useAuth();
  const { company } = useCompany();
  const router = useRouter();
  const { open } = useLoginPrompt();
  const warnedRef = useRef(false);
  const pendingRole: "producer" | "agent" | null = (() => {
    if (!user) return null;
    const isVerified = Boolean(user.isVerified);
    // Show pending verification modal for any non-verified producer
    if (user.role === "producer" && !isVerified) {
      return "producer";
    }
    if (user.role === "agent" && !isVerified) {
      return "agent";
    }
    return null;
  })();

  const renderNotAuthenticated = () => {
    // The login modal is opened via useEffect above. While waiting, avoid showing a CTA screen.
    // Render a lightweight loader to prevent layout jank.
    return <AppLoader />;
  };

  // Helper function to match dynamic routes
  const matchesRoute = (pattern: string, path: string): boolean => {
    // Convert pattern like "/product/[id]" to regex
    const regexPattern = pattern
      .replace(/\[([^\]]+)\]/g, "([^/]+)") // Replace [id] with ([^/]+)
      .replace(/\//g, "\\/"); // Escape forward slashes

    const regex = new RegExp(`^${regexPattern}$`);
    return regex.test(path);
  };

  // Check if current route matches any pattern in an array
  const isRouteInCategory = (
    routes: string[],
    currentPath: string
  ): boolean => {
    return routes.some((route) => {
      if (route.includes("[")) {
        return matchesRoute(route, currentPath);
      }
      return route === currentPath;
    });
  };

  // Determine route category
  const getRouteCategory = (path: string) => {
    if (isRouteInCategory(ROUTE_CONFIG.public, path)) return "public";
    if (isRouteInCategory(ROUTE_CONFIG.admin, path)) return "admin";
    if (isRouteInCategory(ROUTE_CONFIG.producer, path)) return "producer";
    if (isRouteInCategory(ROUTE_CONFIG.agent, path)) return "agent";
    if (isRouteInCategory(ROUTE_CONFIG.producerOrAdmin, path))
      return "producerOrAdmin";
    if (isRouteInCategory(ROUTE_CONFIG.protected, path)) return "protected";

    // Default to protected for unknown routes
    return "protected";
  };

  const routeCategory = getRouteCategory(pathname);

  // Handle route protection logic - MUST be called before any early returns
  useEffect(() => {
    if (isLoading) return; // Wait for auth to load

    switch (routeCategory) {
      case "public":
        // No protection needed
        break;

      case "protected":
        if (!isAuthenticated) {
          router.replace("/");
          open();
          return;
        }
        break;

      case "admin":
        if (!isAuthenticated) {
          router.replace("/");
          open();
          return;
        } else if (user?.role !== "admin") {
          router.push("/");
          return;
        }
        break;

      case "producer":
        if (!isAuthenticated) {
          router.replace("/");
          open();
          return;
        } else if (user?.role !== "producer") {
          router.push("/");
          return;
        }
        break;

      case "agent":
        if (!isAuthenticated) {
          router.replace("/");
          open();
          return;
        } else if (user?.role !== "agent") {
          router.push("/");
          return;
        }
        break;

      case "producerOrAdmin":
        if (!isAuthenticated) {
          router.replace("/");
          open();
          return;
        } else if (user?.role !== "producer" && user?.role !== "admin") {
          router.push("/");
          return;
        }
        break;

      default:
        // Unknown route, treat as protected
        if (!isAuthenticated) {
          open();
          return;
        }
    }
  }, [isAuthenticated, user?.role, routeCategory, router, isLoading]);

  // No soft prompts for pending states; unified blocking modal is used instead
  useEffect(() => {
    warnedRef.current = true;
  }, []);

  // Show loading while auth is being determined
  if (isLoading) {
    return <AppLoader />;
  }

  // For non-public routes, don't render until auth is confirmed
  if (routeCategory !== "public") {
    switch (routeCategory) {
      case "protected":
        if (!isAuthenticated) return renderNotAuthenticated();
        break;
      case "admin":
        if (!isAuthenticated) return renderNotAuthenticated();
        if (user?.role !== "admin") return null;
        break;
      case "producer":
        if (!isAuthenticated) return renderNotAuthenticated();
        if (user?.role !== "producer") return null;
        break;
      case "agent":
        if (!isAuthenticated) return renderNotAuthenticated();
        if (user?.role !== "agent") return null;
        break;
      case "producerOrAdmin":
        if (!isAuthenticated) return renderNotAuthenticated();
        if (user?.role !== "producer" && user?.role !== "admin") return null;
        break;
    }
  }

  return (
    <>
      {/* Show pending verification warning when applicable */}
      <ProducerPendingVerificationModal
        open={!!pendingRole}
        role={(pendingRole || "producer") as "producer" | "agent"}
      />
      {children}
    </>
  );
}

// Export route configuration for external use
export { ROUTE_CONFIG };
