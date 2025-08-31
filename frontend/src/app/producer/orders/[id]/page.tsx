"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/custom-ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/custom-ui/card";
import { Badge } from "@/components/custom-ui/badge";
import { format } from "date-fns";
import { ArrowLeft, Loader2, Camera, Eye } from "lucide-react";
import { handleApiError } from "@/lib/utils";
import apiClient from "@/lib/api-client";

type OrderStatus =
  | "pending"
  | "processing"
  | "handled"
  | "shipped"
  | "delivered"
  | "cancelled"
  | "confirmed";

const statusColors: Record<OrderStatus, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  processing: "bg-blue-100 text-blue-800",
  handled: "bg-purple-100 text-purple-800",
  shipped: "bg-indigo-100 text-indigo-800",
  delivered: "bg-green-100 text-green-800",
  confirmed: "bg-emerald-100 text-emerald-800",
  cancelled: "bg-red-100 text-red-800",
};

export default function ProducerOrderDetailsPage() {
  const router = useRouter();
  const { id } = useParams();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const queryClient = useQueryClient();
  const [updating, setUpdating] = useState(false);

  const {
    data: order,
    isLoading,
    error,
  } = useQuery({
    queryKey: [`/api/orders/${id}`],
    queryFn: async () => {
      try {
        const response = await apiClient.get(`/api/orders/${id}`);
        return response.data;
      } catch (error) {
        throw new Error(handleApiError(error));
      }
    },
    enabled:
      isAuthenticated && (user?.role === "producer" || user?.role === "admin"),
  });

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/login");
    } else if (
      !authLoading &&
      isAuthenticated &&
      user?.role !== "producer" &&
      user?.role !== "admin"
    ) {
      router.push("/");
    }
  }, [authLoading, isAuthenticated, user?.role, router]);

  const updateOrderStatus = useMutation({
    mutationFn: async (newStatus: OrderStatus) => {
      const response = await apiClient.put(`/api/orders/${id}`, {
        status: newStatus,
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/orders/${id}`] });
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
    },
    onError: (error) => {
      console.error("Error updating order status:", error);
      alert("Failed to update order status");
    },
  });

  const handleStatusUpdate = async (newStatus: OrderStatus) => {
    setUpdating(true);
    try {
      await updateOrderStatus.mutateAsync(newStatus);
    } finally {
      setUpdating(false);
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

  if (authLoading || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-4">
        <div className="text-red-500">Error loading order: {error.message}</div>
        <Button
          variant="outline"
          onClick={() => router.back()}
          className="mt-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" /> Go back
        </Button>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="container mx-auto p-4">
        <div>Order not found</div>
        <Button
          variant="outline"
          onClick={() => router.back()}
          className="mt-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" /> Go back
        </Button>
      </div>
    );
  }

  const subtotal = order.items.reduce((sum: number, item: any) => {
    return sum + parseFloat(item.price) * item.quantity;
  }, 0);

  return (
    <div className="container mx-auto p-4">
      <Button
        variant="ghost"
        onClick={() => router.push("/producer/orders")}
        className="mb-6"
      >
        <ArrowLeft className="mr-2 h-4 w-4" /> Back to Orders
      </Button>

      <div className="grid gap-6 md:grid-cols-3">
        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Order Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Order Number</span>
                  <span>#{order.id.split("-")[0].toUpperCase()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Date</span>
                  <span>{format(new Date(order.createdAt), "PPPp")}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Status</span>
                  <Badge className={statusColors[order.status as OrderStatus]}>
                    {order.status}
                  </Badge>
                </div>
              </div>

              <div className="mt-6 border-t pt-6">
                <h3 className="font-medium mb-4">Products</h3>
                <div className="space-y-4">
                  {order.items.map((item: any) => (
                    <div
                      key={item.id}
                      className="flex justify-between items-center"
                    >
                      <div className="flex items-center space-x-4">
                        <div className="w-16 h-16 bg-muted rounded-md overflow-hidden">
                          {item.product?.imageUrl && (
                            <img
                              src={item.product.imageUrl}
                              alt={item.product.name}
                              className="w-full h-full object-cover"
                            />
                          )}
                        </div>
                        <div>
                          <p className="font-medium">
                            {item.product?.name || "Product"}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            Qty: {item.quantity}
                            {item.size && ` • Size: ${item.size}`}
                            {item.color && ` • Color: ${item.color}`}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p>{formatPrice(item.price)}</p>
                        <p className="text-sm text-muted-foreground">
                          {item.quantity} × {formatPrice(item.price)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Size Evidence Photos Section */}
          {order.sizeEvidenceImages && order.sizeEvidenceImages.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Camera className="mr-2 h-5 w-5" />
                  Size Evidence Photos
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 gap-4">
                  {order.sizeEvidenceImages.map(
                    (imageUrl: string, index: number) => (
                      <div key={index} className="relative group">
                        <div className="aspect-square bg-muted rounded-lg overflow-hidden border">
                          <img
                            src={imageUrl}
                            alt={`Size evidence ${index + 1}`}
                            className="w-full h-full object-cover hover:scale-105 transition-transform duration-200"
                          />
                        </div>
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-200 rounded-lg flex items-center justify-center">
                          <Button
                            variant="secondary"
                            size="sm"
                            className="opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                            onClick={() => window.open(imageUrl, "_blank")}
                          >
                            <Eye className="mr-2 h-4 w-4" />
                            View Full Size
                          </Button>
                        </div>
                        <p className="text-xs text-muted-foreground mt-2 text-center">
                          Photo {index + 1}
                        </p>
                      </div>
                    )
                  )}
                </div>
                <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
                  <p className="text-sm text-blue-700 dark:text-blue-300">
                    <strong>Customer provided these photos</strong> to help you
                    understand their size requirements. Use these as reference
                    when preparing their order.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Additional Notes Section */}
          {order.notes && (
            <Card>
              <CardHeader>
                <CardTitle>Customer Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground whitespace-pre-wrap">
                  {order.notes}
                </p>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Order Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>{formatPrice(subtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Shipping</span>
                  <span>
                    {order.shippingCost
                      ? formatPrice(order.shippingCost)
                      : "Free"}
                  </span>
                </div>
                <div className="border-t pt-2 mt-2 flex justify-between font-medium">
                  <span>Total</span>
                  <span>{formatPrice(order.total)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Customer Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-medium">Contact Information</h4>
                <p className="text-muted-foreground">
                  {order.customer?.email || "No email provided"}
                </p>
                <p className="text-muted-foreground">
                  {order.customer?.phone || "No phone provided"}
                </p>
              </div>
              <div>
                <h4 className="font-medium">Shipping Address</h4>
                <p className="text-muted-foreground">
                  {order.shippingAddress?.name || "No name provided"}
                  <br />
                  {order.shippingAddress?.address1}
                  <br />
                  {order.shippingAddress?.address2 && (
                    <>
                      {order.shippingAddress.address2}
                      <br />
                    </>
                  )}
                  {order.shippingAddress?.city},{" "}
                  {order.shippingAddress?.state || ""}
                  <br />
                  {order.shippingAddress?.country},{" "}
                  {order.shippingAddress?.postalCode}
                </p>
              </div>
            </CardContent>
          </Card>

          <div className="space-y-2">
            <h3 className="font-medium mb-3">Update Order Status</h3>

            {order.status === "pending" && (
              <>
                <Button
                  className="w-full"
                  onClick={() => handleStatusUpdate("processing")}
                  disabled={updating}
                >
                  {updating ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : null}
                  Mark as Processing
                </Button>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => handleStatusUpdate("handled")}
                  disabled={updating}
                >
                  {updating ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : null}
                  Mark as Handled
                </Button>
              </>
            )}

            {order.status === "processing" && (
              <>
                <Button
                  className="w-full"
                  onClick={() => handleStatusUpdate("handled")}
                  disabled={updating}
                >
                  {updating ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : null}
                  Mark as Handled
                </Button>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => handleStatusUpdate("shipped")}
                  disabled={updating}
                >
                  {updating ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : null}
                  Mark as Shipped
                </Button>
              </>
            )}

            {order.status === "handled" && (
              <Button
                className="w-full"
                onClick={() => handleStatusUpdate("shipped")}
                disabled={updating}
              >
                {updating ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : null}
                Mark as Shipped
              </Button>
            )}

            {order.status === "shipped" && (
              <Button
                className="w-full"
                onClick={() => handleStatusUpdate("delivered")}
                disabled={updating}
              >
                {updating ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : null}
                Mark as Delivered
              </Button>
            )}

            {(order.status === "delivered" || order.status === "confirmed") && (
              <div className="p-3 bg-green-50 dark:bg-green-950/20 rounded-lg text-center">
                <p className="text-sm text-green-700 dark:text-green-300 font-medium">
                  {order.status === "confirmed"
                    ? "Order Confirmed by Customer"
                    : "Order Delivered"}
                </p>
                {order.isConfirmedByCustomer &&
                  order.customerConfirmationDate && (
                    <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                      Confirmed on{" "}
                      {format(new Date(order.customerConfirmationDate), "PPP")}
                    </p>
                  )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
