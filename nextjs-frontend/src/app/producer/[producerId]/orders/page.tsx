"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { useState } from "react";
import { useParams } from "next/navigation";
import { Package, Clock, CheckCircle, XCircle, Eye, Edit3 } from "lucide-react";
import ProducerNotifications from "@/components/ProducerNotifications";
import { useAuth } from "@/contexts/AuthContext";

interface Product {
  id: string;
  producerId: string;
  name: string;
  imageUrl?: string;
  [key: string]: any;
}

interface OrderItem {
  id: string;
  product: Product;
  price: string;
  quantity: number;
  [key: string]: any;
}

interface Order {
  id: string;
  producerId: string;
  subtotal: string;
  shipping: string;
  total: string;
  paymentMethod: string;
  paymentStatus: string;
  status: string;
  items: OrderItem[];
  shippingAddress: any;
  customerEmail: string;
  customerPhone: string;
  estimatedDelivery: string;
  createdAt: string;
  updatedAt: string;
  notes?: string;
}

const statusColors = {
  pending: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400",
  confirmed: "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400",
  processing: "bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400",
  shipped: "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400",
  delivered: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-400",
  cancelled: "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400",
};

const statusIcons = {
  pending: Clock,
  confirmed: CheckCircle,
  processing: Package,
  shipped: Package,
  delivered: CheckCircle,
  cancelled: XCircle,
};

