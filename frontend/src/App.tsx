import React, { Suspense } from "react";
import { Switch, Route, useLocation, Link } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/theme-provider";
import { AuthProvider } from "@/contexts/AuthContext";
import { CartProvider } from "@/contexts/CartContext";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { LoginPromptProvider } from "@/contexts/LoginPromptContext";
import { useLoginPrompt } from "@/contexts/LoginPromptContext";
import { CompanyProvider } from "@/contexts/CompanyContext";
import CompanyModal from "@/components/CompanyModal";
import LoginModal from "@/components/LoginModal";
import RoleBasedNavigation from "@/components/RoleBasedNavigation";
import Footer from "./components/Footer";
import AnimatedAIBackground from "./components/layout/AnimatedAIBackground";
import { Plus } from "lucide-react";

// Optimized lazy loading with preloading for better performance
const Home = React.lazy(() => import("@/pages/Home"));

// Floating Add Product Button for producer/admin
function AddProductFAB() {
  const { user } = useAuth();
  const [location] = useLocation();
  const canAdd = user?.role === "producer" || user?.role === "admin";
  // Hide on the product registration page itself
  if (
    !canAdd ||
    location === "/product-registration" ||
    location.includes("product-edit")
  )
    return null;
  return (
    <div className="fixed bottom-6 right-6 z-50">
      <Link
        href="/product-registration"
        className="group"
        aria-label="Add product"
      >
        <div className="relative">
          <div className="absolute -inset-2 rounded-full bg-gradient-to-r from-blue-500/25 via-purple-500/25 to-indigo-500/25 blur-xl opacity-60 group-hover:opacity-90 transition" />
          <button className="relative inline-flex items-center gap-2 px-5 py-3 rounded-full text-white shadow-lg shadow-blue-500/20 bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 hover:from-blue-500 hover:via-purple-500 hover:to-indigo-500 transition">
            <Plus className="h-5 w-5" />
            <span className="hidden sm:block text-sm font-semibold">
              Add Product
            </span>
          </button>
        </div>
      </Link>
    </div>
  );
}
const Products = React.lazy(() => import("@/pages/Products"));
const TryOn = React.lazy(() => import("@/pages/TryOn"));
const ProductDetail = React.lazy(() => import("@/pages/ProductDetail"));
const Checkout = React.lazy(() => import("@/pages/Checkout"));
const Profile = React.lazy(() => import("@/pages/Profile"));
const Cart = React.lazy(() => import("@/pages/Cart"));
const ProducerDashboard = React.lazy(() => import("@/pages/ProducerDashboard"));
const AdminDashboard = React.lazy(() => import("@/pages/AdminDashboard"));
const AdminCategories = React.lazy(() => import("@/pages/AdminCategories"));
const Orders = React.lazy(() => import("@/pages/Orders"));
const OrderDetailsPage = React.lazy(() => import("@/pages/OrderDetailsPage"));
const ProducerOrders = React.lazy(() => import("@/pages/ProducerOrders"));
const Register = React.lazy(() => import("@/pages/Register"));
const ForgotPassword = React.lazy(() => import("@/pages/ForgotPassword"));
const NotFound = React.lazy(() => import("@/pages/not-found"));
const ProductRegistration = React.lazy(
  () => import("@/pages/ProductRegistration")
);
const ProductEdit = React.lazy(() => import("@/pages/ProductEdit"));
const Companies = React.lazy(() => import("@/pages/Companies"));
const StorePage = React.lazy(() => import("@/pages/StorePage"));
const TryOnStart = React.lazy(() => import("./pages/TryOnStart"));

// Preload critical components after initial load
const preloadCriticalComponents = () => {
  // Preload most commonly accessed pages immediately after initial render
  setTimeout(() => {
    import("@/pages/Products");
    import("@/pages/TryOnStart");
    import("@/pages/Profile");
  }, 100); // Reduced from 2000ms to 100ms for faster preloading

  // Preload secondary pages after a short delay
  setTimeout(() => {
    import("@/pages/Companies");
    import("@/pages/Cart");
    import("@/pages/Orders");
  }, 500);
};

