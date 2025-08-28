"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { format } from "date-fns";
import { Loader2 } from "lucide-react";
import apiClient from "@/lib/api-client";
import { handleApiError } from "@/lib/utils";

type OrderStatus =
  | "all"
  | "pending"
  | "processing"
  | "shipped"
  | "delivered"
  | "cancelled";

export default function ProducerOrdersPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const [status, setStatus] = useState<OrderStatus>("all");

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

  const {
    data: orders = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ["/api/producer/orders", { status }],
    queryFn: async () => {
      try {
        const response = await apiClient.get(
          `/api/producer/orders?status=${status === "all" ? "" : status}`
        );
        return response.data;
      } catch (error) {
        throw new Error(handleApiError(error));
      }
    },
    enabled:
      isAuthenticated && (user?.role === "producer" || user?.role === "admin"),
  });

  const formatPrice = (price: string | number) => {
    const numPrice = typeof price === "string" ? parseFloat(price) : price;
    return new Intl.NumberFormat("en-RW", {
      style: "currency",
      currency: "RWF",
      minimumFractionDigits: 0,
    }).format(numPrice);
  };

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-4">
        <div className="text-red-500">
          Error loading orders: {error.message}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">My Orders</h1>
      </div>

      <Tabs
        defaultValue="all"
        onValueChange={(value) => setStatus(value as OrderStatus)}
      >
        <TabsList className="grid w-full grid-cols-6 mb-6">
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="pending">Pending</TabsTrigger>
          <TabsTrigger value="processing">Processing</TabsTrigger>
          <TabsTrigger value="shipped">Shipped</TabsTrigger>
          <TabsTrigger value="delivered">Delivered</TabsTrigger>
          <TabsTrigger value="cancelled">Cancelled</TabsTrigger>
        </TabsList>

        <TabsContent value={status}>
          {isLoading ? (
            <div className="flex justify-center items-center h-64">
              <Loader2 className="w-8 h-8 animate-spin" />
            </div>
          ) : orders.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No orders found</p>
            </div>
          ) : (
            <div className="space-y-4">
              {orders.map((order: any) => (
                <Card
                  key={order.id}
                  className="hover:shadow-md transition-shadow"
                >
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-lg">
                          Order #{order.id.split("-")[0].toUpperCase()}
                        </CardTitle>
                        <p className="text-sm text-muted-foreground">
                          {format(new Date(order.createdAt), "PPPp")}
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="font-medium">
                          {formatPrice(order.total)}
                        </div>
                        <div className="text-sm capitalize">{order.status}</div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex justify-between items-center">
                      <div className="text-sm text-muted-foreground">
                        {order.items.length} item
                        {order.items.length > 1 ? "s" : ""}
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          router.push(`/producer/orders/${order.id}`)
                        }
                      >
                        View Details
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
