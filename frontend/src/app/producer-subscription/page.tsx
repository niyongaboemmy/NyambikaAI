"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Check, Crown, Star, Zap, Shield } from "lucide-react";
import { Button } from "@/components/custom-ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/custom-ui/card";
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
  const plural = (n: number) => (n === 1 ? "" : "s");
  const fetchedPlansRef = useRef(false);

  useEffect(() => {
    if (user?.role !== "producer") {
      router.push("/");
      return;
    }
    if (fetchedPlansRef.current) return;
    fetchedPlansRef.current = true;
    fetchSubscriptionPlans();
  }, [user?.role, router]);

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
              ? [p.features]
              : [],
            featuresRw: Array.isArray(p.featuresRw)
              ? p.featuresRw
              : typeof p.featuresRw === "string" && p.featuresRw.length
              ? [p.featuresRw]
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
    }
  }, [subStatus?.hasActiveSubscription]);

  const handleSubscribe = async () => {
    if ((!selectedPlan && !renewMode)) {
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

  const completeSubscription = async (pay: { method: PaymentMethodKind; reference: string | null }) => {
    setIsProcessing(true);
    try {
      const plan = plans.find((p) => p.id === selectedPlan);
      const amountStr = billingCycle === "monthly" ? plan?.monthlyPrice : plan?.annualPrice;
      if (pay.method === "wallet") {
        // Wallet flow: activate immediately via existing APIs
        if (renewMode && subStatus?.subscriptionId) {
          await apiClient.put(`/api/subscriptions/${subStatus.subscriptionId}/renew`, {
            paymentMethod: "wallet",
            paymentReference: pay.reference,
          });
          toast({ title: "Subscription Renewed", description: "Your subscription has been renewed successfully!" });
        } else {
          if (subStatus?.subscriptionId) {
            const isDifferentPlan = currentPlan && currentPlan.id !== selectedPlan;
            if (isDifferentPlan || subStatus.status === "expired" || !subStatus.hasActiveSubscription) {
              try {
                await apiClient.put(`/api/subscriptions/${subStatus.subscriptionId}`, { status: "cancelled" });
              } catch (e) {
                console.warn("Could not cancel previous subscription before creating a new one", e);
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
          toast({ title: "Subscription Created", description: "Your subscription has been created successfully!" });
        }
        await refetchSubscription();
        if (typeof window !== "undefined") {
          window.location.replace("/producer-orders");
        } else {
          router.push("/producer-orders");
        }
      } else {
        // MoMo flow: backend auto-activates via callback; just redirect after short delay
        toast({ title: "Payment in progress", description: "Your subscription will activate automatically after approval." });
        setTimeout(() => {
          if (typeof window !== "undefined") {
            window.location.replace("/producer-orders");
          } else {
            router.push("/producer-orders");
          }
        }, 4000);
      }
    } catch (error: any) {
      console.error("Error completing subscription after payment:", error);
      toast({
        title: renewMode ? "Renewal Failed" : "Subscription Failed",
        description: error.response?.data?.message || (renewMode ? "Failed to renew subscription" : "Failed to create subscription"),
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const getPlanIcon = (index: number) => {
    const icons = [Star, Crown, Zap];
    return icons[index] || Star;
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
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <div className="container mx-auto px-4 py-12">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-5"
        >
          <h1 className="text-2xl md:text-3xl font-bold text-black dark:text-white bg-clip-text mb-1">
            Choose Your Producer Plan
          </h1>
          <p className="text-base text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            Select the perfect subscription plan to grow your business and reach
            more customers
          </p>
        </motion.div>

        {/* Expiry warning (<= 5 days left) */}
        {subStatus?.hasActiveSubscription &&
          typeof daysLeft === "number" &&
          daysLeft > 0 &&
          daysLeft <= 5 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6"
            >
              <div className="rounded-lg border border-yellow-300 bg-yellow-50 text-yellow-900 dark:border-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-200 p-4">
                <div className="font-semibold">
                  Your plan expires in {daysLeft} day{plural(daysLeft)}.
                </div>
                <div className="text-sm opacity-90">
                  Consider renewing now to avoid interruptions.
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
            className="mb-8"
          >
            <Card className="overflow-hidden border-0 shadow-lg bg-white/80 dark:bg-gray-800/60 backdrop-blur-sm">
              <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="space-y-1">
                  <CardTitle className="text-xl font-bold">
                    {currentPlan
                      ? `Current Plan: ${currentPlan.name}`
                      : "Subscription Status"}
                  </CardTitle>
                  <div className="text-sm text-gray-600 dark:text-gray-300">
                    {subStatus.hasActiveSubscription ? (
                      <>
                        Your subscription is active
                        {subStatus.expiresAt && ` until ${expiresLabel}`}.
                      </>
                    ) : subStatus.status === "expired" ? (
                      <>
                        Your subscription has expired
                        {subStatus.expiresAt && ` on ${expiresLabel}`}.
                      </>
                    ) : (
                      <>No active subscription found.</>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge
                    className={
                      subStatus.hasActiveSubscription
                        ? "bg-green-600 text-white"
                        : "bg-red-600 text-white"
                    }
                  >
                    {subStatus.hasActiveSubscription
                      ? "Active"
                      : subStatus.status === "expired"
                      ? "Expired"
                      : "Inactive"}
                  </Badge>
                </div>
              </CardHeader>
              {currentPlan && (
                <CardContent className="pt-0">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="text-sm text-gray-600 dark:text-gray-300">
                      <div>
                        Max Products:{" "}
                        <span className="font-medium">
                          {currentPlan.maxProducts}
                        </span>
                      </div>
                      <div>
                        Max Orders:{" "}
                        <span className="font-medium">
                          {currentPlan.maxOrders}
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {
                        <Button
                          onClick={() => {
                            setRenewMode(true);
                            setSelectedPlan(currentPlan.id);
                            setDefaultMethod("momo");
                            setShowPayment(true);
                          }}
                          className="bg-blue-600 hover:bg-blue-700 text-white px-4 rounded-full"
                          size="sm"
                        >
                          Renew {currentPlan.name}
                        </Button>
                      }
                      <Button
                        onClick={() => {
                          setShowPlans(true);
                          setRenewMode(false);
                          window.scrollTo({
                            top: document.body.scrollHeight / 4,
                            behavior: "smooth",
                          });
                        }}
                        variant="outline"
                        size="sm"
                        className="px-3 rounded-full"
                      >
                        Change Plan
                      </Button>
                    </div>
                  </div>
                </CardContent>
              )}
            </Card>
          </motion.div>
        )}

        {/* Billing Toggle */}
        {showPlans && (
          <>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="flex justify-center mb-8"
            >
              <div className="bg-white dark:bg-gray-800 p-1 rounded-xl shadow-lg">
                <div className="flex">
                  <button
                    onClick={() => setBillingCycle("monthly")}
                    className={`px-6 py-2 rounded-lg font-medium transition-all ${
                      billingCycle === "monthly"
                        ? "bg-blue-600 text-white shadow-md"
                        : "text-gray-600 dark:text-gray-300 hover:text-blue-600"
                    }`}
                  >
                    Monthly
                  </button>
                  <button
                    onClick={() => setBillingCycle("annual")}
                    className={`px-6 py-2 rounded-lg font-medium transition-all relative ${
                      billingCycle === "annual"
                        ? "bg-blue-600 text-white shadow-md"
                        : "text-gray-600 dark:text-gray-300 hover:text-blue-600"
                    }`}
                  >
                    Annual
                    <Badge className="absolute -top-2 -right-2 bg-green-500 text-white text-xs">
                      Save 30%
                    </Badge>
                  </button>
                </div>
              </div>
            </motion.div>

            {/* Subscription Plans */}
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
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
                    className="relative"
                  >
                    {isPopular && (
                      <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                        <Badge className="bg-gradient-to-r from-orange-500 to-red-500 text-white px-4 py-1">
                          Most Popular
                        </Badge>
                      </div>
                    )}

                    <Card
                      className={`h-full cursor-pointer transition-all duration-300 hover:shadow-xl ${
                        selectedPlan === plan.id
                          ? "ring-2 ring-blue-500 shadow-lg"
                          : "hover:shadow-lg"
                      } ${
                        isPopular
                          ? "border-orange-200 dark:border-orange-800"
                          : ""
                      }`}
                      onClick={() => {
                        setSelectedPlan(plan.id);
                        setRenewMode(false);
                        setDefaultMethod("momo");
                        setShowPayment(true);
                      }}
                    >
                      <CardHeader className="text-center pb-4">
                        <div className="mx-auto mb-4 p-3 bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900 dark:to-purple-900 rounded-full w-fit">
                          <IconComponent className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                        </div>
                        <CardTitle className="text-2xl font-bold">
                          {plan.name}
                        </CardTitle>
                        <p className="text-sm text-gray-600 dark:text-gray-300">
                          {plan.description}
                        </p>
                        <div className="mt-4">
                          <span className="text-2xl md:text-3xl font-bold text-blue-600 dark:text-blue-400">
                            {parseInt(price).toLocaleString()} RWF
                          </span>
                          <span className="text-gray-500 dark:text-gray-400 ml-2">
                            /{billingCycle === "monthly" ? "month" : "year"}
                          </span>
                        </div>
                      </CardHeader>

                      <CardContent>
                        <ul className="space-y-3">
                          {(Array.isArray(plan.features) ? plan.features : []).map((feature, featureIndex) => (
                            <li
                              key={featureIndex}
                              className="flex items-center"
                            >
                              <Check className="h-5 w-5 text-green-500 mr-3 flex-shrink-0" />
                              <span className="text-sm text-gray-600 dark:text-gray-300">
                                {feature}
                              </span>
                            </li>
                          ))}
                        </ul>

                        <div className="mt-6 space-y-2 text-sm text-gray-500 dark:text-gray-400">
                          {plan.maxProducts > 0 && (
                            <div className="flex justify-between">
                              <span>Max Products:</span>
                              <span className="font-medium">
                                {plan.maxProducts}
                              </span>
                            </div>
                          )}
                          {plan.maxOrders > 0 && (
                            <div className="flex justify-between">
                              <span>Max Orders:</span>
                              <span className="font-medium">
                                {plan.maxOrders}
                              </span>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          </>
        )}

        {/* Payment method selection and floating button removed. The dialog opens directly on plan pick or renew. */}

        {/* Payment Dialog */}
        <PaymentDialog
          open={showPayment}
          onOpenChange={setShowPayment}
          amount={(() => {
            const plan = plans.find((p) => p.id === selectedPlan);
            const price = billingCycle === "monthly" ? plan?.monthlyPrice : plan?.annualPrice;
            return Number(price || 0);
          })()}
          description={(() => {
            const plan = plans.find((p) => p.id === selectedPlan);
            return plan ? `Subscription ${plan.name} (${billingCycle})` : "Subscription";
          })()}
          defaultMethod={defaultMethod}
          subscription={selectedPlan ? { planId: selectedPlan, billingCycle } : undefined}
          onSuccess={({ method, reference }) => completeSubscription({ method, reference })}
          onError={(err) => console.error("Payment error", err)}
        />
      </div>
    </div>
  );
}