// Fast mini loading component for quick transitions
const MiniLoader = () => (
  <div className="flex items-center justify-center py-8">
    <div className="relative">
      <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 via-purple-500 to-indigo-500 animate-spin">
        <div className="absolute top-1 right-1 w-1.5 h-1.5 bg-white rounded-full" />
      </div>
      <div className="absolute -inset-2 bg-gradient-to-r from-blue-400/20 via-purple-400/20 to-indigo-400/20 rounded-full blur-lg animate-pulse" />
    </div>
  </div>
);

// Modern AI-inspired loading fallback with cute animations
const LoadingFallback = ({ type = "default" }: { type?: string }) => (
  <div className="fixed inset-0 bg-gradient-to-br from-slate-50/95 via-blue-50/90 to-purple-50/85 dark:from-black/95 dark:via-slate-950/90 dark:to-purple-950/85 backdrop-blur-sm flex items-center justify-center z-50">
    {/* Animated AI Background Particles */}
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {/* Floating AI Orbs */}
      <div
        className="absolute top-20 left-20 w-32 h-32 bg-gradient-to-r from-blue-400/10 via-purple-400/15 to-cyan-400/10 rounded-full blur-2xl animate-pulse"
        style={{ animationDuration: "3s" }}
      />
      <div
        className="absolute top-40 right-32 w-24 h-24 bg-gradient-to-r from-pink-400/10 via-purple-400/15 to-indigo-400/10 rounded-full blur-xl animate-bounce"
        style={{ animationDuration: "4s" }}
      />
      <div
        className="absolute bottom-32 left-40 w-20 h-20 bg-gradient-to-r from-emerald-400/10 via-teal-400/15 to-cyan-400/10 rounded-full blur-xl animate-pulse"
        style={{ animationDuration: "2.5s" }}
      />

      {/* Neural Network Grid Pattern */}
      <div className="absolute inset-0 opacity-20 dark:opacity-10">
        <div className="absolute top-1/4 left-1/4 w-px h-32 bg-gradient-to-b from-transparent via-blue-400/30 to-transparent" />
        <div className="absolute top-1/3 right-1/3 w-24 h-px bg-gradient-to-r from-transparent via-purple-400/30 to-transparent" />
        <div className="absolute bottom-1/3 left-1/2 w-px h-20 bg-gradient-to-b from-transparent via-cyan-400/30 to-transparent" />
      </div>
    </div>

    {/* Main Loading Content */}
    <div className="relative text-center">
      {/* AI Brain Icon with Multiple Rotating Rings */}
      <div className="relative mb-8">
        {/* Outer rotating ring */}
        <div
          className="absolute inset-0 w-20 h-20 mx-auto rounded-full border-2 border-transparent bg-gradient-to-r from-blue-500/30 via-purple-500/30 to-cyan-500/30 animate-spin"
          style={{ animationDuration: "3s" }}
        >
          <div className="absolute top-1 right-1 w-2 h-2 bg-blue-400 rounded-full animate-pulse" />
          <div
            className="absolute bottom-1 left-1 w-2 h-2 bg-purple-400 rounded-full animate-pulse"
            style={{ animationDelay: "0.5s" }}
          />
        </div>

        {/* Middle counter-rotating ring */}
        <div
          className="absolute inset-2 w-16 h-16 mx-auto rounded-full border-2 border-transparent bg-gradient-to-l from-purple-500/40 via-indigo-500/40 to-pink-500/40 animate-spin"
          style={{ animationDuration: "2s", animationDirection: "reverse" }}
        >
          <div
            className="absolute top-0 left-1/2 w-1.5 h-1.5 bg-indigo-400 rounded-full animate-pulse"
            style={{ animationDelay: "0.3s" }}
          />
        </div>

        {/* Inner core with AI brain */}
        <div className="relative w-12 h-12 mx-auto rounded-2xl bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-700 dark:from-blue-500 dark:via-purple-500 dark:to-indigo-600 flex items-center justify-center shadow-xl">
          {/* AI Brain Icon */}
          <svg
            className="w-6 h-6 text-white animate-pulse"
            fill="currentColor"
            viewBox="0 0 24 24"
          >
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
          </svg>
        </div>

        {/* Pulsing glow effect */}
        <div
          className="absolute -inset-4 bg-gradient-to-r from-blue-400/20 via-purple-400/30 to-indigo-400/20 rounded-full blur-2xl animate-pulse"
          style={{ animationDuration: "2s" }}
        />
      </div>

      {/* AI-themed Loading Text */}
      <div className="space-y-3">
        <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 dark:from-blue-400 dark:via-purple-400 dark:to-indigo-400 bg-clip-text text-transparent">
          ✨ AI Loading {type === "page" ? "Experience" : "Content"}
        </h2>

        {/* Animated dots */}
        <div className="flex items-center justify-center space-x-1">
          <div className="flex space-x-1">
            <div
              className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"
              style={{ animationDelay: "0s" }}
            />
            <div
              className="w-2 h-2 bg-purple-500 rounded-full animate-bounce"
              style={{ animationDelay: "0.1s" }}
            />
            <div
              className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce"
              style={{ animationDelay: "0.2s" }}
            />
          </div>
        </div>

        {/* Status text */}
        <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">
          Neural networks processing...
        </p>
      </div>

      {/* Bottom progress indicator */}
      <div className="mt-8 w-48 mx-auto">
        <div className="h-1 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-blue-500 via-purple-500 to-indigo-500 rounded-full animate-pulse"
            style={{
              width: "60%",
              animation: "pulse 1.5s ease-in-out infinite",
            }}
          />
        </div>
      </div>
    </div>
  </div>
);

