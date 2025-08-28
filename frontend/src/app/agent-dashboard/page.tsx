"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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

export default function AgentDashboard() {
  const { user } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Mock data for demonstration
    const mockStats: DashboardStats = {
      totalProducers: 12,
      activeSubscriptions: 9,
      expiredSubscriptions: 3,
      totalCommissions: 145000,
      monthlyCommissions: 28000,
      pendingPayments: 2,
    };

    const mockActivity: RecentActivity[] = [
      {
        id: "1",
        type: "commission",
        description: "Commission earned from Marie Mukamana subscription",
        amount: 10000,
        date: "2024-01-20",
        status: "completed",
      },
      {
        id: "2",
        type: "payment",
        description: "Subscription payment for Paul Nkurunziza",
        amount: 75000,
        date: "2024-01-19",
        status: "completed",
      },
      {
        id: "3",
        type: "subscription",
        description: "Grace Uwimana subscription expired",
        date: "2024-01-18",
        status: "failed",
      },
      {
        id: "4",
        type: "commission",
        description: "Commission earned from John Doe subscription",
        amount: 15000,
        date: "2024-01-17",
        status: "completed",
      },
      {
        id: "5",
        type: "payment",
        description: "Subscription renewal pending for Alice Smith",
        amount: 60000,
        date: "2024-01-16",
        status: "pending",
      },
    ];

    setTimeout(() => {
      setStats(mockStats);
      setRecentActivity(mockActivity);
      setIsLoading(false);
    }, 1000);
  }, []);

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

  if (isLoading || !stats) {
    return (
      <div className="space-y-6 p-6">
        <div className="w-64 h-8 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="w-full h-32 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse" />
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
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Agent Dashboard
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Welcome back, {user.name}! Manage your producers and track commissions.
          </p>
        </div>
        <Button
          onClick={() => router.push("/agent/producers-management")}
          className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
        >
          <Users className="h-4 w-4 mr-2" />
          Manage Producers
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 border-blue-200 dark:border-blue-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-600 dark:text-blue-400 text-sm font-medium">
                    Total Producers
                  </p>
                  <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">
                    {stats.totalProducers}
                  </p>
                </div>
                <Users className="h-8 w-8 text-blue-600 dark:text-blue-400" />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 border-green-200 dark:border-green-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-600 dark:text-green-400 text-sm font-medium">
                    Active Subscriptions
                  </p>
                  <p className="text-2xl font-bold text-green-900 dark:text-green-100">
                    {stats.activeSubscriptions}
                  </p>
                </div>
                <CheckCircle2 className="h-8 w-8 text-green-600 dark:text-green-400" />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20 border-red-200 dark:border-red-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-red-600 dark:text-red-400 text-sm font-medium">
                    Expired Subscriptions
                  </p>
                  <p className="text-2xl font-bold text-red-900 dark:text-red-100">
                    {stats.expiredSubscriptions}
                  </p>
                </div>
                <AlertCircle className="h-8 w-8 text-red-600 dark:text-red-400" />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 border-purple-200 dark:border-purple-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-600 dark:text-purple-400 text-sm font-medium">
                    Total Commissions
                  </p>
                  <p className="text-2xl font-bold text-purple-900 dark:text-purple-100">
                    {stats.totalCommissions.toLocaleString()} RWF
                  </p>
                </div>
                <DollarSign className="h-8 w-8 text-purple-600 dark:text-purple-400" />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Card className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20 border-orange-200 dark:border-orange-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-orange-600 dark:text-orange-400 text-sm font-medium">
                    Monthly Commissions
                  </p>
                  <p className="text-2xl font-bold text-orange-900 dark:text-orange-100">
                    {stats.monthlyCommissions.toLocaleString()} RWF
                  </p>
                </div>
                <TrendingUp className="h-8 w-8 text-orange-600 dark:text-orange-400" />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <Card className="bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-900/20 dark:to-yellow-800/20 border-yellow-200 dark:border-yellow-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-yellow-600 dark:text-yellow-400 text-sm font-medium">
                    Pending Payments
                  </p>
                  <p className="text-2xl font-bold text-yellow-900 dark:text-yellow-100">
                    {stats.pendingPayments}
                  </p>
                </div>
                <Clock className="h-8 w-8 text-yellow-600 dark:text-yellow-400" />
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Quick Actions & Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ArrowUpRight className="h-5 w-5" />
              Quick Actions
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button
              onClick={() => router.push("/agent/producers-management")}
              className="w-full justify-start"
              variant="outline"
            >
              <Users className="h-4 w-4 mr-2" />
              View All Producers
            </Button>
            <Button
              onClick={() => router.push("/agent/subscription/renew")}
              className="w-full justify-start"
              variant="outline"
            >
              <CreditCard className="h-4 w-4 mr-2" />
              Process Subscription Payment
            </Button>
            <Button
              onClick={() => router.push("/agent/commissions")}
              className="w-full justify-start"
              variant="outline"
            >
              <DollarSign className="h-4 w-4 mr-2" />
              View Commission History
            </Button>
            <Button
              onClick={() => router.push("/agent/reports")}
              className="w-full justify-start"
              variant="outline"
            >
              <TrendingUp className="h-4 w-4 mr-2" />
              Generate Reports
            </Button>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivity.map((activity) => (
                <div key={activity.id} className="flex items-start gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50">
                  <div className="flex-shrink-0 mt-0.5">
                    {getActivityIcon(activity.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {activity.description}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {new Date(activity.date).toLocaleDateString()}
                      </span>
                      {activity.amount && (
                        <span className="text-xs font-medium text-green-600 dark:text-green-400">
                          {activity.amount.toLocaleString()} RWF
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex-shrink-0">
                    {getStatusIcon(activity.status)}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Alerts */}
      {stats.expiredSubscriptions > 0 && (
        <Card className="border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/10">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
              <div>
                <h3 className="font-medium text-red-900 dark:text-red-100">
                  Expired Subscriptions Alert
                </h3>
                <p className="text-sm text-red-700 dark:text-red-300">
                  You have {stats.expiredSubscriptions} producers with expired subscriptions. 
                  Contact them to renew their subscriptions and continue earning commissions.
                </p>
              </div>
              <Button
                onClick={() => router.push("/agent/producers-management?filter=expired")}
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
  );
}
