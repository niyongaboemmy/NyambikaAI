import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/ThemeProvider";
import { AuthProvider } from "@/contexts/AuthContext";
import { CartProvider } from "@/contexts/CartContext";
import { useAuth } from "@/contexts/AuthContext";
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
import Login from "@/pages/Login";
import Register from "@/pages/Register";
import AddProduct from "@/pages/AddProduct";
import NotFound from "@/pages/not-found";
import ProductRegistration from "@/pages/ProductRegistration";

function AdminRoute({
  component: Component,
}: {
  component: React.ComponentType<any>;
}) {
  const { user, isAuthenticated, isLoading } = useAuth();
  const [, setLocation] = useLocation();
  if (isLoading) return null;
  if (!isAuthenticated || user?.role !== "admin") {
    setLocation("/login");
    return null;
  }
  return <Component />;
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/products" component={Products} />
      <Route path="/try-on/start" component={TryOnStart} />
      <Route path="/try-on" component={TryOn} />
      <Route path="/product/:id" component={ProductDetail} />
      <Route path="/checkout" component={Checkout} />
      <Route path="/profile" component={Profile} />
      <Route path="/cart" component={Cart} />
      <Route path="/orders" component={Orders} />
      <Route path="/login" component={Login} />
      <Route path="/register" component={Register} />
      <Route path="/add-product" component={AddProduct} />
      <Route path="/product-registration" component={ProductRegistration} />

      {/* Producer Routes */}
      <Route path="/producer-dashboard" component={ProducerDashboard} />
      <Route path="/producer-products" component={Products} />
      <Route path="/producer-orders" component={Profile} />
      <Route path="/producer-analytics" component={Profile} />

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

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="light" storageKey="vite-ui-theme">
        <TooltipProvider>
          <AuthProvider>
            <CartProvider>
              <RoleBasedNavigation />
              <Router />
              <Toaster />
            </CartProvider>
          </AuthProvider>
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
