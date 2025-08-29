"use client";

import {
  ArrowLeft,
  Package,
  Clock,
  CheckCircle,
  Truck,
  Eye,
  X,
  Calendar,
  CreditCard,
  Sparkles,
  Zap,
  Download,
  ShoppingBag,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { OrdersSkeleton } from "@/components/ui/OrdersSkeleton";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiClient, handleApiError, API_BASE_URL } from "@/config/api";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
// Remove formatPrice import as we'll define it locally
import { useState } from "react";
import { generateReceipt } from "@/utils/receiptGenerator";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { OrderConfirmationButton } from "@/components/OrderConfirmationButton";

interface Order {
  id: string;
  total: string;
  status:
    | "pending"
    | "confirmed"
    | "processing"
    | "shipped"
    | "delivered"
    | "cancelled"
    | "completed";
  paymentMethod: string;
  paymentStatus: string;
  shippingAddress: any;
  trackingNumber?: string;
  notes?: string;
  createdAt: string;
  items: OrderItem[];
  // New fields for validation flow
  validationStatus?:
    | "pending"
    | "in_progress"
    | "done"
    | "confirmed_by_customer"
    | string;
  isConfirmedByCustomer?: boolean;
}

interface OrderItem {
  id: string;
  productId: string;
  quantity: number;
  price: string;
  size?: string;
  color?: string;
  product: {
    id: string;
    name: string;
    imageUrl: string;
  };
}

type OrderStatus = Order["status"];

const statusConfig: Record<
  OrderStatus,
  {
    color: string;
    icon: React.ComponentType<any>;
    label: string;
  }
