import { useRoute, useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ArrowLeft,
  Package,
  Clock,
  CheckCircle,
  Truck,
  MapPin,
  Phone,
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/contexts/AuthContext";

interface OrderItem {
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
}

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
  items: OrderItem[];
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
} as const;

export default function OrderDetailsPage() {
  const [, params] = useRoute<{ id: string }>("/orders/:id");
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const id = params?.id as string;

  const {
    data: order,
    isLoading,
    error,
  } = useQuery<Order | null>({
    queryKey: ["/api/orders", id],
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

  const statusMutation = useMutation({
    mutationFn: async (newStatus: Order["status"]) => {
      const res = await apiRequest("PUT", `/api/orders/${id}/status`, {
        status: newStatus,
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/orders", id] });
      queryClient.invalidateQueries({ queryKey: ["/api/producer/orders"] });
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="container mx-auto px-4 py-8">
          <div className="mb-6 flex items-center justify-between">
            <Skeleton className="h-8 w-40" />
            <Skeleton className="h-8 w-24" />
          </div>
          <Card className="overflow-hidden">
            <CardHeader>
              <Skeleton className="h-5 w-32" />
            </CardHeader>
            <CardContent className="space-y-4">
              <Skeleton className="h-4 w-64" />
              <Skeleton className="h-2 w-full" />
              <div className="space-y-2">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <Skeleton className="h-8 w-8 rounded-full" />
                    <Skeleton className="h-4 w-32" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 dark:from-background dark:via-slate-900 dark:to-slate-800">
        <div className="max-w-2xl mx-auto px-4 py-16 text-center">
          <Card className="p-8">
            <Package className="h-16 w-16 text-red-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-4">Order not found</h2>
            <Button
              onClick={() => setLocation("/orders")}
              className="gradient-bg text-white"
            >
              Back to Orders
            </Button>
          </Card>
        </div>
      </div>
    );
  }

  const StatusIcon = statusConfig[order.status].icon;
  const progress = getStatusProgress(order.status);
  const canUpdate = user?.role === "producer" || user?.role === "admin";

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 dark:from-background dark:via-slate-900 dark:to-slate-800">
      <div className="sticky top-0 z-50 glassmorphism border-b border-white/20">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <Button
            variant="ghost"
            onClick={() => setLocation("/orders")}
            className="glassmorphism"
          >
            <ArrowLeft className="h-4 w-4 mr-2" /> Back to Orders
          </Button>
          <h1 className="text-xl font-bold gradient-text">
            Order #{order.id.slice(0, 8)}
          </h1>
          <div className="w-20" />
        </div>
      </div>

      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <Card className="floating-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <StatusIcon className="h-5 w-5" /> Order Status
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <Badge className={statusConfig[order.status].color}>
                    {statusConfig[order.status].label}
                  </Badge>
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {formatDate(order.createdAt)}
                  </span>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
                    <span>Progress</span>
                    <span>{Math.round(progress)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div
                      className="bg-gradient-to-r from-primary to-blue-600 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
                <div className="space-y-3 pt-4">
                  {(
                    [
                      "pending",
                      "confirmed",
                      "processing",
                      "shipped",
                      "delivered",
                    ] as Order["status"][]
                  ).map((step, index) => {
                    const isCompleted =
                      (
                        [
                          "pending",
                          "confirmed",
                          "processing",
                          "shipped",
                          "delivered",
                        ] as Order["status"][]
                      ).indexOf(order.status) >= index;
                    const isCurrent = order.status === step;
                    const StepIcon = statusConfig[step].icon;
                    return (
                      <div
                        key={step}
                        className={`flex items-center gap-3 ${
                          isCompleted ? "text-primary" : "text-gray-400"
                        }`}
                      >
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center ${
                            isCompleted
                              ? "bg-primary text-white"
                              : "bg-gray-200 dark:bg-gray-700"
                          } ${
                            isCurrent ? "ring-2 ring-primary ring-offset-2" : ""
                          }`}
                        >
                          <StepIcon className="h-4 w-4" />
                        </div>
                        <span className="font-medium capitalize">{step}</span>
                      </div>
                    );
                  })}
                </div>
                {canUpdate && order.status !== "delivered" && (
                  <div className="flex gap-2 pt-2">
                    {(
                      [
                        "confirmed",
                        "processing",
                        "shipped",
                        "delivered",
                      ] as Order["status"][]
                    ).map((s) => (
                      <Button
                        key={s}
                        variant="outline"
                        disabled={statusMutation.isPending}
                        onClick={() => statusMutation.mutate(s)}
                      >
                        Mark {s}
                      </Button>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="floating-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" /> Delivery Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="font-medium mb-1">Shipping Address:</p>
                  <p className="text-gray-600 dark:text-gray-400">
                    {order.shippingAddress}
                  </p>
                </div>
                {order.estimatedDelivery && (
                  <div>
                    <p className="font-medium mb-1">Estimated Delivery:</p>
                    <p className="text-gray-600 dark:text-gray-400">
                      {formatDate(order.estimatedDelivery)}
                    </p>
                  </div>
                )}
                <div>
                  <p className="font-medium mb-1">Payment Method:</p>
                  <p className="text-gray-600 dark:text-gray-400 capitalize">{order.paymentMethod?.replace('_', ' ')}</p>
                </div>
              </CardContent>
            </Card>

            <Card className="floating-card">
              <CardHeader>
                <CardTitle>Order Items</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {order.items.map((item) => (
                    <div
                      key={item.id}
                      className="flex gap-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg"
                    >
                      <img
                        src={
                          item.product?.imageUrl ||
                          "https://via.placeholder.com/80"
                        }
                        alt={item.product?.name}
                        className="w-16 h-16 object-cover rounded-lg"
                      />
                      <div className="flex-1">
                        <h4 className="font-medium">{item.product?.name}</h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {item.size && `Size: ${item.size}`}
                          {item.color && ` • Color: ${item.color}`}
                        </p>
                        <div className="flex justify-between items-center mt-2">
                          <span className="text-sm">
                            Quantity: {item.quantity}
                          </span>
                          <span className="font-medium">
                            {formatPrice(item.price)}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card className="floating-card sticky top-24">
              <CardHeader>
                <CardTitle>Order Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span>Order Total:</span>
                  <span className="font-bold text-lg text-primary">
                    {formatPrice(order.total)}
                  </span>
                </div>
                <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
                  <span>Items:</span>
                  <span>{order.items.length}</span>
                </div>
                <hr className="border-gray-200 dark:border-gray-700" />
                <div className="space-y-2">
                  <Button variant="outline" className="w-full">
                    <Phone className="h-4 w-4 mr-2" /> Contact Support
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
