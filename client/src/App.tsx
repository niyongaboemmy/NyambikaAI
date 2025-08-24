import React from "react";
import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/ThemeProvider";
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
            <Container>
              <ProtectedRoute component={Companies} />
            </Container>
          )}
        />
        {/* Store page should NOT be wrapped to allow full-bleed design */}
        <Route path="/store/:companyId" component={StorePage} />
        <Route
          path="/try-on/start"
          component={() => <ProtectedRoute component={TryOnStart} />}
        />
        <Route
          path="/try-on"
          component={() => <ProtectedRoute component={TryOn} />}
        />
        <Route
          path="/product/:id"
          component={() => (
            <Container>
              <ProtectedRoute component={ProductDetail} />
            </Container>
          )}
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
          component={() => (
            <Container>
              <ProtectedRoute component={Profile} />
            </Container>
          )}
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
}: {
  component: React.ComponentType<any>;
}) {
  const { isAuthenticated, isLoading } = useAuth();
  const { open } = useLoginPrompt();
  React.useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      open();
    }
  }, [isAuthenticated, isLoading, open]);
  if (isLoading) return null;
  if (!isAuthenticated) return null;
  return <Component />;
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="light" storageKey="vite-ui-theme">
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
