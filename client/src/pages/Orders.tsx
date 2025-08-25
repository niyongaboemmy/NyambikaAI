import { useLocation } from "wouter";
import {
  ArrowLeft,
  Package,
  Clock,
  CheckCircle,
  Truck,
  MapPin,
  Phone,
  Calendar,
  Eye,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

interface Order {
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
  estimatedDelivery?: string;
  trackingNumber?: string;
  items: Array<{
    id: string;
    productId: string;
    quantity: number;
    price: string;
    size?: string;
    color?: string;
    product?: {
      id: string;
      name: string;
      imageUrl?: string;
    };
  }>;
}

const statusConfig = {
  pending: {
    color:
      "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
    icon: Clock,
    label: "Pending",
  },
  confirmed: {
    color: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
    icon: CheckCircle,
    label: "Confirmed",
  },
  processing: {
    color:
      "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400",
    icon: Package,
    label: "Processing",
  },
  shipped: {
    color:
      "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400",
    icon: Truck,
    label: "Shipped",
  },
  delivered: {
    color:
      "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
    icon: CheckCircle,
    label: "Delivered",
  },
  cancelled: {
    color: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
    icon: Clock,
    label: "Cancelled",
  },
};

export default function Orders() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  // Fetch orders using default auth-aware queryFn
  const {
    data: orders = [],
    isLoading,
    error,
  } = useQuery<Order[]>({
    queryKey: ["/api/orders"],
  });

  const formatPrice = (price: string | number) => {
    const numPrice = typeof price === "string" ? parseFloat(price) : price;
    return new Intl.NumberFormat("en-RW", {
      style: "currency",
      currency: "RWF",
      minimumFractionDigits: 0,
    }).format(numPrice);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-RW", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusProgress = (status: Order["status"]) => {
    const steps: Order["status"][] = [
      "pending",
      "confirmed",
      "processing",
      "shipped",
      "delivered",
    ];
    const currentIndex = steps.indexOf(status);
    return ((currentIndex + 1) / steps.length) * 100;
  };

  if (isLoading) {
    return (
      <div className="">
        <div className="container mx-auto px-4 py-8">
          <div className="mb-8">
            <Skeleton className="h-8 w-48 mb-2" />
            <Skeleton className="h-4 w-96" />
          </div>

          <div className="space-y-6">
            {[...Array(5)].map((_, i) => (
              <Card key={i} className="overflow-hidden">
                <CardHeader className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20">
                  <div className="flex justify-between items-start">
                    <div className="space-y-2">
                      <Skeleton className="h-5 w-32" />
                      <Skeleton className="h-4 w-24" />
                    </div>
                    <div className="text-right space-y-2">
                      <Skeleton className="h-6 w-20 rounded-full" />
                      <Skeleton className="h-4 w-16" />
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="space-y-4">
                    {[...Array(2)].map((_, j) => (
                      <div
                        key={j}
                        className="flex items-center space-x-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg"
                      >
                        <Skeleton className="w-16 h-16 rounded-md" />
                        <div className="flex-1 space-y-2">
                          <Skeleton className="h-4 w-48" />
                          <Skeleton className="h-3 w-24" />
                        </div>
                        <div className="text-right space-y-1">
                          <Skeleton className="h-4 w-16" />
                          <Skeleton className="h-3 w-12" />
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
                    <div className="flex justify-between items-center">
                      <Skeleton className="h-5 w-24" />
                      <Skeleton className="h-6 w-20" />
                    </div>
                  </div>
                </CardContent>
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
          <Card className="floating-card p-8">
            <Package className="h-16 w-16 text-red-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-4">Failed to load orders</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              There was an error loading your orders. Please try again.
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

  // Details are now handled by /orders/:id

  // Orders list view
  return (
    <div className="pt-10">
      {/* Header */}
      <div className="sticky top-0 z-50 glassmorphism border border-transparent rounded-2xl">
        <div className="px-4 py-4 flex items-center justify-between">
          <Button
            variant="ghost"
            onClick={() => setLocation("/profile")}
            className="glassmorphism"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <h1 className="text-xl font-bold gradient-text">My Orders</h1>
          <div className="w-20" />
        </div>
      </div>

      <main className="max-w-4xl mx-auto px-4 py-8">
        {orders.length === 0 ? (
          <Card className="floating-card p-8 text-center border border-transparent">
            <Package className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-4">No orders yet</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              You haven't placed any orders yet. Start shopping to see your
              orders here.
            </p>
            <Button
              onClick={() => setLocation("/products")}
              className="gradient-bg text-white"
            >
              Start Shopping
            </Button>
          </Card>
        ) : (
          <div className="space-y-6">
            {orders.map((order) => {
              const StatusIcon = statusConfig[order.status].icon;

              return (
                <Card
                  key={order.id}
                  className="floating-card hover:shadow-lg transition-shadow"
                >
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <StatusIcon className="h-5 w-5 text-primary" />
                        <div>
                          <h3 className="font-bold">
                            Order #{order.id.slice(0, 8)}
                          </h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {formatDate(order.createdAt)}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge className={statusConfig[order.status].color}>
                          {statusConfig[order.status].label}
                        </Badge>
                        <p className="text-lg font-bold text-primary mt-1">
                          {formatPrice(order.total)}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 mb-4">
                      <div className="flex -space-x-2">
                        {order.items.slice(0, 3).map((item, index) => (
                          <img
                            key={item.id}
                            src={
                              item.product?.imageUrl ||
                              "https://via.placeholder.com/40"
                            }
                            alt={item.product?.name}
                            className="w-10 h-10 object-cover rounded-full border-2 border-white dark:border-gray-800"
                            style={{ zIndex: 3 - index }}
                          />
                        ))}
                        {order.items.length > 3 && (
                          <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-full border-2 border-white dark:border-gray-800 flex items-center justify-center text-xs font-medium">
                            +{order.items.length - 3}
                          </div>
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {order.items.length} item
                          {order.items.length !== 1 ? "s" : ""}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400 capitalize">
                          {order.paymentMethod.replace("_", " ")}
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <Button
                        onClick={() => setLocation(`/orders/${order.id}`)}
                        className="flex-1 gradient-bg text-white"
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        View Details
                      </Button>
                      {order.status === "delivered" && (
                        <Button
                          onClick={() =>
                            setLocation(
                              `/products/${order.items[0]?.productId}`
                            )
                          }
                          variant="outline"
                          className="flex-1"
                        >
                          Reorder
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
