"use client";

import { usePathname } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { AppLoader } from "@/components/ui/AppLoader";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useLoginPrompt } from "@/contexts/LoginPromptContext";
import { Button } from "@/components/ui/button";

// Route protection configuration
const ROUTE_CONFIG = {
  // Public routes (no authentication required)
  public: [
    "/",
    "/try-on",
    "/companies",
    "/products",
    "/product/[id]",
    "/store/[id]",
    "/register",
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
    "/producer-dashboard",
    "/producer/[producerId]/orders",
    "/product-registration",
    "/product-edit/[id]",
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

  // Admin only routes for managing agents
  adminAgents: ["/admin/agents-management", "/admin/agent/[agentId]"],
};

interface RouteProtectionProps {
  children: React.ReactNode;
}

export function RouteProtection({ children }: RouteProtectionProps) {
  const pathname = usePathname();
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const { open } = useLoginPrompt();

  const renderNotAuthenticated = () => (
    <div className="min-h-[60vh] -mt-12 flex items-center justify-center p-6">
      <div className="w-full max-w-md text-center space-y-4">
        <h2 className="text-2xl font-semibold">Authentication required</h2>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Please log in to continue.
        </p>
        <div className="flex items-center justify-center gap-3">
          <Button
            variant="outline"
            onClick={() => router.push("/")}
            className="min-w-[140px]"
          >
            Go back home
          </Button>
          <Button
            onClick={() => open()}
            className="min-w-[140px] dark:text-white"
          >
            Click to login
          </Button>
        </div>
      </div>
    </div>
  );

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
    if (isRouteInCategory(ROUTE_CONFIG.adminAgents, path)) return "adminAgents";
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
          open();
          return;
        }
        break;

      case "admin":
        if (!isAuthenticated) {
          open();
          return;
        } else if (user?.role !== "admin") {
          router.push("/");
          return;
        }
        break;

      case "producer":
        if (!isAuthenticated) {
          open();
          return;
        } else if (user?.role !== "producer") {
          router.push("/");
          return;
        }
        break;

      case "agent":
        if (!isAuthenticated) {
          open();
          return;
        } else if (user?.role !== "agent") {
          router.push("/");
          return;
        }
        break;

      case "adminAgents":
        if (!isAuthenticated) {
          open();
          return;
        } else if (user?.role !== "admin") {
          router.push("/");
          return;
        }
        break;

      case "producerOrAdmin":
        if (!isAuthenticated) {
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
      case "adminAgents":
        if (!isAuthenticated) return renderNotAuthenticated();
        if (user?.role !== "admin") return null;
        break;
      case "producerOrAdmin":
        if (!isAuthenticated) return renderNotAuthenticated();
        if (user?.role !== "producer" && user?.role !== "admin") return null;
        break;
    }
  }

  return <>{children}</>;
}

// Export route configuration for external use
export { ROUTE_CONFIG };