function AdminRoute({
  component: Component,
}: {
  component: React.ComponentType<any>;
}) {
  const { user, isAuthenticated, isLoading } = useAuth();
  const { open } = useLoginPrompt();
  if (isLoading) return <LoadingFallback />;
  if (!isAuthenticated) {
    open();
    return null;
  }
  if (user?.role !== "admin") return null;
  return (
    <Suspense fallback={<LoadingFallback />}>
      <Component />
    </Suspense>
  );
}

function AuthPromptOnStart() {
  const { isAuthenticated, isLoading } = useAuth();
  const { isOpen, open } = useLoginPrompt();
  const [location] = useLocation();

  // Only prompt once per session unless user logs in
  React.useEffect(() => {
    if (isLoading) return;
    const onAuthPromptShown =
      sessionStorage.getItem("auth_prompt_shown") === "1";
    const isAuthRoute =
      location === "/register" || location === "/forgot-password";
    const isHome = location === "/";
    if (
      !isAuthenticated &&
      !isAuthRoute &&
      !isHome &&
      !isOpen &&
      !onAuthPromptShown
    ) {
      open();
      sessionStorage.setItem("auth_prompt_shown", "1");
    }
  }, [isAuthenticated, isLoading, isOpen, open, location]);

  return null;
}

function ProtectedRoute({
  component: Component,
  showLoadingSkeleton = false,
  skeletonType = "default",
}: {
  component: React.ComponentType<any>;
  showLoadingSkeleton?: boolean;
  skeletonType?: "default" | "companies";
}) {
  const { isAuthenticated, isLoading } = useAuth();
  const { open } = useLoginPrompt();
  React.useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      open();
    }
  }, [isAuthenticated, isLoading, open]);

  if (isLoading) {
    if (showLoadingSkeleton) {
      if (skeletonType === "companies") {
        return (
          <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-gray-950 dark:via-gray-950 dark:to-black relative overflow-hidden pt-10">
            {/* AI-Motivated Animated Background */}
            <div className="fixed inset-0 pointer-events-none">
              <div className="absolute top-10 left-10 w-40 h-40 bg-gradient-to-r from-blue-400/20 via-purple-400/20 to-pink-400/20 rounded-full blur-3xl animate-pulse" />
              <div
                className="absolute bottom-10 right-10 w-56 h-56 bg-gradient-to-r from-cyan-400/20 via-blue-400/20 to-indigo-400/20 rounded-full blur-3xl animate-bounce"
                style={{ animationDuration: "3s" }}
              />
            </div>

            <main className="relative z-10 pt-6 pb-12">
              {/* Compact Header Skeleton */}
              <div className="flex items-center justify-between mb-6 px-4">
                <div>
                  <div className="h-6 w-40 rounded bg-gray-200 dark:bg-gray-700 animate-pulse mb-1" />
                  <div className="h-4 w-32 rounded bg-gray-200 dark:bg-gray-700 animate-pulse" />
                </div>
                <div className="flex items-center gap-3">
                  {[...Array(2)].map((_, i) => (
                    <div
                      key={i}
                      className="h-6 w-12 rounded-full bg-gray-200 dark:bg-gray-700 animate-pulse"
                    />
                  ))}
                </div>
              </div>

              {/* Combined Search and Sort Skeleton */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6 px-4">
                <div className="w-full sm:w-auto sm:flex-1 max-w-md">
                  <div className="h-10 w-full rounded-xl bg-gray-200 dark:bg-gray-700 animate-pulse" />
                </div>
                <div className="flex gap-2">
                  {[...Array(3)].map((_, i) => (
                    <div
                      key={i}
                      className="h-7 w-16 rounded-lg bg-gray-200 dark:bg-gray-700 animate-pulse"
                    />
                  ))}
                </div>
              </div>

              {/* Companies Grid Skeleton */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 px-4">
                {[...Array(12)].map((_, index) => (
                  <div
                    key={index}
                    className="bg-white/90 dark:bg-gray-900/50 rounded-2xl p-4 border border-gray-200/50 dark:border-gray-700/50 backdrop-blur-sm"
                  >
                    {/* Company Logo Skeleton */}
                    <div className="flex justify-center mb-3">
                      <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-gray-200 to-blue-100 dark:from-gray-700 dark:to-gray-600 animate-pulse" />
                    </div>

                    {/* Company Info Skeleton */}
                    <div className="text-center space-y-2">
                      <div className="h-4 w-full rounded bg-gray-200 dark:bg-gray-700 animate-pulse" />
                      <div className="h-3 w-3/4 mx-auto rounded bg-gray-200 dark:bg-gray-700 animate-pulse" />

                      {/* Metrics Skeleton */}
                      <div className="flex justify-center gap-2 mt-3">
                        <div className="h-3 w-8 rounded bg-gray-200 dark:bg-gray-700 animate-pulse" />
                        <div className="h-3 w-12 rounded bg-gray-200 dark:bg-gray-700 animate-pulse" />
                      </div>

                      {/* Button Skeleton */}
                      <div className="h-8 w-full rounded-xl mt-4 bg-gray-200 dark:bg-gray-700 animate-pulse" />
                    </div>
                  </div>
                ))}
              </div>
            </main>
          </div>
        );
      }

      // Default TryOnStart skeleton
      return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-gray-950 dark:via-gray-950 dark:to-black relative overflow-hidden pt-10">
          {/* AI-Motivated Animated Background */}
          <div className="fixed inset-0 pointer-events-none">
            <div className="absolute top-10 left-10 w-40 h-40 bg-gradient-to-r from-blue-400/20 via-purple-400/20 to-pink-400/25 rounded-full blur-3xl animate-pulse" />
            <div
              className="absolute top-20 right-20 w-32 h-32 bg-gradient-to-r from-emerald-400/15 via-teal-400/20 to-cyan-400/15 rounded-full blur-2xl animate-bounce"
              style={{ animationDuration: "6s" }}
            />
            <div
              className="absolute bottom-32 left-16 w-28 h-28 bg-gradient-to-r from-violet-400/10 via-purple-400/15 to-indigo-400/10 rounded-full blur-2xl animate-pulse"
              style={{ animationDuration: "4s" }}
            />
          </div>

          <main className="relative z-10 min-h-screen">
            <div className="text-center py-20">
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center animate-pulse">
                <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full animate-spin" />
              </div>
              <h2 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
                ✨ Loading The Page
              </h2>
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                Preparing your AI fashion experience...
              </p>
            </div>
          </main>
        </div>
      );
    }
    return <LoadingFallback />;
  }

  if (!isAuthenticated) return null;
  return (
    <Suspense fallback={<LoadingFallback />}>
      <Component />
    </Suspense>
  );
}

