import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Eye,
  Clock,
  CheckCircle,
  Package,
  Truck,
  Calendar,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import React from "react";

interface ProducerOrderItem {
  id: string;
  productId: string;
  quantity: number;
  price: string;
  product?: { id: string; name: string; imageUrl?: string };
}

interface ProducerOrder {
  id: string;
  total: string;
  status:
    | "pending"
    | "confirmed"
    | "processing"
    | "shipped"
    | "delivered"
    | "cancelled";
  paymentMethod: string;
  shippingAddress: string;
  createdAt: string;
  items: ProducerOrderItem[];
}

const statusConfig = {
  pending: {
    color:
      "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
    label: "Pending",
    icon: Clock,
  },
  confirmed: {
    color: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
    label: "Confirmed",
    icon: CheckCircle,
  },
  processing: {
    color:
      "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400",
    label: "Processing",
    icon: Package,
  },
  shipped: {
    color:
      "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400",
    label: "Shipped",
    icon: Truck,
  },
  delivered: {
    color:
      "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
    label: "Delivered",
    icon: CheckCircle,
  },
  cancelled: {
    color: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
    label: "Cancelled",
    icon: Clock,
  },
} as const;

export default function ProducerOrders() {
  const [, setLocation] = useLocation();
  const { user, isLoading: authLoading, isAuthenticated } = useAuth();

  // Client-side role guard
  React.useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated) return; // ProtectedRoute will prompt login
    const role = user?.role;
    if (role !== "producer" && role !== "admin") {
      setLocation("/");
    }
  }, [authLoading, isAuthenticated, user?.role, setLocation]);
  const {
    data: orders = [],
    isLoading,
    error,
  } = useQuery<ProducerOrder[]>({
    queryKey: ["/api/producer/orders"],
  });

  const formatPrice = (price: string | number) => {
    const numPrice = typeof price === "string" ? parseFloat(price) : price;
    return new Intl.NumberFormat("en-RW", {
      style: "currency",
      currency: "RWF",
      minimumFractionDigits: 0,
    }).format(numPrice);
  };
  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString("en-RW", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

  if (isLoading) {
    return (
      <div className="">
        <div className="container mx-auto px-4 py-8">
          <Skeleton className="h-8 w-48 mb-4" />
          <div className="space-y-3">
            {[...Array(4)].map((_, i) => (
              <Card key={i} className="p-4">
                <Skeleton className="h-6 w-1/3 mb-2" />
                <Skeleton className="h-4 w-1/2" />
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="">
        <div className="max-w-2xl mx-auto px-4 py-16 text-center">
          <Card className="p-8">
            <h2 className="text-2xl font-bold mb-2">
              Failed to load producer orders
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Please try again shortly.
            </p>
            <Button
              onClick={() => window.location.reload()}
              className="gradient-bg text-white"
            >
              Retry
            </Button>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="">
      <div className="sticky top-0 z-50 glassmorphism border-b border-white/20">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-xl font-bold gradient-text">Producer Orders</h1>
          <div className="w-20" />
        </div>
      </div>

      <main className="max-w-4xl mx-auto px-4 py-8 space-y-4">
        {orders.length === 0 ? (
          <Card className="p-8 text-center">
            <p className="text-gray-600 dark:text-gray-400">No orders yet.</p>
          </Card>
        ) : (
          orders.map((order) => {
            const StatusIcon = statusConfig[order.status].icon;
            return (
              <Card key={order.id} className="floating-card">
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <StatusIcon className="h-5 w-5" />
                    <span>Order #{order.id.slice(0, 8)}</span>
                  </CardTitle>
                  <Badge className={statusConfig[order.status].color}>
                    {statusConfig[order.status].label}
                  </Badge>
                </CardHeader>
                <CardContent className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      <span>{formatDate(order.createdAt)}</span>
                    </div>
                    <div>Items: {order.items.length}</div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="font-semibold text-primary">
                      {formatPrice(order.total)}
                    </div>
                    <Button
                      className="gradient-bg text-white"
                      onClick={() => setLocation(`/orders/${order.id}`)}
                    >
                      <Eye className="h-4 w-4 mr-2" /> View Details
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </main>
    </div>
  );
}
