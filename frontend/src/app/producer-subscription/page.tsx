"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  Check,
  Crown,
  Zap,
  Brain,
  Rocket,
  ArrowRight,
  TrendingUp,
  Users,
  BarChart3,
  Package,
  Briefcase,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/custom-ui/button";
import { Badge } from "@/components/custom-ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import apiClient from "@/lib/api-client";
import { useToast } from "@/hooks/use-toast";
import { useProducerSubscriptionStatus } from "@/hooks/useProducerSubscriptionStatus";
import PaymentDialog, {
  type PaymentMethodKind,
} from "@/components/PaymentDialog";

interface SubscriptionPlan {
  id: string;
  name: string;
  nameRw: string;
  description: string;
  descriptionRw: string;
  monthlyPrice: string;
  annualPrice: string;
  features: string[];
  featuresRw: string[];
  maxProducts: number;
  maxOrders: number;
  hasAnalytics: boolean;
  hasPrioritySupport: boolean;
  hasCustomBranding: boolean;
  isActive: boolean;
}

// Payment methods UI removed; dialog handles method selection

export default function ProducerSubscriptionPage() {
  const { user } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const {
    status: subStatus,
    plan: currentPlan,
    refetch: refetchSubscription,
  } = useProducerSubscriptionStatus();
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [billingCycle, setBillingCycle] = useState<"monthly" | "annual">(
    "monthly"
  );
  // Removed external payment method selector; PaymentDialog handles it
  const [isProcessing, setIsProcessing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showPlans, setShowPlans] = useState<boolean>(false);
  const [renewMode, setRenewMode] = useState<boolean>(false);
  const [showPayment, setShowPayment] = useState<boolean>(false);
  const [defaultMethod, setDefaultMethod] = useState<PaymentMethodKind>("momo");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const plural = (n: number) => (n === 1 ? "" : "s");
  const fetchedPlansRef = useRef(false);

  // Mobile detection and touch handlers
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  useEffect(() => {
    if (user?.role !== "producer") {
      router.push("/");
      return;
    }
    if (fetchedPlansRef.current) return;
    fetchedPlansRef.current = true;
    fetchSubscriptionPlans();
  }, [user?.role, router]);


  // Haptic feedback simulation
  const simulateHapticFeedback = useCallback(() => {
    if ("vibrate" in navigator) {
      navigator.vibrate(50);
    }
  }, []);

  // Pull to refresh functionality
  const handlePullToRefresh = useCallback(async () => {
    if (isRefreshing) return;
    setIsRefreshing(true);
    simulateHapticFeedback();

    try {
      await fetchSubscriptionPlans();
      await refetchSubscription();
    } catch (error) {
      console.error("Refresh failed:", error);
    } finally {
      setTimeout(() => setIsRefreshing(false), 1000);
    }
  }, [isRefreshing, refetchSubscription]);

  const fetchSubscriptionPlans = async () => {
    try {
      const response = await apiClient.get("/api/subscription-plans");
      const raw = response.data as any;
      const normalized: SubscriptionPlan[] = Array.isArray(raw)
        ? raw.map((p: any) => ({
            ...p,
            features: Array.isArray(p.features)
              ? p.features
              : typeof p.features === "string" && p.features.length
              ? (JSON.parse(p.features) as string[])
              : [],
            featuresRw: Array.isArray(p.featuresRw)
              ? p.featuresRw
              : typeof p.featuresRw === "string" && p.featuresRw.length
              ? (JSON.parse(p.featuresRw) as string[])
              : [],
          }))
        : [];
      setPlans(normalized);
    } catch (error) {
      console.error("Error fetching subscription plans:", error);
      toast({
        title: "Error",
        description: "Failed to load subscription plans",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Control when to show plans: show if no active subscription or user clicked "Change Plan"
  useEffect(() => {
    if (!subStatus) return;
    if (!subStatus.hasActiveSubscription) {
      setShowPlans(true);
      // Auto-scroll to plans on mobile when they become visible
      if (isMobile) {
        setTimeout(() => {
          const plansElement = document.getElementById("plans-section");
          if (plansElement) {
            plansElement.scrollIntoView({ behavior: "smooth", block: "start" });
          }
        }, 300);
      }
    }
  }, [subStatus?.hasActiveSubscription, isMobile]);

  const handleSubscribe = async () => {
    if (!selectedPlan && !renewMode) {
      toast({
        title: "Missing Information",
        description: "Please select a subscription plan",
        variant: "destructive",
      });
      return;
    }
    // open the payment dialog; map previous selection to default tab
    setShowPayment(true);
  };

  const completeSubscription = async (pay: {
    method: PaymentMethodKind;
    reference: string | null;
  }) => {
    setIsProcessing(true);
    try {
      const plan = plans.find((p) => p.id === selectedPlan);
      const amountStr =
        billingCycle === "monthly" ? plan?.monthlyPrice : plan?.annualPrice;
      if (pay.method === "wallet") {
        // Wallet flow: activate immediately via existing APIs
        if (renewMode && subStatus?.subscriptionId) {
          await apiClient.put(
            `/api/subscriptions/${subStatus.subscriptionId}/renew`,
            {
              paymentMethod: "wallet",
              paymentReference: pay.reference,
            }
          );
          toast({
            title: "Subscription Renewed",
            description: "Your subscription has been renewed successfully!",
          });
        } else {
          if (subStatus?.subscriptionId) {
            const isDifferentPlan =
              currentPlan && currentPlan.id !== selectedPlan;
            if (
              isDifferentPlan ||
              subStatus.status === "expired" ||
              !subStatus.hasActiveSubscription
            ) {
              try {
                await apiClient.put(
                  `/api/subscriptions/${subStatus.subscriptionId}`,
                  { status: "cancelled" }
                );
              } catch (e) {
                console.warn(
                  "Could not cancel previous subscription before creating a new one",
                  e
                );
              }
            }
          }
          await apiClient.post("/api/subscriptions", {
            planId: selectedPlan,
            billingCycle,
            paymentMethod: "wallet",
            paymentReference: pay.reference,
            amount: amountStr,
          });
          toast({
            title: "Subscription Created",
            description: "Your subscription has been created successfully!",
          });
        }
        await refetchSubscription();
        if (typeof window !== "undefined") {
          window.location.replace("/producer-orders");
        } else {
          router.push("/producer-orders");
        }
      } else {
        // MoMo flow: backend auto-activates via callback; PaymentDialog calls onSuccess only after approval
        toast({
          title: "Payment approved",
          description: "Your subscription is now active.",
        });
        if (typeof window !== "undefined") {
          window.location.replace("/producer-orders");
        } else {
          router.push("/producer-orders");
        }
      }
    } catch (error: any) {
      console.error("Error completing subscription after payment:", error);
      toast({
        title: renewMode ? "Renewal Failed" : "Subscription Failed",
        description:
          error.response?.data?.message ||
          (renewMode
            ? "Failed to renew subscription"
            : "Failed to create subscription"),
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const getPlanIcon = (index: number) => {
    const icons = [Package, Briefcase, Crown];
    return icons[index] || Package;
  };

  const expiresLabel = subStatus?.expiresAt
    ? new Date(subStatus.expiresAt).toLocaleDateString()
    : undefined;
  const daysLeft = subStatus?.expiresAt
    ? Math.ceil(
        (new Date(subStatus.expiresAt).getTime() - Date.now()) /
          (1000 * 60 * 60 * 24)
      )
    : undefined;

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-gray-900 dark:via-blue-900/20 dark:to-indigo-900/30 flex items-center justify-center">
        <div className="relative">
          {/* AI Loading Animation */}
          <div className="w-16 h-16 relative">
            <div
              className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-500 via-purple-500 to-cyan-500 animate-spin"
              style={{ animationDuration: "2s" }}
            />
            <div
              className="absolute inset-1 rounded-full bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 animate-spin"
              style={{
                animationDuration: "1.5s",
                animationDirection: "reverse",
              }}
            />
            <div className="absolute inset-3 rounded-full bg-white dark:bg-gray-900 flex items-center justify-center">
              <Brain className="w-6 h-6 text-blue-600 dark:text-blue-400 animate-pulse" />
            </div>
          </div>
          <div className="text-center mt-4">
            <div className="text-sm font-medium bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Loading AI Plans...
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative overflow-hidden pt-8">
      {/* Pull to Refresh Indicator */}
      {isMobile && isRefreshing && (
        <motion.div
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -50 }}
          className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl rounded-full px-4 py-2 shadow-lg border border-white/20"
        >
          <div className="flex items-center gap-2">
            <RefreshCw className="w-4 h-4 text-blue-600 animate-spin" />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Refreshing...
            </span>
          </div>
        </motion.div>
      )}

      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Floating AI Orbs */}
        <div className="absolute top-20 left-10 w-32 h-32 bg-gradient-to-r from-blue-400/20 to-purple-400/20 rounded-full blur-xl animate-pulse" />
        <div
          className="absolute top-40 right-20 w-24 h-24 bg-gradient-to-r from-cyan-400/20 to-blue-400/20 rounded-full blur-lg animate-bounce"
          style={{ animationDelay: "1s" }}
        />
        <div
          className="absolute bottom-32 left-1/4 w-20 h-20 bg-gradient-to-r from-purple-400/20 to-pink-400/20 rounded-full blur-md animate-pulse"
          style={{ animationDelay: "2s" }}
        />
        <div
          className="absolute bottom-20 right-1/3 w-28 h-28 bg-gradient-to-r from-indigo-400/20 to-cyan-400/20 rounded-full blur-lg animate-bounce"
          style={{ animationDelay: "0.5s" }}
        />

        {/* Neural Network Grid */}
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-1/4 left-1/4 w-px h-32 bg-gradient-to-b from-transparent via-blue-300/50 to-transparent" />
          <div className="absolute top-1/3 right-1/4 w-px h-24 bg-gradient-to-b from-transparent via-purple-300/50 to-transparent" />
          <div className="absolute bottom-1/3 left-1/3 w-24 h-px bg-gradient-to-r from-transparent via-cyan-300/50 to-transparent" />
          <div className="absolute bottom-1/4 right-1/3 w-32 h-px bg-gradient-to-r from-transparent via-indigo-300/50 to-transparent" />
        </div>

        {/* Floating Particles */}
        <div
          className="absolute top-1/4 left-1/2 w-2 h-2 bg-blue-400 rounded-full animate-ping"
          style={{ animationDelay: "0s" }}
        />
        <div
          className="absolute top-1/3 right-1/4 w-1.5 h-1.5 bg-purple-400 rounded-full animate-ping"
          style={{ animationDelay: "1s" }}
        />
        <div
          className="absolute bottom-1/2 left-1/4 w-1 h-1 bg-cyan-400 rounded-full animate-ping"
          style={{ animationDelay: "2s" }}
        />
        <div
          className="absolute bottom-1/3 right-1/2 w-2 h-2 bg-pink-400 rounded-full animate-ping"
          style={{ animationDelay: "1.5s" }}
        />
      </div>

      {/* Mobile-Optimized Container */}
      <div
        className="container mx-auto px-3 sm:px-4 py-2 sm:py-4 relative z-10"
      >
        {/* Mobile Header with Pull-to-Refresh */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="mb-3 sm:mb-6"
          onTouchStart={
            isMobile
              ? (e) => {
                  if (e.touches[0].clientY < 100) {
                    handlePullToRefresh();
                  }
                }
              : undefined
          }
        >
          {/* Sticky Mobile Header */}
          <div
            className={`${
              isMobile
                ? "sticky top-0 z-40 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-2xl border border-white/20 shadow-lg mb-4 p-3"
                : ""
            }`}
          >
            <div className="flex items-center justify-between gap-3">
              <div className="flex-1">
                <motion.h1
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2, duration: 0.5 }}
                  className={`${
                    isMobile ? "text-lg" : "text-xl sm:text-xl lg:text-2xl"
                  } font-bold`}
                >
                  Subscription Plan
                </motion.h1>

                {/* Mobile Feature Pills - Horizontal Scroll */}
                {isMobile ? (
                  <div className="flex gap-2 overflow-x-auto scrollbar-hide mt-2 pb-1">
                    {[
                      {
                        icon: BarChart3,
                        text: "Analytics",
                        color: "from-blue-500 to-violet-500",
                      },
                      {
                        icon: TrendingUp,
                        text: "Growth",
                        color: "from-violet-500 to-blue-500",
                      },
                      {
                        icon: Users,
                        text: "Insights",
                        color: "from-blue-600 to-violet-600",
                      },
                    ].map((pill, index) => (
                      <motion.div
                        key={pill.text}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.3 + index * 0.1, duration: 0.4 }}
                        className={`flex items-center gap-1 px-2 py-1 rounded-full bg-gradient-to-r ${pill.color} text-white text-xs font-medium shadow-md backdrop-blur-sm whitespace-nowrap flex-shrink-0`}
                      >
                        <pill.icon className="w-2.5 h-2.5" />
                        <span>{pill.text}</span>
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4, duration: 0.6 }}
                    className="flex flex-wrap gap-2 mt-2"
                  >
                    {[
                      {
                        icon: BarChart3,
                        text: "Analytics",
                        color: "from-blue-500 to-violet-500",
                      },
                      {
                        icon: TrendingUp,
                        text: "Growth",
                        color: "from-violet-500 to-blue-500",
                      },
                      {
                        icon: Users,
                        text: "Insights",
                        color: "from-blue-600 to-violet-600",
                      },
                    ].map((pill, index) => (
                      <motion.div
                        key={pill.text}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.5 + index * 0.1, duration: 0.4 }}
                        className={`flex items-center gap-1 px-2 py-1 rounded-full bg-gradient-to-r ${pill.color} text-white text-xs font-medium shadow-md backdrop-blur-sm`}
                      >
                        <pill.icon className="w-3 h-3" />
                        <span>{pill.text}</span>
                        <div className="w-1 h-1 bg-white/60 rounded-full animate-pulse" />
                      </motion.div>
                    ))}
                  </motion.div>
                )}
              </div>

              {/* Mobile Refresh Button */}
              {isMobile && (
                <motion.button
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.6, duration: 0.4 }}
                  onClick={handlePullToRefresh}
                  disabled={isRefreshing}
                  className="p-2 rounded-full bg-gradient-to-r from-blue-500 to-violet-500 text-white shadow-lg active:scale-95 transition-transform duration-150"
                >
                  <RefreshCw
                    className={`w-4 h-4 ${isRefreshing ? "animate-spin" : ""}`}
                  />
                </motion.button>
              )}
            </div>
          </div>
        </motion.div>

        {/* Expiry warning (<= 5 days left) */}
        {subStatus?.hasActiveSubscription &&
          typeof daysLeft === "number" &&
          daysLeft > 0 &&
          daysLeft <= 5 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-4 sm:mb-6"
            >
              <div className="relative overflow-hidden rounded-xl border border-amber-200/50 bg-gradient-to-r from-amber-50/80 to-orange-50/80 dark:from-amber-900/20 dark:to-orange-900/20 backdrop-blur-sm p-3 sm:p-4">
                <div className="absolute inset-0 bg-gradient-to-r from-amber-400/10 to-orange-400/10 animate-pulse" />
                <div className="relative flex items-start gap-2 sm:gap-3">
                  <div className="flex-shrink-0 p-1.5 bg-amber-100 dark:bg-amber-900/50 rounded-lg">
                    <Zap className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                  </div>
                  <div className="flex-1">
                    <div className="font-medium text-amber-900 dark:text-amber-200 text-sm">
                      ⚡ Expiring Soon!
                    </div>
                    <div className="text-xs text-amber-800 dark:text-amber-300">
                      {daysLeft} day{plural(daysLeft)} left. Renew now to keep
                      AI features active.
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

        {/* Current Subscription Status */}
        {subStatus && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="mb-6 sm:mb-8"
          >
            <div className="relative overflow-hidden rounded-2xl borde border-white/20 bg-white dark:bg-gray-800/10 backdrop-blur-xl hover:shadow-md">
              {/* Glassmorphism Background */}
              <div className="absolute inset-0 bg-gradient-to-br from-white/20 via-blue-50/30 to-purple-50/20 dark:from-gray-800/20 dark:via-blue-900/30 dark:to-purple-900/20" />

              {/* Animated Border */}
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-blue-500/20 to-violet-500/20 animate-pulse" />
              <div className="absolute inset-[1px] rounded-2xl bg-white dark:bg-gray-900/80 backdrop-blur-xl" />

              <div className="relative p-4 sm:p-6">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-gradient-to-r from-blue-500 to-violet-500 rounded-xl">
                        <Briefcase className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <h3 className="text-base sm:text-lg font-bold bg-gradient-to-r from-blue-600 to-violet-600 bg-clip-text text-transparent">
                          {currentPlan ? currentPlan.name : "Status"}
                        </h3>
                        <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                          {subStatus.hasActiveSubscription ? (
                            <>
                              🚀 Active{" "}
                              {subStatus.expiresAt && `until ${expiresLabel}`}
                            </>
                          ) : subStatus.status === "expired" ? (
                            <>
                              ⏰ Expired{" "}
                              {subStatus.expiresAt && `on ${expiresLabel}`}
                            </>
                          ) : (
                            <>🎯 Ready to start?</>
                          )}
                        </div>
                      </div>
                    </div>

                    {currentPlan && (
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        <div className="text-center p-2 bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/30 dark:to-cyan-900/30 rounded-lg">
                          <div className="text-sm font-bold text-blue-600 dark:text-blue-400">
                            {currentPlan.maxProducts}
                          </div>
                          <div className="text-xs text-gray-600 dark:text-gray-400">
                            Products
                          </div>
                        </div>
                        <div className="text-center p-2 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/30 dark:to-pink-900/30 rounded-lg">
                          <div className="text-sm font-bold text-purple-600 dark:text-purple-400">
                            {currentPlan.maxOrders}
                          </div>
                          <div className="text-xs text-gray-600 dark:text-gray-400">
                            Orders
                          </div>
                        </div>
                        <div className="text-center p-2 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/30 dark:to-emerald-900/30 rounded-lg">
                          <div className="text-sm font-bold text-green-600 dark:text-green-400">
                            {(currentPlan as any).hasAnalytics ? "✓" : "✗"}
                          </div>
                          <div className="text-xs text-gray-600 dark:text-gray-400">
                            Analytics
                          </div>
                        </div>
                        <div className="text-center p-2 bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-900/30 dark:to-red-900/30 rounded-lg">
                          <div className="text-sm font-bold text-orange-600 dark:text-orange-400">
                            {(currentPlan as any).hasPrioritySupport
                              ? "✓"
                              : "✗"}
                          </div>
                          <div className="text-xs text-gray-600 dark:text-gray-400">
                            Support
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3">
                    <Badge
                      className={`px-4 py-2 text-sm font-medium rounded-full w-max ${
                        subStatus.hasActiveSubscription
                          ? "bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-lg"
                          : "bg-gradient-to-r from-red-500 to-pink-500 text-white shadow-lg"
                      }`}
                    >
                      {subStatus.hasActiveSubscription
                        ? "🟢 Active"
                        : subStatus.status === "expired"
                        ? "🔴 Expired"
                        : "⚪ Inactive"}
                    </Badge>

                    <div className="flex flex-col md:flex-row gap-2">
                      {currentPlan && (
                        <Button
                          onClick={() => {
                            setRenewMode(true);
                            setSelectedPlan(currentPlan.id);
                            setDefaultMethod("momo");
                            setShowPayment(true);
                          }}
                          className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-4 py-2 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 flex items-center gap-2"
                          size="sm"
                        >
                          <Rocket className="w-4 h-4" />
                          Renew Plan
                        </Button>
                      )}
                      {currentPlan && (
                        <Button
                          onClick={() => {
                            setShowPlans(true);
                            setRenewMode(false);
                            // Auto-scroll to plans on mobile when "Change Plan" is clicked
                            if (isMobile) {
                              setTimeout(() => {
                                const plansElement =
                                  document.getElementById("plans-section");
                                if (plansElement) {
                                  plansElement.scrollIntoView({
                                    behavior: "smooth",
                                    block: "start",
                                  });
                                }
                              }, 100);
                            } else {
                              window.scrollTo({
                                top: document.body.scrollHeight / 5,
                                behavior: "smooth",
                              });
                            }
                          }}
                          variant="outline"
                          size="sm"
                          className="px-4 py-2 rounded-full border-2 border-gray-300 dark:border-gray-600 hover:border-blue-500 dark:hover:border-blue-400 transition-all duration-300 flex items-center gap-2"
                        >
                          <ArrowRight className="w-4 h-4" />
                          Change Plan
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* AI-Inspired Billing Toggle */}
        {showPlans && (
          <div id="plans-section">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="flex justify-center mb-6 sm:mb-8"
            >
              <div className="relative">
                {/* Glowing Background */}
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-violet-500/20 rounded-3xl blur-xl animate-pulse" />

                <div className="relative bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl p-1.5 sm:p-2 rounded-3xl shadow-2xl border border-white/30">
                  <div className="flex relative gap-1">
                    {/* Sliding Background */}
                    <div
                      className={`absolute top-1.5 bottom-1.5 sm:top-2 sm:bottom-2 bg-gradient-to-r from-blue-600 to-violet-600 rounded-2xl shadow-lg transition-all duration-500 ease-out ${
                        billingCycle === "monthly"
                          ? "left-1.5 sm:left-2 right-1/2 mr-0.5"
                          : "left-1/2 right-1.5 sm:right-2 ml-0.5"
                      }`}
                    />

                    <button
                      onClick={() => setBillingCycle("monthly")}
                      className={`relative z-10 px-4 sm:px-6 lg:px-8 py-2.5 sm:py-3 rounded-2xl font-medium text-sm sm:text-base transition-all duration-300 flex items-center gap-1.5 sm:gap-2 min-w-0 flex-1 justify-center ${
                        billingCycle === "monthly"
                          ? "text-white"
                          : "text-gray-600 dark:text-gray-300 hover:text-blue-600"
                      }`}
                    >
                      <Package className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" />
                      <span className="whitespace-nowrap">Monthly</span>
                    </button>
                    <button
                      onClick={() => setBillingCycle("annual")}
                      className={`relative z-10 px-4 sm:px-6 lg:px-8 py-2.5 sm:py-3 rounded-2xl font-medium text-sm sm:text-base transition-all duration-300 flex items-center gap-1.5 sm:gap-2 min-w-0 flex-1 justify-center ${
                        billingCycle === "annual"
                          ? "text-white"
                          : "text-gray-600 dark:text-gray-300 hover:text-blue-600"
                      }`}
                    >
                      <Crown className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" />
                      <span className="whitespace-nowrap">Annual</span>
                      <Badge className="bg-gradient-to-r from-blue-500 to-violet-500 text-white text-xs px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full shadow-md ml-1 flex-shrink-0">
                        30%
                      </Badge>
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Subscription Plans - Always use responsive grid (vertical list on mobile) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-7 sm:gap-7 md:gap-7 mb-6 md:px-2">
                {plans.map((plan, index) => {
                  const IconComponent = getPlanIcon(index);
                  const price =
                    billingCycle === "monthly"
                      ? plan.monthlyPrice
                      : plan.annualPrice;
                  const isPopular = index === 1;

                  return (
                    <motion.div
                      key={plan.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2 + index * 0.1 }}
                      className="relative group"
                    >
                      {isPopular && (
                        <div className="absolute top-2 left-1/2 transform -translate-x-1/2 z-20">
                          <Badge className="bg-gradient-to-r from-blue-500 to-violet-500 text-white px-2 py-0.5 text-xs shadow-md">
                            Popular
                          </Badge>
                        </div>
                      )}

                      {/* Glassmorphism Card */}
                      <div
                        className={`relative h-full cursor-pointer transition-all duration-500 group-hover:scale-105 ${
                          selectedPlan === plan.id ? "scale-105" : ""
                        }`}
                        onClick={() => {
                          setSelectedPlan(plan.id);
                          setRenewMode(false);
                          setDefaultMethod("momo");
                          setShowPayment(true);
                        }}
                      >
                        {/* Animated Glow Effect */}
                        <div
                          className={`absolute inset-0 rounded-2xl bg-gradient-to-r opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-xl ${
                            isPopular
                              ? "from-blue-400/30 to-violet-400/30"
                              : "from-blue-400/30 to-violet-400/30"
                          }`}
                        />

                        {/* Card Background */}
                        <div
                          className={`relative overflow-hidden rounded-xl border backdrop-blur-xl shadow-lg ${
                            selectedPlan === plan.id
                              ? "border-blue-400/50 bg-blue-50/80 dark:bg-blue-900/20"
                              : isPopular
                              ? "border-violet-200/50 bg-white/80 dark:bg-gray-800/80"
                              : "border-white/20 bg-white/60 dark:bg-gray-800/60"
                          }`}
                        >
                          {/* Animated Background Pattern */}
                          <div className="absolute inset-0 opacity-30">
                            <div className="absolute top-3 right-3 w-12 h-12 bg-gradient-to-br from-blue-400/20 to-violet-400/20 rounded-full blur-lg animate-pulse" />
                            <div
                              className="absolute bottom-3 left-3 w-8 h-8 bg-gradient-to-br from-violet-400/20 to-blue-400/20 rounded-full blur-md animate-pulse"
                              style={{ animationDelay: "1s" }}
                            />
                          </div>

                          <div className="relative p-3 sm:p-4 pt-8 sm:pt-8">
                            {/* Header - Desktop flex-row layout */}
                            <div className="flex flex-col lg:flex-row lg:items-start lg:gap-4 mb-3">
                              <div className="flex flex-col items-center lg:items-start lg:flex-1">
                                <div
                                  className={`mb-2 p-1.5 rounded-lg w-fit ${
                                    isPopular
                                      ? "bg-gradient-to-br from-violet-100 to-blue-100 dark:from-violet-900/50 dark:to-blue-900/50"
                                      : "bg-gradient-to-br from-blue-100 to-violet-100 dark:from-blue-900/50 dark:to-violet-900/50"
                                  }`}
                                >
                                  <IconComponent
                                    className={`h-5 w-5 ${
                                      isPopular
                                        ? "text-violet-600 dark:text-violet-400"
                                        : "text-blue-600 dark:text-blue-400"
                                    }`}
                                  />
                                </div>
                                <h3 className="text-base font-bold mb-1 text-center lg:text-left">
                                  {plan.name}
                                </h3>
                                <p className="text-xs text-gray-600 dark:text-gray-400 text-center lg:text-left">
                                  {plan.description}
                                </p>
                              </div>
                              <div className="text-center lg:text-right mt-2 lg:mt-0">
                                <div className="mb-2">
                                  <span
                                    className={`text-lg font-bold ${
                                      isPopular
                                        ? "bg-gradient-to-r from-violet-600 to-blue-600 bg-clip-text text-transparent"
                                        : "bg-gradient-to-r from-blue-600 to-violet-600 bg-clip-text text-transparent"
                                    }`}
                                  >
                                    {parseInt(price).toLocaleString()}
                                  </span>
                                  <span className="text-xs text-gray-500 dark:text-gray-400 ml-1">
                                    RWF/
                                    {billingCycle === "monthly" ? "mo" : "yr"}
                                  </span>
                                </div>
                              </div>
                            </div>

                            {/* Features */}
                            <div className="space-y-2 mb-4">
                              {(Array.isArray(plan.features)
                                ? plan.features
                                : []
                              )
                                .slice(0, 4)
                                .map((feature, featureIndex) => (
                                  <div
                                    key={featureIndex}
                                    className="flex items-center text-xs"
                                  >
                                    <div className="w-4 h-4 rounded-full bg-gradient-to-r from-green-400 to-emerald-400 flex items-center justify-center mr-2 flex-shrink-0">
                                      <Check className="h-2.5 w-2.5 text-white" />
                                    </div>
                                    <span className="text-gray-600 dark:text-gray-300 leading-tight">
                                      {feature}
                                    </span>
                                  </div>
                                ))}
                            </div>

                            {/* Stats */}
                            <div className="grid grid-cols-2 gap-2 text-xs">
                              {plan.maxProducts > 0 && (
                                <div className="text-center p-2 bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/30 dark:to-cyan-900/30 rounded-lg">
                                  <div className="font-bold text-blue-600 dark:text-blue-400">
                                    {plan.maxProducts}
                                  </div>
                                  <div className="text-gray-600 dark:text-gray-400">
                                    Products
                                  </div>
                                </div>
                              )}
                              {plan.maxOrders > 0 && (
                                <div className="text-center p-2 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/30 dark:to-pink-900/30 rounded-lg">
                                  <div className="font-bold text-purple-600 dark:text-purple-400">
                                    {plan.maxOrders}
                                  </div>
                                  <div className="text-gray-600 dark:text-gray-400">
                                    Orders
                                  </div>
                                </div>
                              )}
                            </div>

                            {/* CTA Button */}
                            <div className="mt-4">
                              <div
                                className={`w-full py-2 px-4 rounded-full text-center text-sm font-semibold transition-all duration-300 ${
                                  isPopular
                                    ? "bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-lg hover:shadow-xl"
                                    : "bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg hover:shadow-xl"
                                }`}
                              >
                                Choose Plan
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
            </div>
          </div>
        )}

        {/* Mobile swipe/step navigation removed for simple vertical scroll */}

        {/* Payment method selection and floating button removed. The dialog opens directly on plan pick or renew. */}

        {/* Payment Dialog */}
        <PaymentDialog
          title={`Subscription ${
            selectedPlan ? plans.find((p) => p.id === selectedPlan)?.name : ""
          } (${billingCycle})`}
          open={showPayment}
          onOpenChange={setShowPayment}
          amount={(() => {
            const plan = plans.find((p) => p.id === selectedPlan);
            const price =
              billingCycle === "monthly"
                ? plan?.monthlyPrice
                : plan?.annualPrice;
            return Number(price || 0);
          })()}
          description={(() => {
            const plan = plans.find((p) => p.id === selectedPlan);
            return plan
              ? `Subscription ${plan.name} (${billingCycle})`
              : "Subscription";
          })()}
          defaultMethod={defaultMethod}
          subscription={
            selectedPlan ? { planId: selectedPlan, billingCycle } : undefined
          }
          onSuccess={({ method, reference }) =>
            completeSubscription({ method, reference })
          }
          onError={(err) => console.error("Payment error", err)}
        />
      </div>
    </div>
  );
}
