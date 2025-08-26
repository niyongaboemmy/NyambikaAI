import { Camera, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { useAuth } from "@/contexts/AuthContext";

export default function FloatingActionButton() {
  const { user, isAuthenticated } = useAuth();
  const role = user?.role || "customer";

  // For producers and admins: provide quick access to Add Product
  if (isAuthenticated && (role === "producer" || role === "admin")) {
    return (
      <Link href="/product-registration">
        <Button
          className="fixed bottom-8 right-8 w-16 h-16 gradient-bg rounded-full flex items-center justify-center text-white shadow-2xl hover:scale-110 transition-all duration-300 z-40"
          title="Add Product"
          aria-label="Add Product"
        >
          <Plus className="h-6 w-6" />
        </Button>
      </Link>
    );
  }

  // Default (customers/guests): Keep Try-On quick access
  return (
    <Link href="/try-on/start">
      <Button
        className="fixed bottom-8 right-8 w-16 h-16 gradient-bg rounded-full flex items-center justify-center text-white shadow-2xl hover:scale-110 transition-all duration-300 z-40 animate-pulse-slow"
        title="AI Try-On"
        aria-label="AI Try-On"
      >
        <Camera className="h-6 w-6" />
      </Button>
    </Link>
  );
}
