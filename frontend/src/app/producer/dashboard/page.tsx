"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import SubscriptionGuard from "@/components/SubscriptionGuard";
import {
  ShoppingBag,
  Package,
  DollarSign,
  Eye,
  Clock,
  CheckCircle,
  AlertTriangle,
  Camera,
  MessageSquare,
} from "lucide-react";

interface Order {
  id: string;
  customerId: string;
  customerName: string;
  customerEmail: string;
  total: string;
  status: string;
  createdAt: string;
  sizeEvidenceImages: string[];
  isConfirmedByCustomer: boolean;
  shippingAddress: string;
  notes: string;
  items: Array<{
    productName: string;
    quantity: number;
    price: string;
    size?: string;
    color?: string;
  }>;
}

interface DashboardStats {
  totalOrders: number;
  pendingOrders: number;
  processingOrders: number;
  completedOrders: number;
  totalRevenue: number;
  monthlyRevenue: number;
}

export default function ProducerDashboard() {
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<
    "all" | "pending" | "processing" | "handled"
  >("all");

  useEffect(() => {
    if (isAuthenticated && user?.role === "producer") {
      fetchDashboardData();
    }
  }, [isAuthenticated, user]);

  const fetchDashboardData = async () => {
    try {
      // Mock data for development
      const mockOrders: Order[] = [
        {
          id: "ORD-001",
          customerId: "cust1",
          customerName: "Alice Uwimana",
          customerEmail: "alice@example.com",
          total: "45000",
          status: "pending",
          createdAt: "2024-08-28T10:00:00Z",
          sizeEvidenceImages: [
            "https://example.com/size1.jpg",
            "https://example.com/size2.jpg",
          ],
          isConfirmedByCustomer: false,
          shippingAddress: "KG 123 St, Kigali, Rwanda",
          notes: "Please make it slightly loose fitting",
          items: [
            {
              productName: "Summer Dress",
              quantity: 1,
              price: "45000",
              size: "M",
              color: "Blue",
            },
          ],
        },
        {
          id: "ORD-002",
          customerId: "cust2",
          customerName: "Bob Nkurunziza",
          customerEmail: "bob@example.com",
          total: "75000",
          status: "processing",
          createdAt: "2024-08-27T14:30:00Z",
          sizeEvidenceImages: [],
          isConfirmedByCustomer: false,
          shippingAddress: "KG 456 Ave, Butare, Rwanda",
          notes: "",
          items: [
            {
              productName: "Casual Shirt",
              quantity: 2,
              price: "37500",
              size: "L",
              color: "White",
            },
          ],
        },
        {
          id: "ORD-003",
          customerId: "cust3",
          customerName: "Claire Mukamana",
          customerEmail: "claire@example.com",
          total: "120000",
          status: "handled",
          createdAt: "2024-08-25T09:15:00Z",
          sizeEvidenceImages: ["https://example.com/size3.jpg"],
          isConfirmedByCustomer: true,
          shippingAddress: "KG 789 Rd, Musanze, Rwanda",
          notes: "Rush order for wedding",
          items: [
            {
              productName: "Evening Gown",
              quantity: 1,
              price: "120000",
              size: "S",
              color: "Black",
            },
          ],
        },
      ];

      const mockStats: DashboardStats = {
        totalOrders: mockOrders.length,
        pendingOrders: mockOrders.filter((o) => o.status === "pending").length,
        processingOrders: mockOrders.filter((o) => o.status === "processing")
          .length,
        completedOrders: mockOrders.filter((o) => o.status === "handled")
          .length,
        totalRevenue: mockOrders.reduce(
          (sum, o) => sum + parseFloat(o.total),
          0
        ),
        monthlyRevenue: mockOrders
          .filter(
            (o) => new Date(o.createdAt).getMonth() === new Date().getMonth()
          )
          .reduce((sum, o) => sum + parseFloat(o.total), 0),
      };

      setOrders(mockOrders);
      setStats(mockStats);
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      setOrders((prev) =>
        prev.map((order) =>
          order.id === orderId ? { ...order, status: newStatus } : order
        )
      );

      // In production, this would make an API call
      console.log(`Updated order ${orderId} to status ${newStatus}`);
    } catch (error) {
      console.error("Error updating order status:", error);
    }
  };

  const filteredOrders = orders.filter((order) => {
    if (filterStatus === "all") return true;
    return order.status === filterStatus;
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending":
        return <Clock className="h-4 w-4 text-orange-400" />;
      case "processing":
        return <Package className="h-4 w-4 text-blue-400" />;
      case "handled":
        return <CheckCircle className="h-4 w-4 text-green-400" />;
      default:
        return <AlertTriangle className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-orange-500/20 text-orange-400 border-orange-500/30";
      case "processing":
        return "bg-blue-500/20 text-blue-400 border-blue-500/30";
      case "handled":
        return "bg-green-500/20 text-green-400 border-green-500/30";
      default:
        return "bg-gray-500/20 text-gray-400 border-gray-500/30";
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-400 mx-auto mb-4"></div>
          <p className="text-white">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <SubscriptionGuard requiredForRoles={["producer"]}>
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        {/* Animated background */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-cyan-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
        </div>

        <div className="relative z-10 container mx-auto px-4 py-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-4xl font-bold text-white mb-2">
                Producer Dashboard
              </h1>
              <p className="text-gray-300">Manage your orders and business</p>
            </div>

            <button
              onClick={() => router.push("/producer/products")}
              className="px-6 py-3 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-xl hover:shadow-lg transition-all duration-300 flex items-center"
            >
              <Package className="h-5 w-5 mr-2" />
              Manage Products
            </button>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">Total Orders</p>
                  <p className="text-2xl font-bold text-white">
                    {stats?.totalOrders}
                  </p>
                </div>
                <ShoppingBag className="h-8 w-8 text-blue-400" />
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">Pending Orders</p>
                  <p className="text-2xl font-bold text-white">
                    {stats?.pendingOrders}
                  </p>
                </div>
                <Clock className="h-8 w-8 text-orange-400" />
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">Completed Orders</p>
                  <p className="text-2xl font-bold text-white">
                    {stats?.completedOrders}
                  </p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-400" />
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">Monthly Revenue</p>
                  <p className="text-2xl font-bold text-white">
                    {stats?.monthlyRevenue.toLocaleString()} RWF
                  </p>
                </div>
                <DollarSign className="h-8 w-8 text-yellow-400" />
              </div>
            </div>
          </div>

          {/* Order Status Filter */}
          <div className="flex items-center gap-4 mb-6">
            <p className="text-white font-medium">Filter by status:</p>
            <div className="flex gap-2">
              {[
                { key: "all", label: "All Orders" },
                { key: "pending", label: "Pending" },
                { key: "processing", label: "Processing" },
                { key: "handled", label: "Handled" },
              ].map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => setFilterStatus(key as any)}
                  className={`px-4 py-2 rounded-xl transition-all duration-300 ${
                    filterStatus === key
                      ? "bg-purple-500 text-white"
                      : "bg-white/10 text-gray-300 hover:bg-white/20"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Orders List */}
          <div className="space-y-4">
            {filteredOrders.map((order) => (
              <div
                key={order.id}
                className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 p-6 hover:bg-white/15 transition-all duration-300"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-white">
                        Order #{order.id}
                      </h3>
                      <span
                        className={`px-3 py-1 rounded-full text-sm font-semibold border flex items-center gap-2 ${getStatusColor(
                          order.status
                        )}`}
                      >
                        {getStatusIcon(order.status)}
                        {order.status.charAt(0).toUpperCase() +
                          order.status.slice(1)}
                      </span>
                      {order.isConfirmedByCustomer && (
                        <span className="px-2 py-1 bg-emerald-500/20 text-emerald-400 rounded-full text-xs flex items-center gap-1">
                          <CheckCircle className="h-3 w-3" />
                          Confirmed by Customer
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div>
                        <p className="text-gray-400 text-sm">Customer</p>
                        <p className="text-white font-medium">
                          {order.customerName}
                        </p>
                        <p className="text-gray-300 text-sm">
                          {order.customerEmail}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-400 text-sm">Order Date</p>
                        <p className="text-white">
                          {new Date(order.createdAt).toLocaleDateString()}
                        </p>
                        <p className="text-purple-300 font-semibold">
                          {order.total} RWF
                        </p>
                      </div>
                    </div>

                    {/* Order Items */}
                    <div className="mb-4">
                      <p className="text-gray-400 text-sm mb-2">Items</p>
                      <div className="space-y-2">
                        {order.items.map((item, index) => (
                          <div
                            key={index}
                            className="flex items-center justify-between p-2 bg-white/5 rounded-lg"
                          >
                            <div>
                              <p className="text-white font-medium">
                                {item.productName}
                              </p>
                              <p className="text-gray-400 text-sm">
                                Qty: {item.quantity} • Size:{" "}
                                {item.size || "N/A"} • Color:{" "}
                                {item.color || "N/A"}
                              </p>
                            </div>
                            <p className="text-white font-semibold">
                              {item.price} RWF
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Size Evidence Images */}
                    {order.sizeEvidenceImages.length > 0 && (
                      <div className="mb-4">
                        <div className="flex items-center gap-2 mb-2">
                          <Camera className="h-4 w-4 text-purple-400" />
                          <p className="text-gray-400 text-sm">
                            Size Evidence Photos (
                            {order.sizeEvidenceImages.length})
                          </p>
                        </div>
                        <div className="flex gap-2">
                          {order.sizeEvidenceImages.map((imageUrl, index) => (
                            <div
                              key={index}
                              className="w-16 h-16 bg-white/10 rounded-lg overflow-hidden"
                            >
                              <img
                                src={imageUrl}
                                alt={`Size evidence ${index + 1}`}
                                className="w-full h-full object-cover"
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Customer Notes */}
                    {order.notes && (
                      <div className="mb-4">
                        <div className="flex items-center gap-2 mb-2">
                          <MessageSquare className="h-4 w-4 text-blue-400" />
                          <p className="text-gray-400 text-sm">
                            Customer Notes
                          </p>
                        </div>
                        <p className="text-gray-300 text-sm bg-white/5 p-3 rounded-lg">
                          {order.notes}
                        </p>
                      </div>
                    )}

                    {/* Shipping Address */}
                    <div className="mb-4">
                      <p className="text-gray-400 text-sm">Shipping Address</p>
                      <p className="text-gray-300 text-sm">
                        {order.shippingAddress}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2 ml-4">
                    <button
                      onClick={() =>
                        router.push(`/producer/orders/${order.id}`)
                      }
                      className="p-2 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-colors"
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {/* Status Update Actions */}
                {order.status !== "handled" && (
                  <div className="border-t border-white/10 pt-4">
                    <div className="flex gap-2">
                      {order.status === "pending" && (
                        <button
                          onClick={() =>
                            updateOrderStatus(order.id, "processing")
                          }
                          className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm"
                        >
                          Start Processing
                        </button>
                      )}
                      {order.status === "processing" && (
                        <button
                          onClick={() => updateOrderStatus(order.id, "handled")}
                          className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors text-sm"
                        >
                          Mark as Handled
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {filteredOrders.length === 0 && (
            <div className="text-center py-12">
              <ShoppingBag className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">
                No orders found
              </h3>
              <p className="text-gray-400">
                {filterStatus === "all"
                  ? "You haven't received any orders yet"
                  : `No ${filterStatus} orders at the moment`}
              </p>
            </div>
          )}
        </div>
      </div>
    </SubscriptionGuard>
  );
}
