"use client";

import { useState, useEffect } from "react";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { apiClient, API_ENDPOINTS } from "@/config/api";
import { useToast } from "@/hooks/use-toast";
import {
  Users,
  Package,
  DollarSign,
  CheckCircle,
  Clock,
  AlertTriangle,
  Eye,
  UserCheck,
  Ban,
  MoreVertical,
  Search,
} from "lucide-react";
import { Button } from "@/components/custom-ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/custom-ui/card";
import { useLanguage } from "@/contexts/LanguageContext";

function AdminDashboard() {
  const { user } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState("overview");
  const [dashboardData, setDashboardData] = useState({
    stats: {},
    producers: [],
    agents: [],
    orders: [],
    pendingApprovals: [],
  });

  const formatCurrency = (amount: number | string | undefined) => {
    const n = typeof amount === "string" ? parseFloat(amount) : amount ?? 0;
    return new Intl.NumberFormat("en-RW", {
      style: "currency",
      currency: "RWF",
      minimumFractionDigits: 0,
    }).format(Number.isFinite(n) ? n : 0);
  };

  // Derived UI data
  const computedStats = (() => {
    const s: any = dashboardData.stats || {};
    return [
      {
        title: t("admin.stats.totalUsers"),
        value: s.totalUsers ?? 0,
        change: "",
        icon: Users,
        color: "text-blue-600",
        bgColor: "bg-blue-100 dark:bg-blue-900/20",
      },
      {
        title: t("admin.stats.producers"),
        value: s.totalProducers ?? 0,
        change: "",
        icon: UserCheck,
        color: "text-purple-600",
        bgColor: "bg-purple-100 dark:bg-purple-900/20",
      },
      {
        title: t("admin.stats.orders"),
        value: s.totalOrders ?? 0,
        change: "",
        icon: Package,
        color: "text-orange-600",
        bgColor: "bg-orange-100 dark:bg-orange-900/20",
      },
      {
        title: t("admin.stats.revenue"),
        value: formatCurrency(s.totalRevenue ?? 0),
        change: "",
        icon: DollarSign,
        color: "text-green-600",
        bgColor: "bg-green-100 dark:bg-green-900/20",
      },
    ];
  })();

  const computedUsersByRole = (() => {
    const s: any = dashboardData.stats || {};
    const total = Number(s.totalUsers || 0);
    const producers = Number(s.totalProducers || 0);
    const agents = Number(s.totalAgents || 0);
    const customers = Math.max(total - producers - agents, 0);
    const pct = (n: number) => (total > 0 ? Math.round((n / total) * 100) : 0);
    return [
      {
        role: t("admin.roles.producers"),
        count: producers,
        percentage: pct(producers),
        color: "bg-purple-500",
      },
      {
        role: t("admin.roles.agents"),
        count: agents,
        percentage: pct(agents),
        color: "bg-blue-500",
      },
      {
        role: t("admin.roles.customers"),
        count: customers,
        percentage: pct(customers),
        color: "bg-green-500",
      },
    ];
  })();

  const computedRecentActivity = (() => {
    const orders: any[] = (dashboardData.orders as any[]) || [];
    return orders.slice(0, 6).map((o) => ({
      id: o.id,
      type:
        o.status === "delivered"
          ? "success"
          : o.status === "cancelled"
          ? "warning"
          : "info",
      action:
        o.status === "delivered"
          ? t("admin.activity.orderDelivered")
          : o.status === "cancelled"
          ? t("admin.activity.orderCancelled")
          : t("admin.activity.orderUpdate"),
      target: `${t("producer.order")} #${String(o.id).slice(-8)} • ${
        o.items?.length || 0
      } ${o.items?.length === 1 ? t("orders.detail.count") : t("orders.detail.countPlural")}`,
      user: o.customerEmail || "customer",
      timestamp: new Date(
        o.createdAt || o.updatedAt || Date.now()
      ).toLocaleString("en-RW", {
        hour: "2-digit",
        minute: "2-digit",
        month: "short",
        day: "numeric",
      }),
    }));
  })();

  useEffect(() => {
    if (user?.role !== "admin") {
      router.push("/");
      return;
    }
    fetchDashboardData();
  }, [user, router]);

  const fetchDashboardData = async () => {
    try {
      const [statsRes, producersRes, agentsRes, ordersRes, approvalsRes] =
        await Promise.all([
          apiClient.get(API_ENDPOINTS.ADMIN_STATS),
          apiClient.get(API_ENDPOINTS.ADMIN_PRODUCERS),
          apiClient.get(API_ENDPOINTS.ADMIN_AGENTS),
          apiClient.get(API_ENDPOINTS.ADMIN_ORDERS),
          apiClient.get(API_ENDPOINTS.ADMIN_PENDING_APPROVALS),
        ]);

      setDashboardData({
        stats: statsRes.data,
        producers: producersRes.data,
        agents: agentsRes.data,
        orders: ordersRes.data,
        pendingApprovals: approvalsRes.data,
      });
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      toast({
        title: "Error",
        description: "Failed to load dashboard data",
        variant: "destructive",
      });
    } finally {
      // setLoading(false);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-100";
      case "medium":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-800 dark:text-yellow-100";
      case "low":
        return "bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-100";
    }
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case "success":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "warning":
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case "info":
        return <Clock className="h-4 w-4 text-blue-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <main className="pt-24 pb-12 px-4 md:px-6">
          <div className=" ">
            {/* Header */}
            <div className="mb-8">
              <h1 className="text-3xl md:text-4xl font-bold gradient-text">
                {t("admin.header.title")}
              </h1>
              <p className="text-muted-foreground mt-2">
                {t("admin.header.subtitle")}
              </p>
            </div>

            {/* Navigation Tabs */}
            <div className="glassmorphism rounded-2xl p-2 mb-8">
              <div className="flex space-x-2">
                {["overview", "approvals", "users", "analytics"].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`px-6 py-3 rounded-full font-medium transition-all duration-300 capitalize ${
                      activeTab === tab
                        ? "gradient-bg text-white shadow-lg"
                        : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
                    }`}
                  >
                    {t(`admin.tabs.${tab}` as any)}
                  </button>
                ))}
              </div>
            </div>

            {activeTab === "overview" && (
              <>
                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                  {/* Live stats from backend */}
                  {computedStats.map((stat, index) => {
                    const Icon = stat.icon;
                    return (
                      <Card key={index} className="floating-card">
                        <CardContent className="p-6">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm text-gray-600 dark:text-gray-400">
                                {stat.title}
                              </p>
                              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100 mt-1">
                                {stat.value}
                              </p>
                              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                {stat.change}
                              </p>
                            </div>
                            <div className={`p-3 rounded-xl ${stat.bgColor}`}>
                              <Icon className={`h-6 w-6 ${stat.color}`} />
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* User Distribution */}
                  <Card className="floating-card">
                    <CardHeader>
                      <CardTitle className="gradient-text">
                        {t("admin.userDistribution")}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {computedUsersByRole.map((user) => (
                        <div key={user.role} className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600 dark:text-gray-400">
                              {user.role}
                            </span>
                            <span className="font-medium">
                              {user.count} ({user.percentage}%)
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                            <div
                              className={`${user.color} h-2 rounded-full transition-all duration-500`}
                              style={{ width: `${user.percentage}%` }}
                            ></div>
                          </div>
                        </div>
                      ))}
                    </CardContent>
                  </Card>

                  {/* Recent Activity */}
                  <Card className="floating-card">
                    <CardHeader>
                      <CardTitle className="gradient-text">
                        {t("admin.recentActivity")}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {computedRecentActivity.map((activity) => (
                        <div
                          key={activity.id}
                          className="glassmorphism rounded-xl p-4"
                        >
                          <div className="flex items-start space-x-3">
                            {getActivityIcon(activity.type)}
                            <div className="flex-1">
                              <p className="font-medium text-gray-900 dark:text-gray-100">
                                {activity.action}
                              </p>
                              <p className="text-sm text-gray-600 dark:text-gray-400">
                                {activity.target}
                              </p>
                              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                {activity.user} • {activity.timestamp}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                </div>
              </>
            )}

            {activeTab === "users" && (
              <div className="space-y-6">
                {/* Producers Management */}
                <Card className="floating-card">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="gradient-text">
                        {t("admin.producers.title").replace("{count}", String(dashboardData.producers.length))}
                      </CardTitle>
                      <Button variant="outline" size="sm">
                        <Search className="h-4 w-4 mr-2" />
                        {t("admin.search")}
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {dashboardData.producers
                        .slice(0, 5)
                        .map((producer: any) => (
                          <div
                            key={producer.id}
                            className="glassmorphism rounded-xl p-4"
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-4">
                                <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900 dark:to-purple-900 rounded-full flex items-center justify-center">
                                  <Users className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                                </div>
                                <div>
                                  <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                                    {producer.fullName || producer.username}
                                  </h3>
                                  <p className="text-sm text-gray-600 dark:text-gray-400">
                                    {producer.email}
                                  </p>
                                  <p className="text-xs text-gray-500 dark:text-gray-400">
                                    {t("admin.business")}: {producer.businessName || "Not specified"}
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-center space-x-2">
                                <span
                                  className={`px-2 py-1 rounded-full text-xs ${
                                    producer.isVerified
                                      ? "bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100"
                                      : "bg-yellow-100 text-yellow-800 dark:bg-yellow-800 dark:text-yellow-100"
                                  }`}
                                >
                                  {producer.isVerified ? t("admin.verified") : t("admin.pending")}
                                </span>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8"
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Agents Management */}
                <Card className="floating-card">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="gradient-text">
                        {t("admin.agents.title").replace("{count}", String(dashboardData.agents.length))}
                      </CardTitle>
                      <Button variant="outline" size="sm">
                        <Search className="h-4 w-4 mr-2" />
                        {t("admin.search")}
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {dashboardData.agents.slice(0, 5).map((agent: any) => (
                        <div key={agent.id} className="glassmorphism rounded-xl p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-4">
                              <div className="w-12 h-12 bg-gradient-to-br from-green-100 to-blue-100 dark:from-green-900 dark:to-blue-900 rounded-full flex items-center justify-center">
                                <UserCheck className="h-6 w-6 text-green-600 dark:text-green-400" />
                              </div>
                              <div>
                                <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                                  {agent.fullName || agent.username}
                                </h3>
                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                  {agent.email}
                                </p>
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                  {t("admin.managedProducers")}: {agent.managedProducers || 0}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center space-x-2">
                              <span className="px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-100">
                                {t("admin.active")}
                              </span>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <Eye className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}

export default AdminDashboard;
