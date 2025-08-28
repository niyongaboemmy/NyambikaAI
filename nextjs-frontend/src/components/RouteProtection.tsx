"use client";

import { usePathname } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { AppLoader } from "@/components/ui/AppLoader";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

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
    "/auth/signin",
    "/auth/signup"
  ],
  
  // Protected routes (authentication required)
  protected: [
    "/profile",
    "/cart",
    "/checkout",
    "/orders",
    "/orders/[id]",
    "/favorites"
  ],
  
  // Admin only routes
  admin: [
    "/admin-dashboard",
    "/admin-users"
  ],
  
  // Producer only routes
  producer: [
    "/producer-dashboard",
    "/producer/[producerId]/orders",
    "/product-registration",
    "/product-edit/[id]"
  ],
  
  // Producer or Admin routes
  producerOrAdmin: [
    "/producer-orders"
  ]
};

interface RouteProtectionProps {
  children: React.ReactNode;
}

export function RouteProtection({ children }: RouteProtectionProps) {
  const pathname = usePathname();
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  // Helper function to match dynamic routes
  const matchesRoute = (pattern: string, path: string): boolean => {
    // Convert pattern like "/product/[id]" to regex
    const regexPattern = pattern
      .replace(/\[([^\]]+)\]/g, '([^/]+)') // Replace [id] with ([^/]+)
      .replace(/\//g, '\\/'); // Escape forward slashes
    
    const regex = new RegExp(`^${regexPattern}$`);
    return regex.test(path);
  };

  // Check if current route matches any pattern in an array
  const isRouteInCategory = (routes: string[], currentPath: string): boolean => {
    return routes.some(route => {
      if (route.includes('[')) {
        return matchesRoute(route, currentPath);
      }
      return route === currentPath;
    });
  };

  // Determine route category
  const getRouteCategory = (path: string) => {
    if (isRouteInCategory(ROUTE_CONFIG.public, path)) return 'public';
    if (isRouteInCategory(ROUTE_CONFIG.admin, path)) return 'admin';
    if (isRouteInCategory(ROUTE_CONFIG.producer, path)) return 'producer';
    if (isRouteInCategory(ROUTE_CONFIG.producerOrAdmin, path)) return 'producerOrAdmin';
    if (isRouteInCategory(ROUTE_CONFIG.protected, path)) return 'protected';
    
    // Default to protected for unknown routes
    return 'protected';
  };

  const routeCategory = getRouteCategory(pathname);

  // Handle route protection logic - MUST be called before any early returns
  useEffect(() => {
    if (isLoading) return; // Wait for auth to load

    switch (routeCategory) {
      case 'public':
        // No protection needed
        break;

      case 'protected':
        if (!isAuthenticated) {
          router.push('/');
          return;
        }
        break;

      case 'admin':
        if (!isAuthenticated || user?.role !== 'admin') {
          router.push('/');
          return;
        }
        break;

      case 'producer':
        if (!isAuthenticated || user?.role !== 'producer') {
          router.push('/');
          return;
        }
        break;

      case 'producerOrAdmin':
        if (!isAuthenticated || (user?.role !== 'producer' && user?.role !== 'admin')) {
          router.push('/');
          return;
        }
        break;

      default:
        // Unknown route, treat as protected
        if (!isAuthenticated) {
          router.push('/');
          return;
        }
    }
  }, [isAuthenticated, user?.role, routeCategory, router, isLoading]);

  // Show loading while auth is being determined
  if (isLoading) {
    return <AppLoader />;
  }

  // For non-public routes, don't render until auth is confirmed
  if (routeCategory !== 'public') {
    switch (routeCategory) {
      case 'protected':
        if (!isAuthenticated) return null;
        break;
      case 'admin':
        if (!isAuthenticated || user?.role !== 'admin') return null;
        break;
      case 'producer':
        if (!isAuthenticated || user?.role !== 'producer') return null;
        break;
      case 'producerOrAdmin':
        if (!isAuthenticated || (user?.role !== 'producer' && user?.role !== 'admin')) return null;
        break;
    }
  }

  return <>{children}</>;
}

// Export route configuration for external use
export { ROUTE_CONFIG };
