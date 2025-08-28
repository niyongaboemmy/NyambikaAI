"use client";

import { useState, use, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiClient, handleApiError } from "@/config/api";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { OrderDetailsSkeleton } from "@/components/ui/OrderDetailsSkeleton";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import {
  ArrowLeft,
  Package,
  Clock,
  CheckCircle,
  Truck,
  MapPin,
  Phone,
  Mail,
  Calendar,
  CreditCard,
  User,
  Copy,
  Star,
  MessageSquare,
  Sparkles,
  Zap,
  ShoppingBag,
  Brain,
  Cpu,
  Layers,
  Wifi,
  Activity,
} from "lucide-react";

interface OrderDetails {
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
  paymentStatus?: string;
  shippingAddress:
    | string
    | {
        street?: string;
        city?: string;
        country?: string;
        fullName?: string;
        email?: string;
        phone?: string;
        address?: string;
        [key: string]: any;
      };
  trackingNumber?: string;
  notes?: string;
  createdAt: string;
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
      producerId?: string;
    };
  }>;
}

const statusConfig = {
  pending: {
    color:
      "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
    icon: Clock,
    label: "Pending",
    description: "Your order is being reviewed",
  },
  confirmed: {
    color: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
    icon: CheckCircle,
    label: "Confirmed",
    description: "Your order has been confirmed",
  },
  processing: {
    color:
      "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400",
    icon: Package,
    label: "Processing",
    description: "Your order is being prepared",
  },
  shipped: {
    color:
      "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400",
    icon: Truck,
    label: "Shipped",
    description: "Your order is on its way",
  },
  delivered: {
    color:
      "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
    icon: CheckCircle,
    label: "Delivered",
    description: "Your order has been delivered",
  },
  cancelled: {
    color: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
    icon: Clock,
    label: "Cancelled",
    description: "Your order has been cancelled",
  },
};

function OrderDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { toast } = useToast();
  const [copiedTracking, setCopiedTracking] = useState(false);
  const resolvedParams = use(params);

  const { user } = useAuth();
  const {
    data: order,
    isLoading,
    error,
  } = useQuery<OrderDetails>({
    queryKey: ["/api/orders", resolvedParams.id, user?.id, user?.role],
    queryFn: async () => {
      try {
        const response = await apiClient.get(
          `/api/orders/${resolvedParams.id}`
        );

        // If user is a producer, filter items to only show their products
        if (user?.role === "producer") {
          return {
            ...response.data,
            items: response.data.items.filter(
              (item: any) => item.product?.producerId === user.id
            ),
            // Recalculate total based on filtered items
            total: response.data.items
              .filter((item: any) => item.product?.producerId === user.id)
              .reduce(
                (sum: number, item: any) =>
                  sum + parseFloat(item.price) * item.quantity,
                0
              )
              .toFixed(2),
          };
        }

        return response.data;
      } catch (error) {
        throw new Error(handleApiError(error));
      }
    },
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
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const copyTrackingNumber = () => {
    if (order?.trackingNumber) {
      navigator.clipboard.writeText(order.trackingNumber);
      setCopiedTracking(true);
      toast({
        title: "Copied!",
        description: "Tracking number copied to clipboard",
      });
      setTimeout(() => setCopiedTracking(false), 2000);
    }
  };

  const getStatusProgress = (status: OrderDetails["status"]) => {
    const steps: OrderDetails["status"][] = [
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
    return <OrderDetailsSkeleton />;
  }

  if (error || !order) {
    return (
      <div className="pt-10 min-h-screen">
        <div className="max-w-2xl mx-auto px-3 sm:px-4 py-8 sm:py-16 text-center">
          <Card className="relative overflow-hidden">
            <Package className="h-16 w-16 text-red-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-4">Order Not Found</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              The order you're looking for doesn't exist or you don't have
              permission to view it.
            </p>
            <Button
              onClick={() =>
                user?.role === "producer"
                  ? router.push(`/producer-orders`)
                  : router.push("/orders")
              }
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
    <ProtectedRoute>
      <div className="min-h-screen pt-10 relative overflow-hidden px-1">
        {/* AI-inspired floating particles */}
        <div className="absolute inset-0 pointer-events-none">
          <div
            className="absolute top-10 left-10 w-1 h-1 bg-blue-400/60 rounded-full animate-ping"
            style={{ animationDelay: "0s" }}
          />
          <div
            className="absolute top-20 right-20 w-2 h-2 bg-purple-400/40 rounded-full animate-pulse"
            style={{ animationDelay: "1s" }}
          />
          <div
            className="absolute bottom-32 left-16 w-1.5 h-1.5 bg-pink-400/50 rounded-full animate-bounce"
            style={{ animationDelay: "2s" }}
          />
          <div
            className="absolute top-1/3 right-10 w-1 h-1 bg-cyan-400/60 rounded-full animate-ping"
            style={{ animationDelay: "3s" }}
          />
          <div
            className="absolute bottom-20 right-32 w-2 h-2 bg-indigo-400/40 rounded-full animate-pulse"
            style={{ animationDelay: "4s" }}
          />
        </div>
        {/* AI-Inspired Header */}
        <div className="sticky top-0 z-50 bg-white dark:bg-gray-900 rounded-2xl">
          <div className="max-w-6xl mx-auto px-2 sm:px-3 md:px-4 py-1.5 sm:py-2">
            <div className="flex items-center justify-between">
              <Button
                variant="ghost"
                onClick={() =>
                  user?.role === "producer"
                    ? router.push(`/producer-orders`)
                    : router.push("/orders")
                }
                className="bg-gray-100 dark:bg-gray-900/50 dark:border-none hover:bg-white/20 dark:hover:bg-slate-800/50 transition-all duration-300 text-xs sm:text-sm px-2 sm:px-3 py-1 sm:py-2 transform hover:scale-105 hover:shadow-md"
              >
                <ArrowLeft className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                <span className="hidden sm:inline">Back to Orders</span>
                <span className="sm:hidden">Back</span>
              </Button>
              <div className="flex items-center gap-1.5 sm:gap-2">
                <div className="relative">
                  <div className="w-6 h-6 sm:w-8 sm:h-8 bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 rounded-lg flex items-center justify-center shadow-md">
                    <Brain className="h-3 w-3 sm:h-4 sm:w-4 text-white" />
                  </div>
                  <div className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full animate-bounce" />
                  <Activity className="absolute -bottom-0.5 -left-0.5 h-2 w-2 text-cyan-400 animate-pulse" />
                </div>
                <div>
                  <h1 className="text-sm sm:text-base md:text-lg font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                    #{order.id.slice(-8).toUpperCase()}
                  </h1>
                  <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                    <Cpu className="h-2.5 w-2.5" />
                    <span className="hidden sm:inline">
                      AI-Powered Tracking
                    </span>
                    <span className="sm:hidden">AI Track</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1 sm:gap-2">
                <Badge
                  className={`${
                    statusConfig[order.status].color
                  } font-medium px-2 sm:px-3 py-1 text-xs sm:text-sm`}
                >
                  {statusConfig[order.status].label}
                </Badge>
              </div>
            </div>
          </div>
        </div>

        <div className="py-2 animate-in fade-in-0 duration-700">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-2 sm:gap-2 animate-in slide-in-from-bottom-4 duration-500 delay-150">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-2 animate-in slide-in-from-left-4 duration-500 delay-200">
              {/* Order Status */}
              <Card className="relative overflow-hidden bg-gray-50 dark:bg-gray-900/50 dark:border-none transform transition-all hover:scale-[1.01] hover:shadow-lg animate-in slide-in-from-bottom-4 duration-500 delay-250">
                <div className="absolute inset-0 bg-white dark:bg-gray-900/50 dark:border-none" />

                {/* Progress indicator */}
                <div className="absolute top-0 left-0 right-0 h-1 bg-gray-200 dark:bg-gray-800/50">
                  <div
                    className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-1000 ease-out animate-pulse"
                    style={{ width: `${progress}%` }}
                  />
                </div>

                <CardHeader className="relative z-10">
                  <div className="flex items-center justify-between flex-wrap gap-3 sm:gap-0">
                    <CardTitle className="flex items-center gap-2">
                      <div className="w-6 h-6 sm:w-8 sm:h-8 bg-blue-500 rounded-lg flex items-center justify-center">
                        <StatusIcon className="h-3 w-3 sm:h-4 sm:w-4 text-white" />
                      </div>
                      <div>
                        <div className="text-xs sm:text-sm font-bold text-gray-900 dark:text-white flex items-center gap-1">
                          <span className="hidden sm:inline">
                            Order Journey
                          </span>
                          <span className="sm:hidden">Journey</span>
                          <Layers className="h-2.5 w-2.5 text-purple-400 animate-pulse" />
                        </div>
                        <div className="text-xs text-gray-600 dark:text-gray-400">
                          {statusConfig[order.status].description}
                        </div>
                      </div>
                    </CardTitle>
                    <div className="text-right">
                      <div className="relative">
                        <div className="text-lg sm:text-xl md:text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                          {Math.round(progress)}%
                        </div>
                        <Wifi className="absolute -top-1 -right-5 h-3 w-3 text-purple-400 animate-pulse" />
                      </div>
                      <div className="text-xs text-gray-500">Complete</div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="relative z-10 p-3 sm:p-4">
                  <div className="space-y-2 sm:space-y-3">
                    {order.trackingNumber && (
                      <div className="flex items-center gap-2 p-2 sm:p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                        <Truck className="h-4 w-4 text-blue-500 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <div className="text-xs font-medium text-blue-700 dark:text-blue-300">
                            Tracking
                          </div>
                          <div className="font-mono text-xs text-gray-700 dark:text-gray-300 truncate">
                            {order.trackingNumber}
                          </div>
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={copyTrackingNumber}
                          className="hover:bg-blue-100 dark:hover:bg-blue-800 p-1"
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                    )}

                    <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
                      <Calendar className="h-3 w-3" />
                      <span className="truncate">
                        {formatDate(order.createdAt)}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Order Items */}
              <Card className="relative overflow-hidden bg-gray-50 dark:bg-gray-900/50 dark:border-none transform transition-all duration-300 hover:scale-[1.01] hover:shadow-lg animate-in slide-in-from-bottom-4 delay-300">
                <div className="absolute inset-0 bg-white dark:bg-gray-900/50 dark:border-none" />
                <CardHeader className="relative z-10 pb-2">
                  <CardTitle className="flex items-center gap-2">
                    <div className="w-5 h-5 sm:w-6 sm:h-6 bg-blue-500 rounded-lg flex items-center justify-center">
                      <ShoppingBag className="h-3 w-3 text-white" />
                    </div>
                    <div>
                      <div className="text-xs sm:text-sm font-bold flex items-center gap-1">
                        <span className="hidden sm:inline">Order Items</span>
                        <span className="sm:hidden">Items</span>
                        <Cpu className="h-2.5 w-2.5 text-yellow-500 animate-pulse" />
                      </div>
                      <div className="text-xs text-gray-600 dark:text-gray-400">
                        {order.items.length} item
                        {order.items.length !== 1 ? "s" : ""}
                      </div>
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent className="relative z-10 p-3">
                  <div className="space-y-2 sm:space-y-3">
                    {order.items.map((item, index) => (
                      <div
                        key={item.id}
                        className="flex flex-col sm:flex-row gap-2 sm:gap-3 p-2 sm:p-3 bg-gray-100 dark:bg-gray-800/50 rounded-lg group hover:bg-gray-50 dark:hover:bg-gray-800 transition-all duration-300 hover:scale-[1.02] hover:shadow-md animate-in slide-in-from-left-4 delay-75"
                        style={{ animationDelay: `${index * 100}ms` }}
                      >
                        <div className="relative flex-shrink-0 mx-auto sm:mx-0">
                          <img
                            src={
                              item.product?.imageUrl ||
                              "https://via.placeholder.com/80"
                            }
                            alt={item.product?.name || "Product"}
                            className="w-12 h-12 sm:w-16 sm:h-16 object-cover rounded-lg transform transition-all duration-300 group-hover:scale-110 group-hover:shadow-lg"
                          />
                          <div className="absolute -top-1 -right-1 w-4 h-4 sm:w-5 sm:h-5 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-xs font-bold text-white shadow-lg animate-pulse">
                            {item.quantity}
                          </div>
                        </div>
                        <div className="flex-1 text-center sm:text-left">
                          <h4 className="font-semibold text-gray-900 dark:text-white text-xs sm:text-sm truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-300">
                            {item.product?.name ||
                              `Product ${item.productId.slice(-8)}`}
                          </h4>
                          <div className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
                            {item.size && (
                              <div className="flex items-center justify-center sm:justify-start gap-1 animate-in fade-in-0 duration-300 delay-100">
                                <span className="font-medium">Size:</span>
                                <span>{item.size}</span>
                              </div>
                            )}
                            {item.color && (
                              <div className="flex items-center justify-center sm:justify-start gap-1 animate-in fade-in-0 duration-300 delay-200">
                                <span className="font-medium">Color:</span>
                                <span>{item.color}</span>
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="text-center sm:text-right">
                          <div className="text-sm sm:text-base font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent group-hover:from-purple-600 group-hover:to-blue-600 transition-all duration-300">
                            {formatPrice(item.price)}
                          </div>
                        </div>
                        <div className="text-xs text-gray-500">each</div>
                        <div className="text-sm sm:text-base font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                          {formatPrice(parseFloat(item.price) * item.quantity)}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Shipping Address */}
              {shippingAddr && (
                <Card className="relative overflow-hidden bg-gray-50 dark:bg-gray-900/50 dark:border-none transform transition-all duration-300 hover:scale-[1.01] hover:shadow-lg animate-in slide-in-from-bottom-4 delay-400">
                  <div className="absolute inset-0 bg-white dark:bg-gray-900/50 dark:border-none" />
                  <CardHeader className="relative z-10 p-3 sm:p-4">
                    <CardTitle className="flex items-center gap-2">
                      <div className="w-5 h-5 sm:w-6 sm:h-6 bg-blue-500 rounded-lg flex items-center justify-center">
                        <MapPin className="h-3 w-3 text-white" />
                      </div>
                      <div>
                        <div className="text-xs sm:text-sm font-bold flex items-center gap-1">
                          <span className="hidden sm:inline">
                            Delivery Address
                          </span>
                          <span className="sm:hidden">Address</span>
                          <Activity className="h-2.5 w-2.5 text-blue-400 animate-pulse" />
                        </div>
                        <div className="text-xs text-gray-600 dark:text-gray-400">
                          AI-optimized route
                        </div>
                      </div>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="relative z-10 p-3 sm:p-4">
                    <div className="p-2 sm:p-3 bg-gray-100 dark:bg-gray-800/50 rounded-lg">
                      <div className="space-y-1.5">
                        {shippingAddr.fullName && (
                          <p className="font-semibold text-gray-900 dark:text-white text-sm flex items-center gap-2">
                            <User className="h-3 w-3 text-blue-500" />
                            {shippingAddr.fullName}
                          </p>
                        )}
                        {(shippingAddr.address || shippingAddr.street) && (
                          <p className="text-xs sm:text-sm text-gray-800/50 dark:text-gray-300">
                            {shippingAddr.address || shippingAddr.street}
                          </p>
                        )}
                        <p className="text-xs sm:text-sm text-gray-800/50 dark:text-gray-300">
                          {shippingAddr.city && `${shippingAddr.city}`}
                          {shippingAddr.country && `, ${shippingAddr.country}`}
                        </p>
                        <div className="flex flex-col sm:flex-row gap-1 sm:gap-3 mt-2 pt-2 border-t border-gray-200 dark:border-gray-600">
                          {shippingAddr.phone && (
                            <div className="flex items-center gap-1.5 text-xs text-gray-600 dark:text-gray-400">
                              <Phone className="h-3 w-3 text-blue-500" />
                              <span className="truncate">
                                {shippingAddr.phone}
                              </span>
                            </div>
                          )}
                          {shippingAddr.email && (
                            <div className="flex items-center gap-1.5 text-xs text-gray-600 dark:text-gray-400">
                              <Mail className="h-3 w-3 text-blue-500" />
                              <span className="truncate">
                                {shippingAddr.email}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-2 animate-in slide-in-from-right-4 duration-500 delay-300">
              {/* Order Summary */}
              <Card className="relative overflow-hidden bg-gray-50 dark:bg-gray-900/50 dark:border-none transform transition-all duration-300 hover:scale-[1.01] hover:shadow-lg animate-in slide-in-from-right-4 delay-400">
                <div className="absolute inset-0 bg-white dark:bg-gray-900/50 dark:border-none" />
                <CardHeader className="relative z-10 p-3 sm:p-4">
                  <CardTitle className="flex items-center gap-2">
                    <div className="w-5 h-5 sm:w-6 sm:h-6 bg-blue-500 rounded-lg flex items-center justify-center">
                      <CreditCard className="h-3 w-3 text-white" />
                    </div>
                    <div>
                      <div className="text-xs sm:text-sm font-bold flex items-center gap-1">
                        <span className="hidden sm:inline">Order Summary</span>
                        <span className="sm:hidden">Summary</span>
                        <Cpu className="h-2.5 w-2.5 text-purple-400 animate-pulse" />
                      </div>
                      <div className="text-xs text-gray-600 dark:text-gray-400">
                        AI totals
                      </div>
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent className="relative z-10 p-3 sm:p-4">
                  <div className="p-2 sm:p-3 bg-gray-100 dark:bg-gray-800/50 rounded-lg">
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-gray-600 dark:text-gray-400">
                          Items ({order.items.length})
                        </span>
                        <span className="text-xs font-medium">
                          {formatPrice(order.total)}
                        </span>
                      </div>
                      <Separator className="bg-gray-200/50 dark:bg-gray-800/50/50" />
                      <div className="flex justify-between items-center">
                        <span className="text-xs sm:text-sm font-bold text-gray-900 dark:text-white flex items-center gap-1">
                          <Brain className="h-2.5 w-2.5 text-purple-400" />
                          Total
                        </span>
                        <span className="text-sm sm:text-base font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                          {formatPrice(order.total)}
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Payment Info */}
              <Card className="relative overflow-hidden bg-gray-50 dark:bg-gray-900/50 dark:border-none transform transition-all duration-300 hover:scale-[1.01] hover:shadow-lg animate-in slide-in-from-right-4 delay-500">
                <div className="absolute inset-0 bg-white dark:bg-gray-900/50 dark:border-none" />
                <CardHeader className="relative z-10 p-3 sm:p-4">
                  <CardTitle className="flex items-center gap-2">
                    <div className="w-5 h-5 sm:w-6 sm:h-6 bg-blue-500 rounded-lg flex items-center justify-center">
                      <CreditCard className="h-3 w-3 text-white" />
                    </div>
                    <div className="text-xs sm:text-sm font-bold flex items-center gap-1">
                      <span className="hidden sm:inline">Payment Details</span>
                      <span className="sm:hidden">Payment</span>
                      <Activity className="h-2.5 w-2.5 text-green-400 animate-pulse" />
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent className="relative z-10 p-3 sm:p-4 space-y-2">
                  <div className="flex justify-between text-xs sm:text-sm">
                    <span>Method</span>
                    <span className="capitalize font-medium">
                      {order.paymentMethod.replace("_", " ")}
                    </span>
                  </div>
                  {order.paymentStatus && (
                    <div className="flex justify-between text-xs sm:text-sm">
                      <span>Status</span>
                      <Badge
                        variant={
                          order.paymentStatus === "completed"
                            ? "default"
                            : "secondary"
                        }
                        className="text-xs"
                      >
                        {order.paymentStatus}
                      </Badge>
                    </div>
                  )}
                  <div className="text-xs text-gray-600 dark:text-gray-400">
                    <p>{formatDate(order.createdAt)}</p>
                  </div>
                </CardContent>
              </Card>

              {/* Order Notes */}
              {order.notes && (
                <Card className="relative overflow-hidden bg-gray-50 dark:bg-gray-900/50 dark:border-none transform transition-all duration-300 hover:scale-[1.01] hover:shadow-lg animate-in slide-in-from-right-4 delay-600">
                  <CardHeader className="p-3 sm:p-4">
                    <CardTitle className="flex items-center gap-2 text-xs sm:text-sm">
                      <MessageSquare className="h-3 w-3 sm:h-4 sm:w-4" />
                      <span className="hidden sm:inline">Order Notes</span>
                      <span className="sm:hidden">Notes</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-3 sm:p-4">
                    <p className="text-xs sm:text-sm">{order.notes}</p>
                  </CardContent>
                </Card>
              )}

              {/* Actions */}
              <Card className="relative overflow-hidden bg-gray-50 dark:bg-gray-900/50 dark:border-none transform transition-all duration-300 hover:scale-[1.01] hover:shadow-lg animate-in slide-in-from-right-4 delay-700">
                <CardContent className="p-3 sm:p-4 space-y-2">
                  {order.status === "delivered" && (
                    <Button
                      onClick={() =>
                        router.push(`/products/${order.items[0]?.productId}`)
                      }
                      className="w-full bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white text-xs sm:text-sm py-2 transform transition-all duration-300 hover:scale-105 hover:shadow-lg"
                    >
                      <Star className="h-3 w-3 mr-2" />
                      <span className="hidden sm:inline">Leave a Review</span>
                      <span className="sm:hidden">Review</span>
                    </Button>
                  )}
                  <Button
                    onClick={() => {
                      navigator.clipboard.writeText(order.id);
                      toast({ title: "Order ID copied to clipboard" });
                    }}
                    variant="outline"
                    className="w-full text-xs sm:text-sm py-2 border-gray-300 dark:border-gray-600 transform transition-all duration-300 hover:scale-105 hover:shadow-md hover:bg-gray-50 dark:hover:bg-gray-800"
                  >
                    <span className="hidden sm:inline">Copy Order ID</span>
                    <span className="sm:hidden">Copy ID</span>
                  </Button>
                  <Button
                    onClick={() => router.push("/orders")}
                    variant="outline"
                    className="w-full text-xs sm:text-sm py-2 border-gray-300 dark:border-gray-600 transform transition-all duration-300 hover:scale-105 hover:shadow-md hover:bg-gray-50 dark:hover:bg-gray-800"
                  >
                    <span className="hidden sm:inline">View All Orders</span>
                    <span className="sm:hidden">All Orders</span>
                  </Button>
                  <Button
                    onClick={() => router.push("/")}
                    variant="ghost"
                    className="w-full text-xs sm:text-sm py-2 hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    <span className="hidden sm:inline">Continue Shopping</span>
                    <span className="sm:hidden">Shop More</span>
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}

export default OrderDetailsPage;