> = {
  pending: {
    color:
      "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
    icon: Clock,
    label: "Pending",
  },
  confirmed: {
    color: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
    icon: Package,
    label: "Confirmed",
  },
  processing: {
    color:
      "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400",
    icon: Package,
    label: "Processing",
  },
  shipped: {
    color:
      "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400",
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
  completed: {
    color:
      "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
    icon: CheckCircle,
    label: "Completed",
  },
};

function OrdersPage() {
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [cancellingOrderId, setCancellingOrderId] = useState<string | null>(
    null
  );

  // Fetch orders using axios
  const { data: orders = [], isLoading } = useQuery<Order[]>({
    queryKey: ["orders"],
    queryFn: async () => {
      try {
        const response = await apiClient.get("/api/orders");
        return response.data;
      } catch (error) {
        console.error("Failed to fetch orders:", handleApiError(error));
        return [];
      }
    },
    enabled: isAuthenticated,
  });

  const cancelOrderMutation = useMutation({
    mutationFn: async (orderId: string) => {
      console.log("Attempting to cancel order:", orderId);
      console.log("API Base URL:", API_BASE_URL);
      try {
        const response = await apiClient.delete(`/api/orders/${orderId}`);
        console.log("Cancel order response:", response);
        return response.data;
      } catch (error) {
        console.error("Cancel order error:", error);
        throw error;
      }
    },
    onSuccess: (data, orderId) => {
      console.log("Order cancelled successfully:", data);
      toast({
        title: "Order Cancelled",
        description: "Your order has been successfully cancelled.",
      });
      // Refresh orders list
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      setCancellingOrderId(null);
    },
    onError: (error) => {
      console.error("Cancel order mutation error:", error);
      toast({
        title: "Cancellation Failed",
        description: handleApiError(error),
        variant: "destructive",
      });
      setCancellingOrderId(null);
    },
  });

  const handleCancelOrder = (orderId: string) => {
    if (cancellingOrderId) return; // Prevent multiple cancellations

    const confirmCancel = window.confirm(
      "Are you sure you want to cancel this order? This action cannot be undone."
    );

    if (confirmCancel) {
      setCancellingOrderId(orderId);
      cancelOrderMutation.mutate(orderId);
    }
  };

  const handleDownloadReceipt = (order: Order) => {
    try {
      generateReceipt(order);
      toast({
        title: "Receipt Downloaded",
        description: "Your receipt has been downloaded successfully.",
      });
    } catch (error) {
      toast({
        title: "Download Failed",
        description: "Failed to generate receipt. Please try again.",
        variant: "destructive",
      });
    }
  };

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

  const getStatusProgress = (status: OrderStatus) => {
    const statusOrder: OrderStatus[] = [
      "pending",
      "confirmed",
      "processing",
      "shipped",
      "delivered",
      "completed",
    ];
    const currentIndex = statusOrder.indexOf(status);
    return ((currentIndex + 1) / statusOrder.length) * 100;
  };

  if (isLoading) {
    return <OrdersSkeleton />;
  }

  if (!isAuthenticated) {
    return (
      <div className="">
        <div className="max-w-2xl mx-auto px-4 py-16 text-center">
          <Card className="floating-card p-8">
            <Package className="h-16 w-16 text-red-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-4">You are not logged in</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Please log in to view your orders.
            </p>
            <Button
              onClick={() => router.push("/login")}
              className="gradient-bg text-white"
            >
              Log In
            </Button>
          </Card>
        </div>
      </div>
    );
  }

  // Details are now handled by /orders/:id

  // Orders list view
  return (
    <ProtectedRoute>
      <div className="pt-10">
        {/* AI-Inspired Header */}
        <div className="sticky top-0 z-50 backdrop-blur-xl bg-white/80 dark:bg-slate-900/80 rounded-2xl">
          <div className="max-w-6xl mx-auto px-2 sm:px-3 md:px-3 py-2 md:pl-3 sm:py-3">
            <div className="flex items-center justify-between flex-wrap gap-3 sm:gap-0">
              <Button
                variant="ghost"
                onClick={() => router.push("/profile")}
                className="hover:bg-white/20 dark:hover:bg-slate-800/50 transition-all duration-300 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700"
              >
                <ArrowLeft className="h-4 w-4" />
                Back
              </Button>
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 rounded-xl flex items-center justify-center shadow-lg">
                    <Sparkles className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                  </div>
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full animate-bounce" />
                  <Zap className="absolute -bottom-1 -left-1 h-3 w-3 text-yellow-400 animate-pulse" />
                </div>
                <div>
                  <h1 className="text-base sm:text-lg md:text-xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                    My Orders
                  </h1>
                  <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                    <Sparkles className="h-3 w-3" />
                    AI-Powered Management
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="px-3 py-0.5 bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-full border border-blue-200/50 dark:border-blue-700/50">
                  <span className="text-xs font-medium text-blue-600 dark:text-blue-400">
                    {orders.length} Orders
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="w-full py-2 pt-3">
          {orders.length === 0 ? (
            <div className="flex items-center justify-center min-h-[60vh]">
              <Card className="relative overflow-hidden bg-white/60 dark:bg-black/60 backdrop-blur-xl p-12 text-center max-w-md mx-auto">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-400/10 via-purple-400/10 to-pink-400/10" />
                <div className="relative z-10">
                  <div className="relative mb-6">
                    <ShoppingBag className="h-20 w-20 text-gray-400 mx-auto" />
                    <div className="absolute -top-2 -right-2 w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                      <Sparkles className="h-4 w-4 text-white" />
                    </div>
                  </div>
                  <h2 className="text-3xl font-bold mb-4 bg-gradient-to-r from-gray-800 to-gray-600 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
                    Your Order Journey Awaits
                  </h2>
                  <p className="text-gray-600 dark:text-gray-400 mb-8 text-lg">
                    Discover amazing products and start your shopping adventure
                    with AI-powered recommendations.
                  </p>
                  <Button
                    onClick={() => router.push("/products")}
                    className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-3 rounded-xl font-semibold hover:shadow-md transition-all duration-300 transform hover:scale-105"
                  >
                    <Zap className="h-5 w-5 mr-2" />
                    Start Shopping
                  </Button>
                </div>
              </Card>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
              {orders.map((order: Order, index: number) => {
                const StatusIcon = statusConfig[order.status].icon;
                const progress = getStatusProgress(order.status);
                const shippingAddr =
                  typeof order.shippingAddress === "string"
                    ? (() => {
                        try {
                          return JSON.parse(order.shippingAddress);
                        } catch {
                          return { address: order.shippingAddress };
                        }
                      })()
                    : order.shippingAddress;

                return (
                  <Card
                    key={order.id}
                    className="group relative rounded-2xl overflow-hidden bg-white/70 dark:bg-slate-800/40 backdrop-blur-xl border border-white/20 dark:border-none transition-all duration-500 hover:scale-[1.02] hover:border-blue-200/50"
                    style={{
                      animationDelay: `${index * 100}ms`,
                      animation: "fadeInUp 0.6s ease-out forwards",
                    }}
                  >
                    {/* Gradient overlay */}
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-purple-500/5 to-pink-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                    {/* AI Progress indicator */}
                    <div className="absolute top-0 left-0 right-0 h-1 bg-gray-200 dark:bg-gray-700">
                      <div
                        className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-1000 ease-out"
                        style={{ width: `${progress}%` }}
                      />
                    </div>

                    <CardContent className="relative z-10 p-4 sm:p-5">
                      {/* Order Header */}
                      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-4">
                        <div className="flex items-start gap-3">
                          <div className="relative flex-shrink-0">
                            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                              <StatusIcon className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                            </div>
                            <div className="absolute -top-1 -right-1 w-3 h-3 sm:w-4 sm:h-4 bg-gradient-to-r from-green-400 to-blue-500 rounded-full animate-pulse" />
                            <Sparkles className="absolute -bottom-1 -left-1 h-2 w-2 sm:h-3 sm:w-3 text-yellow-400 animate-pulse" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-col gap-0 mb-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <h3 className="font-bold text-sm sm:text-base text-gray-900 dark:text-white">
                                  Order #{order.id.slice(-8).toUpperCase()}
                                </h3>
                                <Badge
                                  className={`${
                                    statusConfig[order.status].color
                                  } font-medium px-2 sm:px-3 py-0.5 text-xs`}
                                >
                                  {statusConfig[order.status].label}
                                </Badge>
                              </div>
                              <div className="text-lg sm:text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent flex items-center gap-1">
                                <Zap className="h-3 w-3 sm:h-4 sm:w-4 text-purple-400" />
                                {formatPrice(order.total)}
                              </div>
                            </div>
                            <div className="flex flex-col gap-1 text-sm text-gray-600 dark:text-gray-400">
                              <div className="flex items-center gap-2">
                                <Calendar className="h-4 w-4" />
                                <span>{formatDate(order.createdAt)}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <CreditCard className="h-4 w-4" />
                                <span>
                                  {order.paymentMethod
                                    .replace("_", " ")
                                    .toUpperCase()}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Items Preview */}
                      <div className="mb-4">
                        <div className="flex items-center gap-3">
                          <div className="flex -space-x-2">
                            {order.items.slice(0, 4).map((item, idx) => (
                              <img
                                key={item.id}
                                src={
                                  item.product?.imageUrl ||
                                  "https://via.placeholder.com/40"
                                }
                                alt={item.product?.name || "Product"}
                                className="w-10 h-10 object-cover rounded-full border-2 border-white dark:border-gray-800"
                                style={{ zIndex: 4 - idx }}
                              />
                            ))}
                            {order.items.length > 4 && (
                              <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full border-2 border-white dark:border-gray-800 flex items-center justify-center text-sm font-bold text-white">
                                +{order.items.length - 4}
                              </div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-sm sm:text-base font-semibold text-gray-900 dark:text-white">
                              {order.items[0]?.product?.name || "Products"}
                              {order.items.length > 1 &&
                                ` +${order.items.length - 1} more`}
                            </div>
                            <div className="text-sm text-gray-600 dark:text-gray-400">
                              {order.items.reduce(
                                (sum, item) => sum + item.quantity,
                                0
                              )}{" "}
                              items • Total quantity
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Shipping Info */}
                      <div className="mb-4">
                        <div className="flex items-center gap-3">
                          <div className="flex -space-x-2">
                            <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center">
                              <Truck className="h-5 w-5 text-gray-400" />
                            </div>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-sm sm:text-base font-semibold text-gray-900 dark:text-white">
                              Shipping Address
                            </div>
                            <div className="text-sm text-gray-600 dark:text-gray-400">
                              {shippingAddr.address}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2">
                        <Button
                          onClick={() => router.push(`/orders/${order.id}`)}
                          variant="outline"
                          className="flex-1 border-blue-200 text-blue-600 hover:bg-blue-50 hover:border-blue-300 dark:border-blue-800 dark:text-blue-400 dark:hover:bg-blue-950 font-semibold py-2 sm:py-3 px-3 sm:px-6 rounded-full hover:shadow-md transition-all duration-300 transform hover:scale-105 text-sm"
                        >
                          <Eye className="h-4 w-4" />
                          View Details
                        </Button>

                        {/* Customer confirmation button: show when producer marked done or order delivered/completed */}
                        {!order.isConfirmedByCustomer &&
                          (order.validationStatus === "done" ||
                            order.status === "delivered" ||
                            order.status === "completed") && (
                            <OrderConfirmationButton
                              orderId={order.id}
                              isConfirmed={!!order.isConfirmedByCustomer}
                              onConfirmationChange={() =>
                                queryClient.invalidateQueries({
                                  queryKey: ["orders"],
                                })
                              }
                            />
                          )}

                        {/* Download Receipt Button - Only show for confirmed, processing, shipped, delivered, or completed orders */}
                        {(order.status === "confirmed" ||
                          order.status === "processing" ||
                          order.status === "shipped" ||
                          order.status === "delivered" ||
                          order.status === "completed") && (
                          <Button
                            onClick={() => handleDownloadReceipt(order)}
                            variant="outline"
                            className="flex-1 border-green-500 text-green-600 hover:bg-green-50 hover:border-green-600 dark:border-green-800 dark:text-green-400 dark:hover:bg-green-950 font-semibold py-2 sm:py-3 px-3 sm:px-6 rounded-full hover:shadow-md transition-all duration-300 transform hover:scale-105 text-sm"
                          >
                            <Download className="h-4 w-4" />
                            Receipt
                          </Button>
                        )}

                        {/* Cancel Button - Only show for pending orders */}
                        {order.status === "pending" && (
                          <Button
                            onClick={() => handleCancelOrder(order.id)}
                            disabled={cancellingOrderId === order.id}
                            variant="outline"
                            className="flex-1 border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-950 font-semibold py-2 sm:py-3 px-4 sm:px-6 rounded-full hover:shadow-md transition-all duration-300 transform hover:scale-105 text-sm"
                          >
                            <X className="h-4 w-4" />
                            {cancellingOrderId === order.id
                              ? "Cancelling..."
                              : "Cancel"}
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>

        {/* AI-inspired floating elements */}
        <div className="fixed top-20 right-8 w-2 h-2 bg-blue-400 rounded-full animate-ping" />
        <div className="fixed top-32 right-12 w-1 h-1 bg-purple-400 rounded-full animate-pulse" />
        <div
          className="fixed bottom-20 left-8 w-3 h-3 bg-pink-400 rounded-full animate-bounce"
          style={{ animationDelay: "1s" }}
        />

        <style jsx>{`
          @keyframes fadeInUp {
            from {
              opacity: 0;
              transform: translateY(30px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
        `}</style>
      </div>
    </ProtectedRoute>
  );
}

export default OrdersPage;
