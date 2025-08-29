"use client";

import { useState, useEffect, useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

import {
  Users,
  Search,
  Filter,
  Building2,
  Mail,
  Phone,
  MapPin,
  DollarSign,
  TrendingUp,
  CheckCircle2,
  AlertCircle,
  Clock,
  Eye,
  UserPlus,
  Activity,
  Brain,
  Sparkles,
  Zap,
  CreditCard,
  ArrowRight,
} from "lucide-react";
import SubscriptionPlanSelector from "@/components/SubscriptionPlanSelector";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useToast } from "@/hooks/use-toast";
import { apiClient, API_ENDPOINTS } from "@/config/api";

interface Producer {
  id: string;
  username: string;
  email: string;
  fullName: string;
  businessName: string;
  phone: string;
  location: string;
  isVerified: boolean;
  createdAt: string;
  subscriptionId: string;
  subscriptionStatus: "active" | "expired" | "pending" | null;
  subscriptionEndDate: string;
  subscriptionStartDate: string;
  planName: string;
  planPrice: string;
  billingCycle: string;
  productsCount: number;
  commissionEarned: number;
  lastPayment: string | null;
  totalPaid: number;
  isAssignedToMe?: boolean;
  canAssign?: boolean;
  // Company information
  companyId?: string;
  companyName?: string;
  companyEmail?: string;
  companyPhone?: string;
  companyLocation?: string;
  companyTin?: string;
  companyLogoUrl?: string;
  companyWebsiteUrl?: string;
  companyCreatedAt?: string;
}

interface ProducerStats {
  totalProducers: number;
  activeSubscriptions: number;
  expiredSubscriptions: number;
  totalCommissions: number;
}

