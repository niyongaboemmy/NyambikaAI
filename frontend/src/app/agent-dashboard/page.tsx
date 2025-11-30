"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/custom-ui/card";
import { Button } from "@/components/custom-ui/button";
import { apiClient } from "@/config/api";
import { useToast } from "@/hooks/use-toast";
import {
  Users,
  DollarSign,
  TrendingUp,
  Calendar,
  Building2,
  CreditCard,
  AlertCircle,
  CheckCircle2,
  Clock,
  ArrowUpRight,
  Brain,
  Sparkles,
  Zap,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

interface DashboardStats {
  totalProducers: number;
  activeSubscriptions: number;
  expiredSubscriptions: number;
  totalCommissions: number;
  monthlyCommissions: number;
  pendingPayments: number;
}

interface RecentActivity {
  id: string;
  type: "payment" | "subscription" | "commission";
  description: string;
  amount?: number;
  date: string;
  status: "completed" | "pending" | "failed";
}

interface CommissionHistory {
  id: string;
  amount: number;
  subscriptionId: string;
  producerName: string;
  createdAt: string;
  status: string;
}

export default function AgentDashboard() {
  const { user } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboardData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Fetch agent stats
      const statsResponse = await apiClient.get("/api/agent/stats");
      setStats(statsResponse.data);

      // Fetch recent commission history for activity feed
      const commissionsResponse = await apiClient.get(
        "/api/agent/commissions?limit=5"
      );
      const commissions: CommissionHistory[] = commissionsResponse.data;

      // Transform commission data into recent activity format
      const activity: RecentActivity[] = commissions.map((commission) => ({
        id: commission.id,
        type: "commission" as const,
        description: `Commission earned from ${commission.producerName} subscription`,
        amount: commission.amount,
        date: commission.createdAt,
        status: commission.status === "paid" ? "completed" : "pending",
      }));

      setRecentActivity(activity);
    } catch (error: any) {
      console.error("Error fetching dashboard data:", error);
      setError(
        error.response?.data?.message || "Failed to load dashboard data"
      );
      toast({
        title: "Error",
        description: "Failed to load dashboard data",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user && user.role === "agent") {
      fetchDashboardData();
    }
  }, [user]);

  if (!user || user.role !== "agent") {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-96">
          <CardContent className="pt-6">
            <div className="text-center">
              <Users className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                Access Denied
              </h3>
              <p className="text-gray-500 dark:text-gray-400">
                You need agent privileges to access this page.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-96">
          <CardContent className="pt-6">
            <div className="text-center">
              <AlertCircle className="mx-auto h-12 w-12 text-red-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                Error Loading Dashboard
              </h3>
              <p className="text-gray-500 dark:text-gray-400 mb-4">{error}</p>
              <Button onClick={fetchDashboardData} variant="outline">
                Try Again
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isLoading || !stats) {
    return (
      <div className="space-y-6 p-6">
        <div className="w-64 h-8 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, index) => (
            <div
              key={index}
              className="w-full h-32 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse"
            />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="w-full h-96 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse" />
          <div className="w-full h-96 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse" />
        </div>
      </div>
    );
  }

  const getActivityIcon = (type: string) => {
    switch (type) {
      case "commission":
        return <DollarSign className="h-4 w-4" />;
      case "payment":
        return <CreditCard className="h-4 w-4" />;
      case "subscription":
        return <Building2 className="h-4 w-4" />;
      default:
        return <Calendar className="h-4 w-4" />;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case "pending":
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case "failed":
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  return (
    <div className="relative min-h-screen pt-6">
      {/* Holographic Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <motion.div
          className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-400/20 to-purple-600/20 rounded-full blur-3xl"
          animate={{ scale: [1, 1.2, 1], rotate: [0, 180, 360] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-tr from-purple-400/20 to-blue-600/20 rounded-full blur-3xl"
          animate={{ scale: [1.2, 1, 1.2], rotate: [360, 180, 0] }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-r from-cyan-400/10 to-blue-600/10 rounded-full blur-3xl"
          animate={{ scale: [1, 1.1, 1], opacity: [0.3, 0.6, 0.3] }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
        />

        {/* Neural Grid */}
        <div className="absolute inset-0 opacity-10 dark:opacity-5">
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: `
                linear-gradient(90deg, rgba(59, 130, 246, 0.25) 1px, transparent 1px),
                linear-gradient(rgba(59, 130, 246, 0.25) 1px, transparent 1px),
                radial-gradient(circle at 25% 25%, rgba(168, 85, 247, 0.35) 2px, transparent 2px),
                radial-gradient(circle at 75% 75%, rgba(236, 72, 153, 0.35) 2px, transparent 2px)
              `,
              backgroundSize: "50px 50px, 50px 50px, 100px 100px, 100px 100px",
            }}
          />
        </div>

        {/* Floating Particles */}
        {[...Array(6)].map((_, i) => (
          <motion.div
            key={i}
            className={`absolute w-2 h-2 rounded-full ${
              i % 3 === 0
                ? "bg-blue-400/40"
                : i % 3 === 1
                ? "bg-purple-400/40"
                : "bg-blue-400/40"
            }`}
            style={{ left: `${20 + i * 15}%`, top: `${30 + i * 10}%` }}
            animate={{
              y: [-20, 20, -20],
              x: [-10, 10, -10],
              opacity: [0.4, 0.8, 0.4],
              scale: [1, 1.2, 1],
            }}
            transition={{
              duration: 4 + i,
              repeat: Infinity,
              ease: "easeInOut",
              delay: i * 0.5,
            }}
          />
        ))}
      </div>

      <div className="relative space-y-6 pt-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-6">
              <motion.div
                className="relative"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                  <Brain className="w-6 h-6 text-white" />
                </div>
                <motion.div
                  className="absolute -inset-2 rounded-2xl border-2 border-blue-500/30"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                />
                <motion.div
                  className="absolute -inset-1 rounded-2xl border border-purple-500/30"
                  animate={{ rotate: -360 }}
                  transition={{ duration: 6, repeat: Infinity, ease: "linear" }}
                />
                <motion.div
                  className="absolute -top-1 -right-1 w-4 h-4 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full flex items-center justify-center"
                  animate={{ rotate: 360, scale: [1, 1.2, 1] }}
                  transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                >
                  <Sparkles className="w-2 h-2 text-white" />
                </motion.div>
              </motion.div>
              <div>
                <h1 className="text-2xl font-bold">Agent Dashboard</h1>
                <p className="text-gray-600 dark:text-gray-400 flex items-center gap-2 text-sm">
                  <Zap className="w-4 h-4 text-blue-500" />
                  Welcome back, {user.name}! Manage your producers and track
                  commissions.
                </p>
              </div>
            </div>
          </div>
          <div className="flex flex-row items-center gap-3">
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Button
                onClick={fetchDashboardData}
                variant="outline"
                size="sm"
                className="border-2 hover:bg-white/50 dark:hover:bg-gray-800/50 backdrop-blur-sm rounded-full px-4"
              >
                Refresh
              </Button>
            </motion.div>
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Button
                onClick={() => router.push("/agent/producers-management")}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white hover:shadow-xl transition-all duration-300"
              >
                <Users className="h-4 w-4 mr-2" />
                Manage Producers
              </Button>
            </motion.div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="bg-gradient-to-br from-blue-50/80 to-blue-100/80 dark:from-blue-900/30 dark:to-blue-800/30 border-blue-200/50 dark:border-blue-700/50 backdrop-blur-xl hover:shadow-xl transition-all duration-300">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-blue-600 dark:text-blue-400 text-sm font-medium">
                      Total Producers
                    </p>
                    <p className="text-3xl font-bold text-blue-900 dark:text-blue-100">
                      {stats.totalProducers}
                    </p>
                  </div>
                  <motion.div
                    className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center"
                    whileHover={{ rotate: 5 }}
                  >
                    <Users className="h-6 w-6 text-white" />
                  </motion.div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="bg-gradient-to-br from-green-50/80 to-green-100/80 dark:from-green-900/30 dark:to-green-800/30 border-green-200/50 dark:border-green-700/50 backdrop-blur-xl hover:shadow-xl transition-all duration-300">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-green-600 dark:text-green-400 text-sm font-medium">
                      Active Subscriptions
                    </p>
                    <p className="text-3xl font-bold text-green-900 dark:text-green-100">
                      {stats.activeSubscriptions}
                    </p>
                  </div>
                  <motion.div
                    className="w-12 h-12 rounded-2xl bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center shadow-lg"
                    whileHover={{ rotate: 5 }}
                  >
                    <CheckCircle2 className="h-6 w-6 text-white" />
                  </motion.div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card className="bg-gradient-to-br from-red-50/80 to-red-100/80 dark:from-red-900/30 dark:to-red-800/30 border-red-200/50 dark:border-red-700/50 backdrop-blur-xl hover:shadow-xl transition-all duration-300">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-red-600 dark:text-red-400 text-sm font-medium">
                      Expired Subscriptions
                    </p>
                    <p className="text-3xl font-bold text-red-900 dark:text-red-100">
                      {stats.expiredSubscriptions}
                    </p>
                  </div>
                  <motion.div
                    className="w-12 h-12 rounded-2xl bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center shadow-lg"
                    whileHover={{ rotate: 5 }}
                  >
                    <AlertCircle className="h-6 w-6 text-white" />
                  </motion.div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Card className="bg-gradient-to-br from-purple-50/80 to-purple-100/80 dark:from-purple-900/30 dark:to-purple-800/30 border-purple-200/50 dark:border-purple-700/50 backdrop-blur-xl hover:shadow-xl transition-all duration-300">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-purple-600 dark:text-purple-400 text-sm font-medium">
                      Total Commissions
                    </p>
                    <p className="text-2xl sm:text-3xl font-bold text-purple-900 dark:text-purple-100">
                      {stats.totalCommissions.toLocaleString()} RWF
                    </p>
                  </div>
                  <motion.div
                    className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center"
                    whileHover={{ rotate: 5 }}
                  >
                    <DollarSign className="h-6 w-6 text-white" />
                  </motion.div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <Card className="bg-gradient-to-br from-orange-50/80 to-orange-100/80 dark:from-orange-900/30 dark:to-orange-800/30 border-orange-200/50 dark:border-orange-700/50 backdrop-blur-xl hover:shadow-xl transition-all duration-300">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-orange-600 dark:text-orange-400 text-sm font-medium">
                      Monthly Commissions
                    </p>
                    <p className="text-3xl font-bold text-orange-900 dark:text-orange-100">
                      {stats.monthlyCommissions.toLocaleString()} RWF
                    </p>
                  </div>
                  <motion.div
                    className="w-12 h-12 rounded-2xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center shadow-lg"
                    whileHover={{ rotate: 5 }}
                  >
                    <TrendingUp className="h-6 w-6 text-white" />
                  </motion.div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
          >
            <Card className="bg-gradient-to-br from-yellow-50/80 to-yellow-100/80 dark:from-yellow-900/30 dark:to-yellow-800/30 border-yellow-200/50 dark:border-yellow-700/50 backdrop-blur-xl hover:shadow-xl transition-all duration-300">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-yellow-600 dark:text-yellow-400 text-sm font-medium">
                      Pending Payments
                    </p>
                    <p className="text-3xl font-bold text-yellow-900 dark:text-yellow-100">
                      {stats.pendingPayments}
                    </p>
                  </div>
                  <motion.div
                    className="w-12 h-12 rounded-2xl bg-gradient-to-br from-yellow-500 to-yellow-600 flex items-center justify-center"
                    whileHover={{ rotate: 5 }}
                  >
                    <Clock className="h-6 w-6 text-white" />
                  </motion.div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Quick Actions & Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-2 sm:gap-4">
          {/* Quick Actions */}
          <Card className="bg-white/70 dark:bg-gray-900/70 backdrop-blur-xl border-gray-200/50 dark:border-gray-700/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ArrowUpRight className="h-5 w-5 text-blue-600" />
                Quick Actions
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <motion.div
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
              >
                <Button
                  onClick={() => router.push("/agent/producers-management")}
                  className="w-full justify-start"
                  variant="outline"
                >
                  <Users className="h-4 w-4 mr-2" />
                  View All Producers
                </Button>
              </motion.div>
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card className="bg-white/70 dark:bg-gray-900/70 backdrop-blur-xl border-gray-200/50 dark:border-gray-700/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-purple-600" />
                Recent Activity
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {recentActivity.length === 0 ? (
                  <div className="text-center py-8">
                    <Calendar className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                    <p className="text-gray-500 dark:text-gray-400">
                      No recent activity found
                    </p>
                  </div>
                ) : (
                  recentActivity.map((activity, idx) => (
                    <motion.div
                      key={activity.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      className="flex items-start gap-3 p-3 rounded-lg bg-gradient-to-br from-gray-50/70 to-white/70 dark:from-gray-800/50 dark:to-gray-900/50"
                    >
                      <div className="flex-shrink-0 mt-0.5">
                        {getActivityIcon(activity.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {activity.description}
                        </p>
                        <div className="flex items-center gap-2 mt-1 text-xs">
                          <span className="text-gray-500 dark:text-gray-400">
                            {new Date(activity.date).toLocaleDateString()}
                          </span>
                          {activity.amount && (
                            <span className="font-medium text-green-600 dark:text-green-400">
                              {activity.amount.toLocaleString()} RWF
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex-shrink-0">
                        {getStatusIcon(activity.status)}
                      </div>
                    </motion.div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Alerts */}
        {stats.expiredSubscriptions > 0 && (
          <Card className="border-red-200/60 dark:border-red-800/60 bg-gradient-to-br from-red-50/80 to-red-100/80 dark:from-red-900/20 dark:to-red-800/20 backdrop-blur-xl">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
                <div>
                  <h3 className="font-medium text-red-900 dark:text-red-100">
                    Expired Subscriptions Alert
                  </h3>
                  <p className="text-sm text-red-700 dark:text-red-300">
                    You have {stats.expiredSubscriptions} producers with expired
                    subscriptions. Contact them to renew their subscriptions and
                    continue earning commissions.
                  </p>
                </div>
                <Button
                  onClick={() =>
                    router.push("/agent/producers-management?filter=expired")
                  }
                  size="sm"
                  className="ml-auto bg-red-600 hover:bg-red-700 text-white"
                >
                  View Expired
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
