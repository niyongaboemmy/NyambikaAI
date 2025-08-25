import React from "react";
import { Switch, Route, useLocation } from "wouter";
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
import Home from "@/pages/Home";
import Products from "@/pages/Products";
import TryOn from "@/pages/TryOn";
import ProductDetail from "@/pages/ProductDetail";
import Checkout from "@/pages/Checkout";
import Profile from "@/pages/Profile";
import Cart from "@/pages/Cart";
import ProducerDashboard from "@/pages/ProducerDashboard";
import AdminDashboard from "@/pages/AdminDashboard";
import AdminCategories from "@/pages/AdminCategories";
import Orders from "@/pages/Orders";
// Login page removed in favor of modal-only login
import Register from "@/pages/Register";
import ForgotPassword from "@/pages/ForgotPassword";
import NotFound from "@/pages/not-found";
import ProductRegistration from "@/pages/ProductRegistration";
import ProductEdit from "@/pages/ProductEdit";
import Companies from "@/pages/Companies";
import StorePage from "@/pages/StorePage";
import Footer from "./components/Footer";
import TryOnStart from "./pages/TryOnStart";

function AdminRoute({
  component: Component,
}: {
  component: React.ComponentType<any>;
}) {
  const { user, isAuthenticated, isLoading } = useAuth();
  const { open } = useLoginPrompt();
  if (isLoading) return null;
  if (!isAuthenticated) {
    open();
    return null;
  }
  if (user?.role !== "admin") return null;
  return <Component />;
}

function Router() {
  // Local layout wrapper to apply a consistent container on most routes
  const Container = ({ children }: { children: React.ReactNode }) => (
    <div className="container mx-auto px-3 md:px-0">{children}</div>
  );

  return (
    <>
      <Switch>
        <Route
          path="/"
          component={() => (
            <Container>
              <Home />
            </Container>
          )}
        />
        <Route
          path="/register"
          component={() => (
            <Container>
              <Register />
            </Container>
          )}
        />
        <Route
          path="/forgot-password"
          component={() => (
            <Container>
              <ForgotPassword />
            </Container>
          )}
        />

        {/* Protected routes */}
        <Route
          path="/products"
          component={() => (
            <Container>
              <ProtectedRoute component={Products} />
            </Container>
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
        {/* Store page should NOT be wrapped to allow full-bleed design */}
        <Route path="/store/:companyId" component={StorePage} />
        <Route
          path="/try-on/start"
          component={() => (
            <ProtectedRoute component={TryOnStart} showLoadingSkeleton={true} />
          )}
        />
        <Route
          path="/try-on"
          component={() => <ProtectedRoute component={TryOn} />}
        />
        <Route
          path="/product/:id"
          component={() => <ProtectedRoute component={ProductDetail} />}
        />
        <Route
          path="/checkout"
          component={() => (
            <Container>
              <ProtectedRoute component={Checkout} />
            </Container>
          )}
        />
        <Route
          path="/profile"
          component={() => <ProtectedRoute component={Profile} />}
        />
        <Route
          path="/cart"
          component={() => (
            <Container>
              <ProtectedRoute component={Cart} />
            </Container>
          )}
        />
        <Route
          path="/orders"
          component={() => (
            <Container>
              <ProtectedRoute component={Orders} />
            </Container>
          )}
        />
        <Route
          path="/product-registration"
          component={() => (
            <Container>
              <ProtectedRoute component={ProductRegistration} />
            </Container>
          )}
        />
        <Route
          path="/product-edit/:id"
          component={() => (
            <Container>
              <ProtectedRoute component={ProductEdit} />
            </Container>
          )}
        />

        {/* Producer Routes (protected) */}
        <Route
          path="/producer-dashboard"
          component={() => (
            <Container>
              <ProtectedRoute component={ProducerDashboard} />
            </Container>
          )}
        />
        <Route
          path="/producer-products"
          component={() => (
            <Container>
              <ProtectedRoute component={Products} />
            </Container>
          )}
        />
        <Route
          path="/producer-orders"
          component={() => (
            <Container>
              <ProtectedRoute component={Profile} />
            </Container>
          )}
        />
        <Route
          path="/producer-analytics"
          component={() => (
            <Container>
              <ProtectedRoute component={Profile} />
            </Container>
          )}
        />

        {/* Admin Routes (protected) */}
        <Route
          path="/admin-dashboard"
          component={() => (
            <Container>
              <AdminRoute component={AdminDashboard} />
            </Container>
          )}
        />
        <Route
          path="/admin-users"
          component={() => (
            <Container>
              <AdminRoute component={Profile} />
            </Container>
          )}
        />
        <Route
          path="/admin-products"
          component={() => (
            <Container>
              <AdminRoute component={Products} />
            </Container>
          )}
        />
        <Route
          path="/admin-orders"
          component={() => (
            <Container>
              <AdminRoute component={Orders} />
            </Container>
          )}
        />
        <Route
          path="/admin-categories"
          component={() => (
            <Container>
              <AdminRoute component={AdminCategories} />
            </Container>
          )}
        />

        {/* Fallback to 404 */}
        <Route
          component={() => (
            <Container>
              <NotFound />
            </Container>
          )}
        />
      </Switch>
      <Footer />
    </>
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
    return null;
  }

  if (!isAuthenticated) return null;
  return <Component />;
}

export default function App() {
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
                    <Router />
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