function ProducerOrdersPage() {
  const params = useParams();
  const producerId = params.producerId as string;
  const queryClient = useQueryClient();
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [updateStatus, setUpdateStatus] = useState("");
  const [updateNotes, setUpdateNotes] = useState("");

  const { user } = useAuth();
  const {
    data: orders = [],
    isLoading,
    error,
  } = useQuery<Order[]>({
    queryKey: [`/api/orders/producer/${producerId}`],
    queryFn: async () => {
      const response = await fetch(`/api/orders/producer/${producerId}`);
      if (!response.ok) throw new Error("Failed to fetch orders");
      const orders = await response.json();
      
      // Filter items to only include products from this producer and recalculate totals
      return orders.map((order: Order) => {
        const producerItems = order.items.filter((item: OrderItem) => 
          item.product?.producerId === user?.id
        );
        
        if (producerItems.length === 0) return order;
        
        const subtotal = producerItems.reduce((sum: number, item: OrderItem) => 
          sum + (parseFloat(item.price) * item.quantity), 0
        );
        
        // Calculate shipping proportionally based on item count
        const totalItems = order.items.reduce((sum: number, item: OrderItem) => sum + item.quantity, 0);
        const producerItemCount = producerItems.reduce((sum: number, item: OrderItem) => sum + item.quantity, 0);
        const shippingProportion = totalItems > 0 ? producerItemCount / totalItems : 0;
        const shipping = parseFloat(order.shipping) * shippingProportion;
        
        return {
          ...order,
          items: producerItems,
          subtotal: subtotal.toFixed(2),
          shipping: shipping.toFixed(2),
          total: (subtotal + shipping).toFixed(2)
        };
      });
    },
  });

  const updateOrderMutation = useMutation({
    mutationFn: async ({ orderId, status, notes }: { orderId: string; status: string; notes: string }) => {
      const response = await fetch(`/api/orders/producer/${producerId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId, status, notes }),
      });
      if (!response.ok) throw new Error("Failed to update order");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/orders/producer/${producerId}`] });
      setSelectedOrder(null);
      setUpdateStatus("");
      setUpdateNotes("");
    },
  });

  const handleUpdateOrder = () => {
    if (selectedOrder && updateStatus) {
      updateOrderMutation.mutate({
        orderId: selectedOrder.id,
        status: updateStatus,
        notes: updateNotes,
      });
    }
  };

  const formatPrice = (price: string) => {
    return new Intl.NumberFormat("en-RW", {
      style: "currency",
      currency: "RWF",
      minimumFractionDigits: 0,
    }).format(parseInt(price));
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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-6">
        <div className="container mx-auto max-w-6xl">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-64"></div>
            <div className="grid gap-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-32 bg-gray-200 dark:bg-gray-700 rounded-xl"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-6">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center py-12">
            <XCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Error Loading Orders</h2>
            <p className="text-gray-600 dark:text-gray-400">Failed to load producer orders. Please try again.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-gray-900 dark:via-blue-900/20 dark:to-indigo-900/30">
        <div className="container mx-auto max-w-6xl">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Producer Dashboard
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Manage orders for Producer {producerId.slice(-1)}
            </p>
          </div>
          <ProducerNotifications producerId={producerId} />

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl rounded-xl p-6 border border-white/20 dark:border-gray-700/30">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Orders</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{orders.length}</p>
                </div>
                <Package className="h-8 w-8 text-blue-500" />
              </div>
            </div>
            <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl rounded-xl p-6 border border-white/20 dark:border-gray-700/30">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Pending</p>
                  <p className="text-2xl font-bold text-yellow-600">{orders.filter(o => o.status === 'pending').length}</p>
                </div>
                <Clock className="h-8 w-8 text-yellow-500" />
              </div>
            </div>
            <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl rounded-xl p-6 border border-white/20 dark:border-gray-700/30">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Processing</p>
                  <p className="text-2xl font-bold text-purple-600">{orders.filter(o => o.status === 'processing').length}</p>
                </div>
                <Package className="h-8 w-8 text-purple-500" />
              </div>
            </div>
            <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl rounded-xl p-6 border border-white/20 dark:border-gray-700/30">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Completed</p>
                  <p className="text-2xl font-bold text-green-600">{orders.filter(o => o.status === 'delivered').length}</p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-500" />
              </div>
            </div>
          </div>

          {/* Orders List */}
          <div className="space-y-4">
            {orders.length === 0 ? (
              <div className="text-center py-12">
                <Package className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">No Orders Yet</h3>
                <p className="text-gray-600 dark:text-gray-400">You don't have any orders to manage.</p>
              </div>
            ) : (
              orders.map((order) => {
                const StatusIcon = statusIcons[order.status as keyof typeof statusIcons];
                return (
                  <div
                    key={order.id}
                    className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl rounded-xl p-6 border border-white/20 dark:border-gray-700/30 hover:shadow-lg transition-all duration-200"
                  >
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                            Order #{order.id.slice(-8)}
                          </h3>
                          <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColors[order.status as keyof typeof statusColors]}`}>
                            <StatusIcon className="h-3 w-3" />
                            {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                          </span>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600 dark:text-gray-400">
                          <div>
                            <span className="font-medium">Customer:</span> {order.shippingAddress.fullName}
                          </div>
                          <div>
                            <span className="font-medium">Total:</span> {formatPrice(order.total)}
                          </div>
                          <div>
                            <span className="font-medium">Date:</span> {formatDate(order.createdAt)}
                          </div>
                        </div>
                        <div className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                          <span className="font-medium">Items:</span> {order.items.length} product(s)
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => setSelectedOrder(order)}
                          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                        >
                          <Eye className="h-4 w-4" />
                          View Details
                        </button>
                        <button
                          onClick={() => {
                            setSelectedOrder(order);
                            setUpdateStatus(order.status);
                            setUpdateNotes(order.notes || "");
                          }}
                          className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
                        >
                          <Edit3 className="h-4 w-4" />
                          Update
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Order Details Modal */}
          {selectedOrder && (
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
              <div className="bg-white dark:bg-gray-800 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                <div className="p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                      Order Details
                    </h2>
                    <button
                      onClick={() => setSelectedOrder(null)}
                      className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                    >
                      <XCircle className="h-6 w-6" />
                    </button>
                  </div>

                  <div className="space-y-6">
                    {/* Customer Info */}
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Customer Information</h3>
                      <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 space-y-2">
                        <p><span className="font-medium">Name:</span> {selectedOrder.shippingAddress.fullName}</p>
                        <p><span className="font-medium">Email:</span> {selectedOrder.customerEmail}</p>
                        <p><span className="font-medium">Phone:</span> {selectedOrder.customerPhone}</p>
                        <p><span className="font-medium">Address:</span> {selectedOrder.shippingAddress.address}, {selectedOrder.shippingAddress.city}</p>
                      </div>
                    </div>

                    {/* Order Items */}
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Order Items</h3>
                      <div className="space-y-4">
                        {selectedOrder.items
                          .filter(item => item.product?.producerId === user?.id)
                          .map((item) => (
                            <div key={item.id} className="flex items-start gap-4 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                              <div className="flex-shrink-0 w-16 h-16 bg-gray-200 dark:bg-gray-600 rounded-md overflow-hidden">
                                {item.product?.imageUrl ? (
                                  <img
                                    src={item.product.imageUrl}
                                    alt={item.product.name}
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center text-gray-400">
                                    <Package className="h-6 w-6" />
                                  </div>
                                )}
                              </div>
                              <div className="flex-1">
                                <h4 className="font-medium text-gray-900 dark:text-white">{item.product?.name || 'Product'}</h4>
                                <p className="text-sm text-gray-600 dark:text-gray-300">Qty: {item.quantity}</p>
                                <p className="text-sm font-medium text-gray-900 dark:text-white">
                                  {formatPrice(item.price)} each
                                </p>
                              </div>
                              <div className="text-right">
                                <p className="font-medium text-gray-900 dark:text-white">
                                  {formatPrice((parseFloat(item.price) * item.quantity).toString())}
                                </p>
                              </div>
                            </div>
                          ))}
                      </div>

                      {/* Order Summary */}
                      <div className="mt-6 border-t border-gray-200 dark:border-gray-700 pt-4">
                        <div className="flex justify-between py-2">
                          <span className="text-gray-600 dark:text-gray-400">Subtotal</span>
                          <span className="font-medium">{formatPrice(selectedOrder.subtotal)}</span>
                        </div>
                        <div className="flex justify-between py-2">
                          <span className="text-gray-600 dark:text-gray-400">Shipping</span>
                          <span className="font-medium">{formatPrice(selectedOrder.shipping)}</span>
                        </div>
                        <div className="flex justify-between py-2 text-lg font-bold">
                          <span>Total</span>
                          <span>{formatPrice(selectedOrder.total)}</span>
                        </div>
                      </div>
                    </div>

                    {/* Update Status */}
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Update Order</h3>
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Status
                          </label>
                          <select
                            value={updateStatus}
                            onChange={(e) => setUpdateStatus(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                          >
                            <option value="pending">Pending</option>
                            <option value="confirmed">Confirmed</option>
                            <option value="processing">Processing</option>
                            <option value="shipped">Shipped</option>
                            <option value="delivered">Delivered</option>
                            <option value="cancelled">Cancelled</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Notes
                          </label>
                          <textarea
                            value={updateNotes}
                            onChange={(e) => setUpdateNotes(e.target.value)}
                            rows={3}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                            placeholder="Add notes about this order..."
                          />
                        </div>
                        <div className="flex gap-3">
                          <button
                            onClick={handleUpdateOrder}
                            disabled={updateOrderMutation.isPending}
                            className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-4 py-2 rounded-lg transition-colors"
                          >
                            {updateOrderMutation.isPending ? "Updating..." : "Update Order"}
                          </button>
                          <button
                            onClick={() => setSelectedOrder(null)}
                            className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
}

export default ProducerOrdersPage;
