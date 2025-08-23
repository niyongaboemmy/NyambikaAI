import React from "react";
import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/ThemeProvider";
import { AuthProvider } from "@/contexts/AuthContext";
import { CartProvider } from "@/contexts/CartContext";
import { useAuth } from "@/contexts/AuthContext";
import { LoginPromptProvider, } from "@/contexts/LoginPromptContext";
import { useLoginPrompt } from "@/contexts/LoginPromptContext";
import { CompanyProvider } from "@/contexts/CompanyContext";
import CompanyModal from "@/components/CompanyModal";
import LoginModal from "@/components/LoginModal";
import RoleBasedNavigation from "@/components/RoleBasedNavigation";
import Home from "@/pages/Home";
import Products from "@/pages/Products";
import TryOn from "@/pages/TryOn";
import TryOnStart from "@/pages/TryOnStart";
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
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/register" component={Register} />
      <Route path="/forgot-password" component={ForgotPassword} />

      {/* Protected routes */}
      <Route path="/products" component={() => <ProtectedRoute component={Products} />} />
      <Route path="/companies" component={() => <ProtectedRoute component={Companies} />} />
      <Route path="/try-on/start" component={() => <ProtectedRoute component={TryOnStart} />} />
      <Route path="/try-on" component={() => <ProtectedRoute component={TryOn} />} />
      <Route path="/product/:id" component={() => <ProtectedRoute component={ProductDetail} />} />
      <Route path="/checkout" component={() => <ProtectedRoute component={Checkout} />} />
      <Route path="/profile" component={() => <ProtectedRoute component={Profile} />} />
      <Route path="/cart" component={() => <ProtectedRoute component={Cart} />} />
      <Route path="/orders" component={() => <ProtectedRoute component={Orders} />} />
      <Route path="/product-registration" component={() => <ProtectedRoute component={ProductRegistration} />} />
      <Route path="/product-edit/:id" component={() => <ProtectedRoute component={ProductEdit} />} />

      {/* Producer Routes (protected) */}
      <Route path="/producer-dashboard" component={() => <ProtectedRoute component={ProducerDashboard} />} />
      <Route path="/producer-products" component={() => <ProtectedRoute component={Products} />} />
      <Route path="/producer-orders" component={() => <ProtectedRoute component={Profile} />} />
      <Route path="/producer-analytics" component={() => <ProtectedRoute component={Profile} />} />

      {/* Admin Routes (protected) */}
      <Route
        path="/admin-dashboard"
        component={() => <AdminRoute component={AdminDashboard} />}
      />
      <Route
        path="/admin-users"
        component={() => <AdminRoute component={Profile} />}
      />
      <Route
        path="/admin-products"
        component={() => <AdminRoute component={Products} />}
      />
      <Route
        path="/admin-orders"
        component={() => <AdminRoute component={Orders} />}
      />
      <Route
        path="/admin-categories"
        component={() => <AdminRoute component={AdminCategories} />}
      />

      {/* Fallback to 404 */}
      <Route component={NotFound} />
    </Switch>
  );
}

function AuthPromptOnStart() {
  const { isAuthenticated, isLoading } = useAuth();
  const { isOpen, open } = useLoginPrompt();
  const [location] = useLocation();

  // Only prompt once per session unless user logs in
  React.useEffect(() => {
    if (isLoading) return;
    const onAuthPromptShown = sessionStorage.getItem("auth_prompt_shown") === "1";
    const isAuthRoute = location === "/register" || location === "/forgot-password";
    const isHome = location === "/";
    if (!isAuthenticated && !isAuthRoute && !isHome && !isOpen && !onAuthPromptShown) {
      open();
      sessionStorage.setItem("auth_prompt_shown", "1");
    }
  }, [isAuthenticated, isLoading, isOpen, open, location]);

  return null;
}

function ProtectedRoute({ component: Component }: { component: React.ComponentType<any> }) {
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
      </ThemeProvider>
    </QueryClientProvider>
  );
}
