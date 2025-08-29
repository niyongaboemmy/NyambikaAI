"use client";

import React, { useState, useMemo, useCallback, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { useLoginPrompt } from "@/contexts/LoginPromptContext";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";
import {
  Search,
  X,
  RefreshCw,
  Package,
  DollarSign,
  Filter,
  ListFilter,
  Calendar as CalendarIcon,
  Clock,
  AlertCircle,
  Download,
  TrendingUp,
  BarChart3,
} from "lucide-react";

// UI Components
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

// Types
import type { ProducerOrder } from "@/types/order";

// Components
import { OrderCard } from "@/components/orders/order-card";
import { EmptyState } from "@/components/empty-state";
import { StatCard } from "@/components/stat-card";

// Utils
import { apiClient } from "@/config/api";
import { formatPrice } from "@/lib/format";

// Status configuration
const STATUS_CONFIG = {
  pending: {
    color:
      "bg-amber-100/80 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400 border border-amber-200 dark:border-amber-800/50",
    label: "Pending",
    icon: "⏳",
  },
  confirmed: {
    color:
      "bg-blue-100/80 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 border border-blue-200 dark:border-blue-800/50",
    label: "Confirmed",
    icon: "✓",
  },
  processing: {
    color:
      "bg-purple-100/80 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400 border border-purple-200 dark:border-purple-800/50",
    label: "Processing",
    icon: "⚙️",
  },
  shipped: {
    color:
      "bg-indigo-100/80 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800/50",
    label: "Shipped",
    icon: "🚚",
  },
  delivered: {
    color:
      "bg-emerald-100/80 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/50",
    label: "Delivered",
    icon: "✅",
  },
  cancelled: {
    color:
      "bg-red-100/80 text-red-800 dark:bg-red-900/30 dark:text-red-400 border border-red-200 dark:border-red-800/50",
    label: "Cancelled",
    icon: "❌",
  },
} as const;

// Skeleton Loader
const Skeletons = () => (
  <div className="space-y-4">
    {[...Array(5)].map((_, i) => (
      <Card key={i} className="animate-pulse">
        <CardHeader>
          <div className="flex justify-between items-start">
            <div className="space-y-2">
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-4 w-24" />
            </div>
            <Skeleton className="h-6 w-20" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </div>
        </CardContent>
      </Card>
    ))}
  </div>
);

// Error State
const ErrorCard = ({ error }: { error: unknown }) => (
  <Card className="border-destructive/20 bg-destructive/5">
    <CardHeader>
      <CardTitle className="text-destructive flex items-center gap-2">
        <AlertCircle className="h-5 w-5" />
        Error loading orders
      </CardTitle>
      <p className="text-destructive/80">
        {error instanceof Error ? error.message : "An unknown error occurred"}
      </p>
    </CardHeader>
  </Card>
);

// Status options for filtering
const statusOptions = [
  { value: "all", label: "All Orders" },
  { value: "pending", label: "Pending" },
  { value: "confirmed", label: "Confirmed" },
  { value: "processing", label: "Processing" },
  { value: "shipped", label: "Shipped" },
  { value: "delivered", label: "Delivered" },
  { value: "cancelled", label: "Cancelled" },
];

export default function ProducerOrders() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const { open: openLoginPrompt } = useLoginPrompt();
  const queryClient = useQueryClient();

  // State
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateRange, setDateRange] = useState<{
    from?: Date;
    to?: Date;
  }>({});
  const [sortConfig, setSortConfig] = useState<{
    key: keyof ProducerOrder;
    direction: "asc" | "desc";
  } | null>({ key: "createdAt", direction: "desc" });
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);

  // Handle authentication and authorization
  useEffect(() => {
    if (!authLoading && !user) {
      openLoginPrompt();
    }
  }, [authLoading, user, openLoginPrompt]);

  // Check if user has proper role
  const hasAccess = user && (user.role === "producer" || user.role === "admin");

  // Fetch orders
  const {
    data: orders = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["producer-orders", statusFilter, searchQuery, dateRange],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (statusFilter !== "all") params.append("status", statusFilter);
      if (searchQuery) params.append("search", searchQuery);
      if (dateRange.from) params.append("from", dateRange.from.toISOString());
      if (dateRange.to) params.append("to", dateRange.to.toISOString());

      const response = await apiClient.get(
        `/api/orders/producer/${user?.id}?${params}`
      );
      return response.data;
    },
    enabled: !!user && hasAccess,
    retry: (failureCount, error: any) => {
      // Don't retry on auth errors
      if (error?.response?.status === 401) {
        openLoginPrompt();
        return false;
      }
      return failureCount < 3;
    },
  });

  // Filter and sort orders
  const filteredOrders = useMemo(() => {
    let filtered = orders;

    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter(
        (order: ProducerOrder) =>
          order.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
          order.customerName
            .toLowerCase()
            .includes(searchQuery.toLowerCase()) ||
          order.customerEmail.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Apply date range filter
    if (dateRange.from || dateRange.to) {
      filtered = filtered.filter((order: ProducerOrder) => {
        const orderDate = new Date(order.createdAt);
        if (dateRange.from && orderDate < dateRange.from) return false;
        if (dateRange.to && orderDate > dateRange.to) return false;
        return true;
      });
    }

    return filtered;
  }, [orders, searchQuery, dateRange]);

  // Sort orders
  const sortedOrders = useMemo(() => {
    if (!sortConfig) return filteredOrders;

    return [...filteredOrders].sort((a, b) => {
      const aValue = a[sortConfig.key];
      const bValue = b[sortConfig.key];

      if (aValue < bValue) {
        return sortConfig.direction === "asc" ? -1 : 1;
      }
      if (aValue > bValue) {
        return sortConfig.direction === "asc" ? 1 : -1;
      }
      return 0;
    });
  }, [filteredOrders, sortConfig]);

  // Sort function
  const requestSort = useCallback((key: keyof ProducerOrder) => {
    setSortConfig((current) => {
      if (current?.key === key) {
        return {
          key,
          direction: current.direction === "asc" ? "desc" : "asc",
        };
      }
      return { key, direction: "desc" };
    });
  }, []);

  // Update order status mutation
  const updateOrderStatus = useMutation({
    mutationFn: async ({
      id,
      status,
    }: {
      id: string;
      status: ProducerOrder["status"];
    }) => {
      const response = await apiClient.put(`/api/orders/${id}`, { status });
      return response.data;
    },
    onMutate: async ({ id, status }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ["producer-orders"] });

      // Snapshot previous value
      const previousOrders = queryClient.getQueryData(["producer-orders"]);

      // Optimistically update
      queryClient.setQueryData(
        ["producer-orders"],
        (old: ProducerOrder[] = []) =>
          old.map((order) => (order.id === id ? { ...order, status } : order))
      );

      return { previousOrders };
    },
    onError: (err, _vars, context) => {
      // Rollback on error
      if (context?.previousOrders) {
        queryClient.setQueryData(["producer-orders"], context.previousOrders);
      }
      toast({
        title: "Error",
        description: "Failed to update order status. Please try again.",
        variant: "destructive",
      });
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Order status updated successfully.",
      });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["producer-orders"] });
    },
  });

  // Helper functions
  const toggleOrderExpand = useCallback((orderId: string) => {
    setExpandedOrder((current) => (current === orderId ? null : orderId));
  }, []);

  const clearFilters = useCallback(() => {
    setSearchQuery("");
    setStatusFilter("all");
    setDateRange({});
  }, []);

  const hasActiveFilters =
    statusFilter !== "all" || searchQuery || dateRange.from || dateRange.to;

  // Calculate stats
  const stats = useMemo(() => {
    const totalOrders = orders.length;
    const totalRevenue = orders.reduce(
      (sum: number, order: ProducerOrder) => sum + parseFloat(order.total),
      0
    );
    const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
    const totalItems = orders.reduce(
      (sum: number, order: ProducerOrder) => sum + order.items.length,
      0
    );

    return {
      totalOrders,
      totalRevenue,
      avgOrderValue,
      totalItems,
    };
  }, [orders]);

  // Loading state
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-800">
        <div className="container mx-auto px-4 py-8">
          <div className="space-y-6">
            <Skeleton className="h-12 w-80" />
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              {[...Array(4)].map((_, i) => (
                <Skeleton key={i} className="h-32 w-full" />
              ))}
            </div>
            <Skeletons />
          </div>
        </div>
      </div>
    );
  }

  // Access denied state
  if (!authLoading && (!user || !hasAccess)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="container mx-auto px-4">
          <Card className="max-w-md mx-auto bg-white/60 backdrop-blur-sm border-slate-200/50 dark:bg-slate-800/60 dark:border-slate-700/50">
            <CardHeader className="text-center">
              <div className="flex justify-center mb-4">
                <AlertCircle className="h-12 w-12 text-amber-500" />
              </div>
              <CardTitle className="text-xl">Access Restricted</CardTitle>
            </CardHeader>
            <CardContent className="text-center space-y-4">
              <p className="text-muted-foreground">
                This page is only accessible to producers and administrators.
              </p>
              {!user && (
                <Button onClick={openLoginPrompt} className="w-full">
                  Sign In to Continue
                </Button>
              )}
              {user && !hasAccess && (
                <Button
                  onClick={() => router.push("/")}
                  variant="outline"
                  className="w-full"
                >
                  Return to Home
                </Button>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen">
        <div className="container mx-auto px-4 py-8">
          <ErrorCard error={error} />
        </div>
      </div>
    );
  }

  return (
    <div className="relative overflow-hidden">
      <div className="px-2 sm:px-2 pt-12 relative z-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="flex flex-col space-y-4 sm:space-y-0 sm:flex-row sm:justify-between sm:items-center mb-4 sm:mb-6"
        >
          <div className="flex-1">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="flex items-center gap-2 sm:gap-3 mb-2"
            >
              <motion.div
                animate={{
                  rotate: [0, 5, -5, 0],
                  scale: [1, 1.05, 1],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  repeatType: "reverse",
                }}
                className="relative flex-shrink-0"
              >
                <Package className="h-5 w-5 sm:h-6 sm:w-6 md:h-7 md:w-7 text-blue-600" />
                <div className="absolute inset-0 bg-gradient-to-r from-pink-500/20 via-purple-500/20 to-cyan-500/20 rounded-lg blur-lg animate-pulse"></div>
              </motion.div>
              <h1 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold truncate">
                Order Management
              </h1>
            </motion.div>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="text-slate-600 dark:text-slate-400 text-xs sm:text-sm"
            >
              Welcome back, {user?.name || "Producer"}! 👋 Manage your orders
              with ease
            </motion.p>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.6 }}
              className="flex flex-wrap items-center gap-2 mt-2 text-xs sm:text-sm text-slate-500 dark:text-slate-400"
            >
              <div className="flex items-center gap-1">
                <Clock className="h-3 w-3 sm:h-4 sm:w-4" />
                <span className="hidden sm:inline">
                  Last updated: {new Date().toLocaleTimeString()}
                </span>
                <span className="sm:hidden">
                  {new Date().toLocaleTimeString()}
                </span>
              </div>
              <motion.span
                whileHover={{ scale: 1.05 }}
                className="px-2 py-1 bg-gradient-to-r from-blue-100 to-purple-100 dark:from-blue-900/30 dark:to-purple-900/30 text-blue-700 dark:text-blue-300 rounded-full text-xs font-medium shadow-sm"
              >
                {user?.role === "admin" ? "Admin" : "Producer"}
              </motion.span>
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.8 }}
            className="flex flex-wrap items-center gap-2 sm:gap-3 w-full sm:w-auto"
          >
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="flex-1 sm:flex-none"
            >
              <Button
                variant="outline"
                size="sm"
                className="w-full sm:w-auto bg-white/80 backdrop-blur-sm border-slate-200 hover:bg-white/90 dark:bg-slate-800/80 dark:border-slate-700 dark:hover:bg-slate-800/90 transition-all duration-200 text-xs sm:text-sm"
                onClick={() => refetch()}
                disabled={isLoading}
              >
                <RefreshCw
                  className={cn(
                    "h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2",
                    isLoading && "animate-spin"
                  )}
                />
                <span className="hidden sm:inline">
                  {isLoading ? "Refreshing..." : "Refresh"}
                </span>
                <span className="sm:hidden">↻</span>
              </Button>
            </motion.div>
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="flex-1 sm:flex-none"
            >
              <Button
                variant="outline"
                size="sm"
                className="w-full sm:w-auto bg-white/80 backdrop-blur-sm border-slate-200 hover:bg-white/90 dark:bg-slate-800/80 dark:border-slate-700 dark:hover:bg-slate-800/90 transition-all duration-200 text-xs sm:text-sm"
                onClick={() => {
                  toast({
                    title: "Export Started",
                    description:
                      "Your orders data is being prepared for download.",
                  });
                }}
              >
                <Download className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                <span className="hidden sm:inline">Export CSV</span>
                <span className="sm:hidden">↓</span>
              </Button>
            </motion.div>
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="w-full sm:w-auto"
            >
              <Button
                size="sm"
                className="w-full sm:w-auto bg-gradient-to-r from-violet-500 via-purple-500 to-blue-500 hover:from-pink-600 hover:via-purple-600 hover:to-blue-600 text-white shadow-lg transition-all duration-200 text-xs sm:text-sm"
                onClick={() => router.push("/product-registration")}
              >
                <Package className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                <span className="hidden sm:inline">Add Product</span>
                <span className="sm:hidden">+ Product</span>
              </Button>
            </motion.div>
          </motion.div>
        </motion.div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4 md:gap-6 mb-4 sm:mb-6">
        <StatCard
          title="Total Orders"
          value={stats.totalOrders.toLocaleString()}
          icon={Package}
          trend="+12% from last month"
          className="bg-white/60 backdrop-blur-sm border-slate-200/50 dark:bg-slate-800/60 dark:border-slate-700/50"
        />
        <StatCard
          title="Revenue"
          value={formatPrice(stats.totalRevenue)}
          icon={DollarSign}
          trend="+8.1% from last month"
          className="bg-white/60 backdrop-blur-sm border-slate-200/50 dark:bg-slate-800/60 dark:border-slate-700/50"
        />
        <StatCard
          title="Avg. Order Value"
          value={formatPrice(stats.avgOrderValue)}
          icon={TrendingUp}
          trend="+2.3% from last month"
          className="bg-white/60 backdrop-blur-sm border-slate-200/50 dark:bg-slate-800/60 dark:border-slate-700/50"
        />
        <StatCard
          title="Items Sold"
          value={stats.totalItems.toLocaleString()}
          icon={BarChart3}
          trend="+19% from last month"
          className="bg-white/60 backdrop-blur-sm border-slate-200/50 dark:bg-slate-800/60 dark:border-slate-700/50"
        />
      </div>

      {/* Filters */}
      <Card className="mb-4 sm:mb-6 bg-white/60 backdrop-blur-sm border-slate-200/50 dark:bg-slate-800/60 dark:border-slate-700/50">
        <CardHeader className="pb-2 sm:pb-4 px-3 sm:px-6">
          <div className="flex flex-col space-y-3 sm:space-y-4 gap-2 lg:space-y-0 lg:flex-row lg:justify-between lg:items-center">
            <div className="flex-1 w-full">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-3 w-3 sm:h-4 sm:w-4 -translate-y-1/2 text-slate-400" />
                <Input
                  placeholder="Search orders..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8 sm:pl-10 w-full text-sm bg-white/80 border-slate-200 dark:bg-slate-800/80 dark:border-slate-700"
                />
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3 w-full lg:w-auto">
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full sm:w-auto sm:min-w-[200px] justify-start text-left font-normal bg-white/80 border-slate-200 dark:bg-slate-800/80 dark:border-slate-700 text-xs sm:text-sm"
                  >
                    <CalendarIcon className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                    {dateRange?.from ? (
                      dateRange.to ? (
                        <>
                          <span className="hidden sm:inline">
                            {format(dateRange.from, "MMM d, y")} -{" "}
                            {format(dateRange.to, "MMM d, y")}
                          </span>
                          <span className="sm:hidden">
                            {format(dateRange.from, "MMM d")} -{" "}
                            {format(dateRange.to, "MMM d")}
                          </span>
                        </>
                      ) : (
                        <>
                          <span className="hidden sm:inline">
                            {format(dateRange.from, "MMM d, y")}
                          </span>
                          <span className="sm:hidden">
                            {format(dateRange.from, "MMM d")}
                          </span>
                        </>
                      )
                    ) : (
                      <>
                        <span className="hidden sm:inline">
                          Pick a date range
                        </span>
                        <span className="sm:hidden">Date range</span>
                      </>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="end">
                  <Calendar
                    initialFocus
                    mode="range"
                    defaultMonth={dateRange?.from}
                    selected={{
                      from: dateRange?.from,
                      to: dateRange?.to,
                    }}
                    onSelect={(range) => {
                      setDateRange({
                        from: range?.from,
                        to: range?.to,
                      });
                    }}
                    numberOfMonths={1}
                    className="sm:hidden"
                  />
                  <Calendar
                    initialFocus
                    mode="range"
                    defaultMonth={dateRange?.from}
                    selected={{
                      from: dateRange?.from,
                      to: dateRange?.to,
                    }}
                    onSelect={(range) => {
                      setDateRange({
                        from: range?.from,
                        to: range?.to,
                      });
                    }}
                    numberOfMonths={2}
                    className="hidden sm:block"
                  />
                </PopoverContent>
              </Popover>

              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-auto sm:min-w-[140px] bg-white/80 border-slate-200 dark:bg-slate-800/80 dark:border-slate-700 text-xs sm:text-sm">
                  <Filter className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2 opacity-50" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {statusOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {hasActiveFilters && (
                <Button
                  variant="ghost"
                  onClick={clearFilters}
                  className="w-full sm:w-auto h-8 sm:h-10 px-2 sm:px-3 text-xs sm:text-sm"
                >
                  <span className="hidden sm:inline">Clear</span>
                  <span className="sm:hidden">Clear All</span>
                  <X className="ml-1 sm:ml-2 h-3 w-3 sm:h-4 sm:w-4" />
                </Button>
              )}
            </div>
          </div>
        </CardHeader>

        {/* Status Tabs */}
        <div className="px-3 sm:px-6 pb-4 sm:pb-6">
          <Tabs
            value={statusFilter}
            onValueChange={setStatusFilter}
            className="w-full"
          >
            <TabsList className="w-full overflow-x-auto flex-nowrap justify-start bg-slate-100/80 dark:bg-slate-700/80 p-1">
              {statusOptions.map((option) => (
                <TabsTrigger
                  key={option.value}
                  value={option.value}
                  className="whitespace-nowrap data-[state=active]:bg-white dark:data-[state=active]:bg-slate-600 text-xs sm:text-sm px-2 sm:px-3 py-1 sm:py-2"
                >
                  <span className="hidden sm:inline">{option.label}</span>
                  <span className="sm:hidden">
                    {option.value === "all"
                      ? "All"
                      : option.value === "pending"
                      ? "Pending"
                      : option.value === "confirmed"
                      ? "Confirmed"
                      : option.value === "processing"
                      ? "Process"
                      : option.value === "shipped"
                      ? "Shipped"
                      : option.value === "delivered"
                      ? "Done"
                      : "Cancel"}
                  </span>
                  <Badge
                    variant="secondary"
                    className="ml-1 sm:ml-2 text-xs px-1 sm:px-2"
                  >
                    {option.value === "all"
                      ? orders.length
                      : orders.filter(
                          (o: ProducerOrder) => o.status === option.value
                        ).length}
                  </Badge>
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </div>
      </Card>

      {/* Order List */}
      <Card className="bg-white/60 backdrop-blur-sm border-slate-200/50 dark:bg-slate-800/60 dark:border-slate-700/50">
        <CardHeader className="border-b border-slate-200/50 dark:border-slate-700/50 px-3 sm:px-6 py-3 sm:py-4">
          <div className="flex flex-col space-y-3 sm:space-y-0 sm:flex-row sm:justify-between sm:items-center">
            <div>
              <CardTitle className="text-lg sm:text-xl">Orders</CardTitle>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
                {sortedOrders.length} order
                {sortedOrders.length !== 1 ? "s" : ""} found
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Select
                value={sortConfig?.key || ""}
                onValueChange={(value) =>
                  requestSort(value as keyof ProducerOrder)
                }
              >
                <SelectTrigger className="w-full sm:w-[180px] bg-white/80 border-slate-200 dark:bg-slate-800/80 dark:border-slate-700 text-xs sm:text-sm">
                  <ListFilter className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                  <SelectValue placeholder="Sort by..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="createdAt">
                    <span className="hidden sm:inline">
                      Date (Newest First)
                    </span>
                    <span className="sm:hidden">Date</span>
                  </SelectItem>
                  <SelectItem value="total">
                    <span className="hidden sm:inline">Total Amount</span>
                    <span className="sm:hidden">Amount</span>
                  </SelectItem>
                  <SelectItem value="status">Status</SelectItem>
                  <SelectItem value="customerName">
                    <span className="hidden sm:inline">Customer Name</span>
                    <span className="sm:hidden">Customer</span>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <AnimatePresence mode="wait">
            {isLoading ? (
              <div className="p-6">
                <Skeletons />
              </div>
            ) : sortedOrders.length === 0 ? (
              <div className="p-6">
                <EmptyState
                  title="No orders found"
                  description={
                    hasActiveFilters
                      ? "No orders match your current filters. Try adjusting your search criteria."
                      : "When you receive orders, they will appear here."
                  }
                  actionText={hasActiveFilters ? "Clear Filters" : "Refresh"}
                  onAction={hasActiveFilters ? clearFilters : () => refetch()}
                />
              </div>
            ) : (
              <ScrollArea className="h-[400px] sm:h-[600px]">
                <div className="divide-y divide-slate-200/50 dark:divide-slate-700/50">
                  {sortedOrders.map((order: ProducerOrder) => (
                    <motion.div
                      key={order.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ duration: 0.3 }}
                      className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors"
                    >
                      <div className="p-3 sm:p-6">
                        <OrderCard
                          order={order}
                          isExpanded={expandedOrder === order.id}
                          onToggleExpand={() => toggleOrderExpand(order.id)}
                          onStatusUpdate={(status) =>
                            updateOrderStatus.mutate({
                              id: order.id,
                              status: status as ProducerOrder["status"],
                            })
                          }
                          onViewDetails={() =>
                            router.push(`/orders/${order.id}`)
                          }
                        />
                      </div>
                    </motion.div>
                  ))}
                </div>
              </ScrollArea>
            )}
          </AnimatePresence>
        </CardContent>
      </Card>
    </div>
  );
}