export default function ProducersManagement() {
  const { user } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [producers, setProducers] = useState<Producer[]>([]);
  const [filteredProducers, setFilteredProducers] = useState<Producer[]>([]);
  const [stats, setStats] = useState<ProducerStats | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [isLoading, setIsLoading] = useState(true);
  const [showAvailableProducers, setShowAvailableProducers] = useState(false);
  const [assignOpen, setAssignOpen] = useState(false);
  const [availableProducers, setAvailableProducers] = useState<Producer[]>([]);
  const [availableLoading, setAvailableLoading] = useState(false);
  const [availableSearch, setAvailableSearch] = useState("");
  // Subscription payment modal state
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [plans, setPlans] = useState<any[]>([]);
  const [plansLoading, setPlansLoading] = useState(false);
  const [selectedProducer, setSelectedProducer] = useState<Producer | null>(
    null
  );
  const [selectedPlanId, setSelectedPlanId] = useState<string>("");
  const [billingCycle, setBillingCycle] = useState<"monthly" | "annual">(
    "monthly"
  );
  const [paymentMethod, setPaymentMethod] =
    useState<string>("mtn_mobile_money");
  const [paymentReference, setPaymentReference] = useState<string>("");

  // Assignment with subscription state
  const [assignmentOpen, setAssignmentOpen] = useState(false);
  const [assignmentLoading, setAssignmentLoading] = useState(false);
  const [selectedProducerForAssignment, setSelectedProducerForAssignment] =
    useState<Producer | null>(null);
  const [assignmentPlanId, setAssignmentPlanId] = useState<string>("");
  const [assignmentBillingCycle, setAssignmentBillingCycle] = useState<
    "monthly" | "annual"
  >("monthly");

  // Fetch agent stats
  const fetchStats = async () => {
    try {
      const response = await apiClient.get(API_ENDPOINTS.AGENT_STATS);
      setStats(response.data);
    } catch (error) {
      console.error("Error fetching agent stats:", error);
      toast({
        title: "Error",
        description: "Failed to fetch statistics",
        variant: "destructive",
      });
    }
  };

  // Fetch active subscription plans for modal
  const fetchPlans = async () => {
    try {
      setPlansLoading(true);
      const res = await apiClient.get("/api/subscription-plans");
      setPlans(res.data || []);
      if (res.data && res.data.length > 0) {
        setSelectedPlanId(res.data[0].id);
      }
    } catch (err) {
      console.error("Error fetching plans:", err);
      toast({
        title: "Error",
        description: "Failed to fetch subscription plans",
        variant: "destructive",
      });
    } finally {
      setPlansLoading(false);
    }
  };

  const openPaymentModal = async (producer: Producer) => {
    setSelectedProducer(producer);
    setPaymentOpen(true);
    await fetchPlans();
  };

  const handleProcessPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProducer || !selectedPlanId) return;
    try {
      setPaymentLoading(true);
      await apiClient.post(API_ENDPOINTS.AGENT_PROCESS_PAYMENT, {
        producerId: selectedProducer.id,
        planId: selectedPlanId,
        billingCycle,
        paymentMethod,
        paymentReference,
      });
      toast({
        title: "Success",
        description: "Subscription payment processed",
      });
      setPaymentOpen(false);
      setSelectedProducer(null);
      setPaymentReference("");
      await Promise.all([fetchProducers(), fetchStats()]);
    } catch (err: any) {
      console.error("Payment error:", err);
      toast({
        title: "Payment Failed",
        description:
          err?.response?.data?.message ||
          err?.message ||
          "Could not process payment",
        variant: "destructive",
      });
    } finally {
      setPaymentLoading(false);
    }
  };

  // Fetch producers managed by agent
  const fetchProducers = async () => {
    try {
      const response = await apiClient.get(API_ENDPOINTS.AGENT_PRODUCERS);
      // Normalize: ensure company fields exist; fallback to businessName/location/email when missing
      const normalized: Producer[] = (response.data || []).map((p: any) => {
        const end = p.subscriptionEndDate
          ? new Date(p.subscriptionEndDate)
          : null;
        const now = new Date();
        const derivedStatus =
          p.subscriptionStatus === "active" && end && end < now
            ? "expired"
            : p.subscriptionStatus;
        return {
          ...p,
          subscriptionStatus: derivedStatus,
          companyName: p.companyName ?? p.businessName ?? p.fullName,
          companyLocation: p.companyLocation ?? p.location,
          companyEmail: p.companyEmail ?? p.email,
        } as Producer;
      });
      setProducers(normalized);
      setFilteredProducers(normalized);
    } catch (error) {
      console.error("Error fetching producers:", error);
      toast({
        title: "Error",
        description: "Failed to fetch producers",
        variant: "destructive",
      });
    }
  };

  // Fetch available producers for assignment
  const fetchAvailableProducers = async () => {
    try {
      const response = await apiClient.get(
        API_ENDPOINTS.AGENT_AVAILABLE_PRODUCERS
      );
      // Normalize and keep a separate list for modal; avoid overriding main table
      const normalized: Producer[] = (response.data || []).map((p: any) => {
        const end = p.subscriptionEndDate
          ? new Date(p.subscriptionEndDate)
          : null;
        const now = new Date();
        const derivedStatus =
          p.subscriptionStatus === "active" && end && end < now
            ? "expired"
            : p.subscriptionStatus;
        return {
          ...p,
          subscriptionStatus: derivedStatus,
          companyName: p.companyName ?? p.businessName ?? p.fullName,
          companyLocation: p.companyLocation ?? p.location,
          companyEmail: p.companyEmail ?? p.email,
        } as Producer;
      });
      setAvailableProducers(normalized);
    } catch (error) {
      console.error("Error fetching available producers:", error);
      toast({
        title: "Error",
        description: "Failed to fetch available producers",
        variant: "destructive",
      });
    }
  };

  // Open assignment modal
  const openAssignmentModal = (producer: Producer) => {
    setSelectedProducerForAssignment(producer);
    setAssignmentPlanId("");
    setAssignmentBillingCycle("monthly");
    setAssignmentOpen(true);
  };

  // Handle assignment with subscription
  const handleAssignmentWithSubscription = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProducerForAssignment || !assignmentPlanId) return;

    try {
      setAssignmentLoading(true);

      // Call assignment API with subscription plan
      await apiClient.post(API_ENDPOINTS.AGENT_ASSIGN_PRODUCER, {
        producerId: selectedProducerForAssignment.id,
        subscriptionPlanId: assignmentPlanId,
        billingCycle: assignmentBillingCycle,
      });

      toast({
        title: "Success",
        description: "Producer assigned with subscription successfully",
      });

      // Close modal and refresh data
      setAssignmentOpen(false);
      if (showAvailableProducers) {
        fetchAvailableProducers();
      } else {
        fetchProducers();
      }
      fetchStats();
    } catch (error: any) {
      console.error("Error assigning producer:", error);
      toast({
        title: "Assignment Failed",
        description:
          error?.response?.data?.message || "Failed to assign producer",
        variant: "destructive",
      });
    } finally {
      setAssignmentLoading(false);
    }
  };

  // Handle plan selection for assignment
  const handleAssignmentPlanSelect = (
    planId: string,
    billingCycle: "monthly" | "annual"
  ) => {
    setAssignmentPlanId(planId);
    setAssignmentBillingCycle(billingCycle);
  };

  // Legacy assign producer (for producers with active subscriptions)
  const assignProducer = async (producerId: string) => {
    try {
      await apiClient.post(API_ENDPOINTS.AGENT_ASSIGN_PRODUCER, { producerId });
      toast({
        title: "Success",
        description: "Producer assigned successfully",
      });
      // Refresh data
      if (showAvailableProducers) {
        fetchAvailableProducers();
      } else {
        fetchProducers();
      }
      fetchStats();
    } catch (error: any) {
      console.error("Error assigning producer:", error);

      // If error is about subscription, open assignment modal
      if (error?.response?.data?.message?.includes("active subscription")) {
        const producer = availableProducers.find((p) => p.id === producerId);
        if (producer) {
          openAssignmentModal(producer);
          return;
        }
      }

      toast({
        title: "Error",
        description:
          error?.response?.data?.message || "Failed to assign producer",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      await Promise.all([fetchStats(), fetchProducers()]);
      setIsLoading(false);
    };

    loadData();
  }, []);

  // Derived filtered list for modal
  const filteredAvailable = useMemo(() => {
    if (!availableSearch) return availableProducers;
    const q = availableSearch.toLowerCase();
    return availableProducers.filter(
      (p) =>
        (p.fullName || "").toLowerCase().includes(q) ||
        (p.businessName || "").toLowerCase().includes(q) ||
        (p.email || "").toLowerCase().includes(q)
    );
  }, [availableProducers, availableSearch]);

  useEffect(() => {
    let filtered = producers;

    // Filter by search term (include company fields)
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (producer) =>
          (producer.companyName || "").toLowerCase().includes(q) ||
          (producer.fullName || "").toLowerCase().includes(q) ||
          (producer.businessName || "").toLowerCase().includes(q) ||
          (producer.companyEmail || producer.email || "")
            .toLowerCase()
            .includes(q)
      );
    }

    // Filter by status
    if (statusFilter !== "all") {
      filtered = filtered.filter(
        (producer) => producer.subscriptionStatus === statusFilter
      );
    }

    setFilteredProducers(filtered);
  }, [searchTerm, statusFilter, producers]);

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
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {Array.from({ length: 4 }).map((_, index) => (
            <div
              key={index}
              className="w-full h-32 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse"
            />
          ))}
        </div>
        <div className="w-full h-96 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse" />
      </div>
    );
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return (
          <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
            Active
          </Badge>
        );
      case "expired":
        return (
          <Badge className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
            Expired
          </Badge>
        );
      case "pending":
        return (
          <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
            Pending
          </Badge>
        );
      default:
        return <Badge variant="secondary">Unknown</Badge>;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "active":
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case "expired":
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      case "pending":
        return <Clock className="h-4 w-4 text-yellow-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  return (
    <div className="min-h-screen pt-6">
      {/* Holographic Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <motion.div
          className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-400/20 to-purple-600/20 rounded-full blur-3xl"
          animate={{ scale: [1, 1.2, 1], rotate: [0, 180, 360] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-tr from-purple-400/20 to-pink-600/20 rounded-full blur-3xl"
          animate={{ scale: [1.2, 1, 1.2], rotate: [360, 180, 0] }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-r from-cyan-400/10 to-blue-600/10 rounded-full blur-3xl"
          animate={{ scale: [1, 1.1, 1], opacity: [0.3, 0.6, 0.3] }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
        />

        {/* Neural Network Grid Pattern */}
        <div className="absolute inset-0 opacity-10 dark:opacity-5">
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: `
              linear-gradient(90deg, rgba(59, 130, 246, 0.3) 1px, transparent 1px),
              linear-gradient(rgba(59, 130, 246, 0.3) 1px, transparent 1px),
              radial-gradient(circle at 25% 25%, rgba(168, 85, 247, 0.4) 2px, transparent 2px),
              radial-gradient(circle at 75% 75%, rgba(236, 72, 153, 0.4) 2px, transparent 2px)
            `,
              backgroundSize: "50px 50px, 50px 50px, 100px 100px, 100px 100px",
            }}
          />
        </div>

        {/* Floating AI Particles */}
        {[...Array(6)].map((_, i) => (
          <motion.div
            key={i}
            className={`absolute w-2 h-2 rounded-full ${
              i % 3 === 0
                ? "bg-blue-400/40"
                : i % 3 === 1
                ? "bg-purple-400/40"
                : "bg-pink-400/40"
            }`}
            style={{
              left: `${20 + i * 15}%`,
              top: `${30 + i * 10}%`,
            }}
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

      <div className="relative space-y-6 px-2 sm:px-3 lg:px-0 py-6">
        {/* Enhanced AI-Themed Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
        >
          <div className="space-y-2 md:pl-3">
            <div className="flex items-center gap-6">
              <motion.div
                className="relative"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
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
                <h1 className="text-2xl sm:text-2xl font-bold ">
                  Producers Hub
                </h1>
                <p className="text-gray-600 dark:text-gray-400 flex items-center gap-2 text-sm">
                  <Zap className="w-4 h-4 text-blue-500" />
                  Intelligent producer portfolio management
                </p>
              </div>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Button
                onClick={async () => {
                  setAssignOpen(true);
                  setAvailableLoading(true);
                  await fetchAvailableProducers();
                  setAvailableLoading(false);
                }}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white hover:shadow-xl transition-all duration-300 group rounded-full"
                size="lg"
              >
                <UserPlus className="h-4 w-4 mr-2 group-hover:scale-110 transition-transform" />
                Assign Producers
                <ArrowRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>
            </motion.div>
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Button
                onClick={() => router.push("/agent-dashboard")}
                variant="outline"
                size="lg"
                className="border-2 hover:bg-white/50 dark:hover:bg-gray-800/50 backdrop-blur-sm rounded-full"
              >
                Back to Dashboard
              </Button>
            </motion.div>
          </div>
        </motion.div>

        {/* Enhanced Stats Cards */}
        <motion.div
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <motion.div whileHover={{ scale: 1.02, y: -2 }} className="group">
            <Card className="bg-gradient-to-br from-blue-50/80 to-blue-100/80 dark:from-blue-900/30 dark:to-blue-800/30 border-blue-200/50 dark:border-blue-700/50 backdrop-blur-xl hover:shadow-xl transition-all duration-300">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-blue-600 dark:text-blue-400 text-sm font-medium flex items-center gap-2">
                      <TrendingUp className="w-4 h-4" />
                      Total Managed Producers
                    </p>
                    <motion.p
                      className="text-3xl font-bold text-blue-900 dark:text-blue-100"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.3, type: "spring" }}
                    >
                      {stats?.totalProducers || 0}
                    </motion.p>
                  </div>
                  <div>
                    <motion.div
                      className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center group-hover:shadow-blue-500/25 transition-all duration-300"
                      whileHover={{ rotate: 5 }}
                    >
                      <Users className="h-6 w-6 text-white" />
                    </motion.div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div whileHover={{ scale: 1.02, y: -2 }} className="group">
            <Card className="bg-gradient-to-br from-green-50/80 to-green-100/80 dark:from-green-900/30 dark:to-green-800/30 border-green-200/50 dark:border-green-700/50 backdrop-blur-xl hover:shadow-xl transition-all duration-300">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-green-600 dark:text-green-400 text-sm font-medium flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4" />
                      Active Subscriptions
                    </p>
                    <motion.p
                      className="text-3xl font-bold text-green-900 dark:text-green-100"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.4, type: "spring" }}
                    >
                      {stats?.activeSubscriptions || 0}
                    </motion.p>
                  </div>
                  <div>
                    <motion.div
                      className="w-12 h-12 rounded-2xl bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center group-hover:shadow-green-500/25 transition-all duration-300"
                      whileHover={{ rotate: 5 }}
                    >
                      <CheckCircle2 className="h-6 w-6 text-white" />
                    </motion.div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div whileHover={{ scale: 1.02, y: -2 }} className="group">
            <Card className="bg-gradient-to-br from-red-50/80 to-red-100/80 dark:from-red-900/30 dark:to-red-800/30 border-red-200/50 dark:border-red-700/50 backdrop-blur-xl hover:shadow-xl transition-all duration-300">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-red-600 dark:text-red-400 text-sm font-medium flex items-center gap-2">
                      <AlertCircle className="w-4 h-4" />
                      Expired Subscriptions
                    </p>
                    <motion.p
                      className="text-3xl font-bold text-red-900 dark:text-red-100"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.5, type: "spring" }}
                    >
                      {stats?.expiredSubscriptions || 0}
                    </motion.p>
                  </div>
                  <div>
                    <motion.div
                      className="w-12 h-12 rounded-2xl bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center group-hover:shadow-red-500/25 transition-all duration-300"
                      whileHover={{ rotate: 5 }}
                    >
                      <AlertCircle className="h-6 w-6 text-white" />
                    </motion.div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div whileHover={{ scale: 1.02, y: -2 }} className="group">
            <Card className="bg-gradient-to-br from-purple-50/80 to-purple-100/80 dark:from-purple-900/30 dark:to-purple-800/30 border-purple-200/50 dark:border-purple-700/50 backdrop-blur-xl hover:shadow-xl transition-all duration-300">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-purple-600 dark:text-purple-400 text-sm font-medium flex items-center gap-2">
                      <DollarSign className="w-4 h-4" />
                      Total Commissions
                    </p>
                    <motion.p
                      className="text-2xl sm:text-2xl font-bold text-purple-900 dark:text-purple-100"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.6, type: "spring" }}
                    >
                      RWF {stats?.totalCommissions?.toLocaleString() || "0"}
                    </motion.p>
                  </div>
                  <div>
                    <motion.div
                      className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center group-hover:shadow-purple-500/25 transition-all duration-300"
                      whileHover={{ rotate: 5 }}
                    >
                      <DollarSign className="h-6 w-6 text-white" />
                    </motion.div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>

        {/* Enhanced Search and Filter Section */}
        <motion.div
          className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
        >
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search producers by name, company, or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-white/70 dark:bg-gray-900/70 backdrop-blur-xl border-gray-200/50 dark:border-gray-700/50 focus:ring-2 focus:ring-blue-500/20 transition-all"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button
                variant={statusFilter === "all" ? "default" : "outline"}
                onClick={() => setStatusFilter("all")}
                size="sm"
                className={
                  statusFilter === "all"
                    ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white"
                    : "bg-white/70 dark:bg-gray-900/70 backdrop-blur-xl"
                }
              >
                <Filter className="w-4 h-4" />
                All
              </Button>
            </motion.div>
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button
                variant={statusFilter === "active" ? "default" : "outline"}
                onClick={() => setStatusFilter("active")}
                size="sm"
                className={
                  statusFilter === "active"
                    ? "bg-gradient-to-r from-green-600 to-green-700 text-white"
                    : "bg-white/70 dark:bg-gray-900/70 backdrop-blur-xl"
                }
              >
                <CheckCircle2 className="w-4 h-4" />
                Active
              </Button>
            </motion.div>
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button
                variant={statusFilter === "expired" ? "default" : "outline"}
                onClick={() => setStatusFilter("expired")}
                size="sm"
                className={
                  statusFilter === "expired"
                    ? "bg-gradient-to-r from-red-600 to-red-700 text-white"
                    : "bg-white/70 dark:bg-gray-900/70 backdrop-blur-xl"
                }
              >
                <AlertCircle className="w-4 h-4" />
                Expired
              </Button>
            </motion.div>
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button
                variant={statusFilter === "pending" ? "default" : "outline"}
                onClick={() => setStatusFilter("pending")}
                size="sm"
                className={
                  statusFilter === "pending"
                    ? "bg-gradient-to-r from-yellow-600 to-yellow-700 text-white"
                    : "bg-white/70 dark:bg-gray-900/70 backdrop-blur-xl"
                }
              >
                <Clock className="w-4 h-4" />
                Pending
              </Button>
            </motion.div>
          </div>
        </motion.div>

        {/* Enhanced Producers Table */}
        <motion.div
          className="space-y-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
        >
          <Card className="bg-white/70 dark:bg-gray-900/70 backdrop-blur-xl border-gray-200/50 dark:border-gray-700/50">
            <CardHeader className="pb-4">
              <CardTitle className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent flex items-center gap-2">
                <Activity className="w-6 h-6 text-blue-500" />
                Producer Portfolio
              </CardTitle>
            </CardHeader>
            <CardContent>
              {filteredProducers.length === 0 ? (
                <div className="text-center py-10">
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex flex-col items-center gap-4"
                  >
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700 flex items-center justify-center">
                      <Users className="w-8 h-8 text-gray-400" />
                    </div>
                    <div className="space-y-2">
                      <p className="text-lg font-medium text-gray-600 dark:text-gray-400">
                        No producers found
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-500">
                        {searchTerm || statusFilter !== "all"
                          ? "Try adjusting your search or filters"
                          : "Start by assigning producers to your portfolio"}
                      </p>
                    </div>
                  </motion.div>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4">
                  {filteredProducers.map((p, index) => (
                    <motion.div
                      key={p.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="rounded-xl border border-gray-200/60 dark:border-gray-700/60 bg-white/80 dark:bg-gray-900/70 backdrop-blur-xl p-3 sm:p-4"
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 text-white flex items-center justify-center text-sm font-semibold overflow-hidden">
                          {p.companyLogoUrl ? (
                            <img
                              src={p.companyLogoUrl}
                              alt={p.companyName}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <span>
                              {(p.companyName || p.businessName)
                                ?.split(" ")
                                .map((n: string) => n[0])
                                .join("") || "C"}
                            </span>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <div className="min-w-0">
                              <p className="font-semibold text-gray-900 dark:text-white truncate">
                                {p.companyName || p.businessName}
                              </p>
                              <p className="text-xs text-gray-500 dark:text-gray-400 truncate flex items-center gap-1 mt-0.5">
                                <Building2 className="h-3 w-3" />{" "}
                                {p.fullName || p.username}
                              </p>
                            </div>
                            <div className="shrink-0">
                              {p.subscriptionStatus ? (
                                getStatusBadge(p.subscriptionStatus)
                              ) : (
                                <Badge variant="secondary">Unknown</Badge>
                              )}
                            </div>
                          </div>
                          <div className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1 text-xs text-gray-600 dark:text-gray-300">
                            <div className="flex items-center gap-1 truncate">
                              <Mail className="h-3 w-3 text-gray-400" />
                              <span className="truncate">
                                {p.companyEmail || p.email}
                              </span>
                            </div>
                            <div className="flex items-center gap-1 truncate">
                              <Phone className="h-3 w-3 text-gray-400" />
                              <span className="truncate">
                                {p.companyPhone || p.phone || "N/A"}
                              </span>
                            </div>
                            <div className="flex items-center gap-1 truncate col-span-2">
                              <MapPin className="h-3 w-3 text-gray-400" />
                              <span className="truncate">
                                {p.companyLocation || p.location || "N/A"}
                              </span>
                            </div>
                          </div>
                          <div className="mt-3 flex items-center justify-between">
                            <div className="flex items-center gap-3 text-xs">
                              <div className="text-center">
                                <span className="font-semibold text-blue-600 dark:text-blue-400">
                                  {p.productsCount}
                                </span>
                                <span className="ml-1 text-gray-500 dark:text-gray-400">
                                  products
                                </span>
                              </div>
                              <div className="text-center">
                                <span className="font-semibold text-green-600 dark:text-green-400">
                                  {p.commissionEarned.toLocaleString()}
                                </span>
                                <span className="ml-1 text-gray-500 dark:text-gray-400">
                                  RWF
                                </span>
                              </div>
                            </div>
                            <div className="text-[10px] text-gray-500 dark:text-gray-400">
                              Expires:{" "}
                              {p.subscriptionEndDate
                                ? new Date(
                                    p.subscriptionEndDate
                                  ).toLocaleDateString()
                                : "N/A"}
                            </div>
                          </div>
                          <div className="mt-3 grid grid-cols-2 gap-2">
                            {showAvailableProducers ? (
                              <>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() =>
                                    router.push(`/store/${p.companyId}`)
                                  }
                                >
                                  <Eye className="h-4 w-4 mr-1" /> Store
                                </Button>
                                {p.canAssign && !p.isAssignedToMe ? (
                                  <Button
                                    size="sm"
                                    onClick={() => assignProducer(p.id)}
                                    className="bg-blue-600 hover:bg-blue-700 text-white"
                                  >
                                    <UserPlus className="h-4 w-4 mr-1" /> Assign
                                  </Button>
                                ) : p.isAssignedToMe ? (
                                  <Badge
                                    variant="secondary"
                                    className="col-span-2 justify-center py-1"
                                  >
                                    Assigned to me
                                  </Badge>
                                ) : null}
                              </>
                            ) : (
                              <>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() =>
                                    router.push(`/store/${p.companyId}`)
                                  }
                                >
                                  <Eye className="h-4 w-4 mr-1" /> Store
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => openPaymentModal(p)}
                                >
                                  <CreditCard className="h-4 w-4 mr-1" />
                                  {p.subscriptionStatus === "expired"
                                    ? "Renew"
                                    : p.subscriptionStatus
                                    ? "Pay"
                                    : "Create Subscription"}
                                </Button>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Assign Producers Modal */}
        <Dialog open={assignOpen} onOpenChange={setAssignOpen}>
          <DialogContent className="max-w-3xl bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl border-gray-200/50 dark:border-gray-700/50">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <motion.div
                  className="h-8 w-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-sm font-bold"
                  animate={{ rotate: [0, 360] }}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                >
                  <Brain className="w-4 h-4" />
                </motion.div>
                <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  AI Producer Assignment
                </span>
              </DialogTitle>
              <DialogDescription>
                Browse available producers and assign them to your portfolio.
                Assigned producers will appear in your management list.
              </DialogDescription>
            </DialogHeader>
            <div className="mt-4 space-y-4">
              <div className="relative px-1">
                <Input
                  value={availableSearch}
                  onChange={(e) => setAvailableSearch(e.target.value)}
                  placeholder="Search by name, company, or email"
                  className="pl-4 py-2 text-sm bg-white/70 dark:bg-gray-900/70 backdrop-blur-xl border-gray-200/50 dark:border-gray-700/50 rounded-md"
                />
              </div>

              <div className="">
                {availableLoading ? (
                  <div className="h-40 flex items-center justify-center">
                    <motion.div
                      className="h-6 w-6 rounded-full border-2 border-blue-500 border-t-transparent"
                      animate={{ rotate: 360 }}
                      transition={{
                        duration: 1,
                        repeat: Infinity,
                        ease: "linear",
                      }}
                    />
                  </div>
                ) : filteredAvailable.length === 0 ? (
                  <div className="text-center py-10">
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="flex flex-col items-center gap-4"
                    >
                      <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700 flex items-center justify-center">
                        <Users className="w-8 h-8 text-gray-400" />
                      </div>
                      <p className="text-gray-600 dark:text-gray-400">
                        No available producers found.
                      </p>
                    </motion.div>
                  </div>
                ) : (
                  <div className="max-h-[60vh] overflow-y-auto pr-1">
                    <div className="grid grid-cols-1 gap-3">
                      {filteredAvailable.map((p, index) => (
                        <motion.div
                          key={p.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.05 }}
                          className="flex items-start gap-3 rounded-lg border border-border/50 p-3 sm:p-4 bg-gradient-to-br from-gray-50/60 to-white/60 dark:from-gray-800/40 dark:to-gray-900/40 hover:shadow-md transition-all duration-200"
                        >
                          <motion.div
                            className="shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 text-white flex items-center justify-center text-sm font-semibold"
                            whileHover={{ scale: 1.1 }}
                          >
                            {p.companyLogoUrl ? (
                              <img
                                src={p.companyLogoUrl}
                                alt={p.companyName}
                                className="w-full h-full rounded-full object-cover"
                              />
                            ) : (
                              <span>
                                {(p.companyName || p.businessName)
                                  ?.split(" ")
                                  .map((n: string) => n[0])
                                  .join("") || "C"}
                              </span>
                            )}
                          </motion.div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2">
                              <div className="truncate">
                                <p className="font-semibold truncate text-gray-900 dark:text-white">
                                  {p.companyName || p.businessName}
                                </p>
                                <p className="text-xs text-gray-500 dark:text-gray-400 truncate flex items-center gap-1">
                                  <Building2 className="h-3 w-3" />
                                  Owner: {p.fullName || p.username}
                                </p>
                              </div>
                              <div className="hidden sm:block">
                                {p.subscriptionStatus ? (
                                  getStatusBadge(p.subscriptionStatus)
                                ) : (
                                  <Badge variant="secondary">Unknown</Badge>
                                )}
                              </div>
                            </div>
                            <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                              <span className="inline-flex items-center gap-1">
                                <Mail className="h-3 w-3" />{" "}
                                {p.companyEmail || p.email}
                              </span>
                              <span className="inline-flex items-center gap-1">
                                <Phone className="h-3 w-3" />{" "}
                                {p.companyPhone || p.phone || "—"}
                              </span>
                              <span className="inline-flex items-center gap-1">
                                <MapPin className="h-3 w-3" />{" "}
                                {p.companyLocation || p.location || "—"}
                              </span>
                              {p.companyTin && (
                                <span className="inline-flex items-center gap-1">
                                  <Building2 className="h-3 w-3" /> TIN:{" "}
                                  {p.companyTin}
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="flex flex-col gap-2 items-end">
                            {p.isAssignedToMe ? (
                              <Badge variant="secondary">Assigned</Badge>
                            ) : p.canAssign ? (
                              <motion.div
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                              >
                                <Button
                                  size="sm"
                                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
                                  onClick={async () => {
                                    await assignProducer(p.id);
                                    setAvailableLoading(true);
                                    await fetchAvailableProducers();
                                    await fetchProducers();
                                    setAvailableLoading(false);
                                  }}
                                >
                                  <UserPlus className="h-4 w-4 mr-1" /> Assign
                                </Button>
                              </motion.div>
                            ) : (
                              <Badge variant="outline">
                                Assigned to another agent
                              </Badge>
                            )}
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Assignment with Subscription Modal */}
        <Dialog open={assignmentOpen} onOpenChange={setAssignmentOpen}>
          <DialogContent className="max-w-4xl bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl border-gray-200/50 dark:border-gray-700/50">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-blue-600" />
                Assign Producer with Subscription
              </DialogTitle>
              <DialogDescription>
                {selectedProducerForAssignment?.companyName ||
                  selectedProducerForAssignment?.businessName}{" "}
                needs an active subscription to be assigned.
              </DialogDescription>
            </DialogHeader>

            <form
              onSubmit={handleAssignmentWithSubscription}
              className="space-y-6"
            >
              <div className="space-y-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-purple-600" />
                  Choose Subscription Plan
                </h3>

                <SubscriptionPlanSelector
                  onPlanSelect={handleAssignmentPlanSelect}
                  selectedPlanId={assignmentPlanId}
                  selectedBillingCycle={assignmentBillingCycle}
                  loading={assignmentLoading}
                  className=""
                />
              </div>

              <div className="flex items-center justify-between pt-4 border-t">
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  The producer will be assigned to you and their subscription
                  will be activated.
                </div>
                <div className="flex items-center gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setAssignmentOpen(false)}
                    disabled={assignmentLoading}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={assignmentLoading || !assignmentPlanId}
                    className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
                  >
                    {assignmentLoading ? (
                      <>
                        <Clock className="w-4 h-4 mr-2 animate-spin" />
                        Assigning...
                      </>
                    ) : (
                      <>
                        <UserPlus className="w-4 h-4 mr-2" />
                        Assign Producer
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* Process Subscription Payment Modal */}
        <Dialog open={paymentOpen} onOpenChange={setPaymentOpen}>
          <DialogContent className="max-w-lg bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl border-gray-200/50 dark:border-gray-700/50">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-blue-600" />
                {selectedProducer?.subscriptionStatus === "expired"
                  ? "Renew Subscription"
                  : selectedProducer?.subscriptionStatus
                  ? "Process Payment"
                  : "Create Subscription"}
              </DialogTitle>
              <DialogDescription>
                {selectedProducer?.companyName ||
                  selectedProducer?.businessName}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleProcessPayment} className="space-y-4">
              <div className="space-y-1">
                <label className="text-sm font-medium">Plan</label>
                <select
                  className="w-full rounded-md border bg-background p-2"
                  value={selectedPlanId}
                  onChange={(e) => setSelectedPlanId(e.target.value)}
                  disabled={plansLoading}
                  required
                >
                  {plansLoading && <option>Loading plans...</option>}
                  {!plansLoading && plans.length === 0 && (
                    <option>No active plans</option>
                  )}
                  {!plansLoading &&
                    plans.map((pl: any) => (
                      <option key={pl.id} value={pl.id}>
                        {pl.name} — Monthly: RWF{" "}
                        {Number(pl.monthlyPrice).toLocaleString()} | Annual: RWF{" "}
                        {Number(pl.annualPrice).toLocaleString()}
                      </option>
                    ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium">Billing cycle</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    className={`border rounded-md p-2 text-sm ${
                      billingCycle === "monthly"
                        ? "border-blue-500 text-blue-600"
                        : ""
                    }`}
                    onClick={() => setBillingCycle("monthly")}
                  >
                    Monthly
                  </button>
                  <button
                    type="button"
                    className={`border rounded-md p-2 text-sm ${
                      billingCycle === "annual"
                        ? "border-blue-500 text-blue-600"
                        : ""
                    }`}
                    onClick={() => setBillingCycle("annual")}
                  >
                    Annual
                  </button>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium">Payment method</label>
                <select
                  className="w-full rounded-md border bg-background p-2"
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  required
                >
                  <option value="mtn_mobile_money">MTN Mobile Money</option>
                  <option value="airtel_money">Airtel Money</option>
                  <option value="bank_transfer">Bank Transfer</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium">Payment reference</label>
                <input
                  type="text"
                  className="w-full rounded-md border bg-background p-2"
                  placeholder="Txn ID or notes"
                  value={paymentReference}
                  onChange={(e) => setPaymentReference(e.target.value)}
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setPaymentOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={paymentLoading || plansLoading || !selectedPlanId}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  {paymentLoading ? "Processing..." : "Confirm"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
