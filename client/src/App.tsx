import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/ThemeProvider";
import Home from "@/pages/Home";
import Products from "@/pages/Products";
import TryOn from "@/pages/TryOn";
import Profile from "@/pages/Profile";
import Cart from "@/pages/Cart";
import ProducerDashboard from "@/pages/ProducerDashboard";
import AdminDashboard from "@/pages/AdminDashboard";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/products" component={Products} />
      <Route path="/try-on" component={TryOn} />
      <Route path="/profile" component={Profile} />
      <Route path="/cart" component={Cart} />
      
      {/* Producer Routes */}
      <Route path="/producer-dashboard" component={ProducerDashboard} />
      <Route path="/producer-products" component={Products} />
      <Route path="/producer-orders" component={Profile} />
      <Route path="/producer-analytics" component={Profile} />
      
      {/* Admin Routes */}
      <Route path="/admin-dashboard" component={AdminDashboard} />
      <Route path="/admin-users" component={Profile} />
      <Route path="/admin-products" component={Products} />
      <Route path="/admin-orders" component={Profile} />
      
      {/* Fallback to 404 */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="system" storageKey="nyambika-ui-theme">
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