export default function App() {
  // Preload critical components after app initialization
  React.useEffect(() => {
    preloadCriticalComponents();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="system" storageKey="nyambika-ui-theme">
        <LanguageProvider>
          <TooltipProvider>
            <AuthProvider>
              <LoginPromptProvider>
                <CompanyProvider>
                  <CartProvider>
                    <RoleBasedNavigation />
                    <AnimatedAIBackground>
                      <div className="min-h-screen">
                        <Switch>
                          {/* Store page should NOT be wrapped to allow full-bleed design */}
                          <Route
                            path="/store/:companyId"
                            component={() => (
                              <Suspense fallback={<LoadingFallback />}>
                                <StorePage />
                              </Suspense>
                            )}
                          />

                          {/* All other routes wrapped in container */}
                          <Route
                            path="/"
                            component={() => (
                              <div className="container mx-auto px-3 md:px-0">
                                <Suspense fallback={<MiniLoader />}>
                                  <Home />
                                </Suspense>
                              </div>
                            )}
                          />
                          <Route
                            path="/register"
                            component={() => (
                              <Suspense fallback={<MiniLoader />}>
                                <Register />
                              </Suspense>
                            )}
                          />
                          <Route
                            path="/forgot-password"
                            component={() => (
                              <div className="container mx-auto px-3 md:px-0">
                                <Suspense fallback={<MiniLoader />}>
                                  <ForgotPassword />
                                </Suspense>
                              </div>
                            )}
                          />

                          {/* Protected routes */}
                          <Route
                            path="/products"
                            component={() => (
                              <div className="container mx-auto px-3 md:px-0">
                                <Suspense fallback={<MiniLoader />}>
                                  <ProtectedRoute component={Products} />
                                </Suspense>
                              </div>
                            )}
                          />
                          <Route
                            path="/companies"
                            component={() => (
                              <ProtectedRoute
                                component={Companies}
                                showLoadingSkeleton={true}
                                skeletonType="companies"
                              />
                            )}
                          />
                          <Route
                            path="/try-on/start"
                            component={() => (
                              <ProtectedRoute
                                component={TryOnStart}
                                showLoadingSkeleton={true}
                              />
                            )}
                          />
                          <Route
                            path="/try-on"
                            component={() => (
                              <ProtectedRoute component={TryOn} />
                            )}
                          />
                          <Route
                            path="/product/:id"
                            component={() => (
                              <div className="container mx-auto px-3 md:px-0">
                                <ProtectedRoute component={ProductDetail} />
                              </div>
                            )}
                          />
                          <Route
                            path="/checkout"
                            component={() => (
                              <div className="container mx-auto px-3 md:px-0">
                                <ProtectedRoute component={Checkout} />
                              </div>
                            )}
                          />
                          <Route
                            path="/profile"
                            component={() => (
                              <div className="container mx-auto px-3 md:px-0">
                                <ProtectedRoute component={Profile} />
                              </div>
                            )}
                          />
                          <Route
                            path="/cart"
                            component={() => (
                              <div className="container mx-auto px-3 md:px-0">
                                <Suspense fallback={<MiniLoader />}>
                                  <ProtectedRoute component={Cart} />
                                </Suspense>
                              </div>
                            )}
                          />
                          <Route
                            path="/orders"
                            component={() => (
                              <div className="container mx-auto px-3 md:px-0">
                                <Suspense fallback={<MiniLoader />}>
                                  <ProtectedRoute component={Orders} />
                                </Suspense>
                              </div>
                            )}
                          />
                          <Route
                            path="/orders/:id"
                            component={() => (
                              <div className="container mx-auto px-3 md:px-0">
                                <Suspense fallback={<MiniLoader />}>
                                  <ProtectedRoute
                                    component={OrderDetailsPage}
                                  />
                                </Suspense>
                              </div>
                            )}
                          />
                          <Route
                            path="/product-registration"
                            component={() => (
                              <Suspense fallback={<MiniLoader />}>
                                <ProtectedRoute
                                  component={ProductRegistration}
                                />
                              </Suspense>
                            )}
                          />
                          <Route
                            path="/product-edit/:id"
                            component={() => (
                              <div className="container mx-auto px-3 md:px-0">
                                <Suspense fallback={<MiniLoader />}>
                                  <ProtectedRoute component={ProductEdit} />
                                </Suspense>
                              </div>
                            )}
                          />

                          {/* Producer Routes (protected) */}
                          <Route
                            path="/producer-dashboard"
                            component={() => (
                              <div className="container mx-auto px-3 md:px-0">
                                <ProtectedRoute component={ProducerDashboard} />
                              </div>
                            )}
                          />
                          <Route
                            path="/producer-products"
                            component={() => (
                              <div className="container mx-auto px-3 md:px-0">
                                <ProtectedRoute component={Products} />
                              </div>
                            )}
                          />
                          <Route
                            path="/producer-orders"
                            component={() => (
                              <div className="container mx-auto px-3 md:px-0">
                                <ProtectedRoute component={ProducerOrders} />
                              </div>
                            )}
                          />
                          <Route
                            path="/producer-analytics"
                            component={() => (
                              <div className="container mx-auto px-3 md:px-0">
                                <ProtectedRoute component={Profile} />
                              </div>
                            )}
                          />

                          {/* Admin Routes (protected) */}
                          <Route
                            path="/admin-dashboard"
                            component={() => (
                              <div className="container mx-auto px-3 md:px-0">
                                <AdminRoute component={AdminDashboard} />
                              </div>
                            )}
                          />
                          <Route
                            path="/admin-users"
                            component={() => (
                              <div className="container mx-auto px-3 md:px-0">
                                <AdminRoute component={Profile} />
                              </div>
                            )}
                          />
                          <Route
                            path="/admin-products"
                            component={() => (
                              <div className="container mx-auto px-3 md:px-0">
                                <AdminRoute component={Products} />
                              </div>
                            )}
                          />
                          <Route
                            path="/admin-orders"
                            component={() => (
                              <div className="container mx-auto px-3 md:px-0">
                                <AdminRoute component={Orders} />
                              </div>
                            )}
                          />
                          <Route
                            path="/admin-categories"
                            component={() => (
                              <div className="container mx-auto px-3 md:px-0">
                                <AdminRoute component={AdminCategories} />
                              </div>
                            )}
                          />

                          {/* Fallback to 404 */}
                          <Route
                            component={() => (
                              <div className="container mx-auto px-3 md:px-0">
                                <Suspense fallback={<LoadingFallback />}>
                                  <NotFound />
                                </Suspense>
                              </div>
                            )}
                          />
                        </Switch>
                      </div>
                      <Footer />
                      <AddProductFAB />
                    </AnimatedAIBackground>
                    <AuthPromptOnStart />
                    <CompanyModal />
                    <LoginModal />
                    <Toaster />
                  </CartProvider>
                </CompanyProvider>
              </LoginPromptProvider>
            </AuthProvider>
          </TooltipProvider>
        </LanguageProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
