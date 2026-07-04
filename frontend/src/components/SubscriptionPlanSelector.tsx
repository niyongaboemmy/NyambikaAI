"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/custom-ui/card";
import { Button } from "@/components/custom-ui/button";
import { Badge } from "@/components/custom-ui/badge";
import { apiClient } from "@/config/api";
import { useToast } from "@/hooks/use-toast";
import {
  Check,
  Sparkles,
  Zap,
  Crown,
  Star,
  TrendingUp,
  Shield,
} from "lucide-react";

interface SubscriptionPlan {
  id: string;
  name: string;
  description: string;
  monthlyPrice: number;
  annualPrice: number;
  features: string[];
  isPopular?: boolean;
  isPremium?: boolean;
}

interface SubscriptionPlanSelectorProps {
  onPlanSelect: (planId: string, billingCycle: "monthly" | "annual") => void;
  selectedPlanId?: string;
  selectedBillingCycle?: "monthly" | "annual";
  loading?: boolean;
  className?: string;
}

export default function SubscriptionPlanSelector({
  onPlanSelect,
  selectedPlanId,
  selectedBillingCycle = "monthly",
  loading = false,
  className = "",
}: SubscriptionPlanSelectorProps) {
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [plansLoading, setPlansLoading] = useState(true);
  const [billingCycle, setBillingCycle] = useState<"monthly" | "annual">(
    selectedBillingCycle
  );
  const { toast } = useToast();

  const fetchPlans = async () => {
    try {
      setPlansLoading(true);
      const response = await apiClient.get("/api/subscription-plans");
      const raw = response.data as any;
      const normalized: SubscriptionPlan[] = Array.isArray(raw)
        ? raw.map((p: any) => ({
            id: String(p.id ?? ""),
            name: String(p.name ?? "Plan"),
            description: String(p.description ?? ""),
            monthlyPrice: Number(p.monthlyPrice ?? p.monthly_price ?? 0),
            annualPrice: Number(p.annualPrice ?? p.annual_price ?? 0),
            features: Array.isArray(p.features)
              ? p.features.map((f: any) => String(f))
              : typeof p.features === "string" && p.features.length
              ? [String(p.features)]
              : [],
            isPopular: Boolean(p.isPopular ?? p.popular),
            isPremium: Boolean(p.isPremium ?? p.premium),
          }))
        : [];
      setPlans(normalized);
    } catch (error: any) {
      console.error("Error fetching plans:", error);
      toast({
        title: "Error",
        description: "Failed to load subscription plans",
        variant: "destructive",
      });
    } finally {
      setPlansLoading(false);
    }
  };

  useEffect(() => {
    fetchPlans();
  }, []);

  const getPlanIcon = (planName: string) => {
    const name = planName.toLowerCase();
    if (name.includes("premium") || name.includes("pro")) {
      return <Crown className="w-5 h-5" />;
    }
    if (name.includes("basic") || name.includes("starter")) {
      return <Zap className="w-5 h-5" />;
    }
    if (name.includes("enterprise") || name.includes("business")) {
      return <Shield className="w-5 h-5" />;
    }
    return <Star className="w-5 h-5" />;
  };

  const getDiscountPercentage = (monthly: number, annual: number) => {
    const monthlyTotal = monthly * 12;
    const savings = monthlyTotal - annual;
    return Math.round((savings / monthlyTotal) * 100);
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("en-RW", {
      style: "currency",
      currency: "RWF",
      minimumFractionDigits: 0,
    }).format(price);
  };

  if (plansLoading) {
    return (
      <div className={`space-y-6 ${className}`}>
        {/* Billing Toggle Skeleton */}
        <div className="flex justify-center">
          <div className="w-64 h-12 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse" />
        </div>
        {/* Plans Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="w-full h-80 bg-gray-200 dark:bg-gray-700 rounded-3xl animate-pulse"
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div
      className={`space-y-6 ${className} overflow-y-auto`}
      style={{ maxHeight: "calc(100vh - 240px)" }}
    >
      {/* Holographic Background */}
      <div className="relative">
        <motion.div
          className="absolute -top-20 -right-20 w-40 h-40 rounded-full blur-3xl bg-gray-400/10"
          animate={{ scale: [1, 1.2, 1], rotate: [0, 180, 360] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute -bottom-20 -left-20 w-40 h-40 rounded-full blur-3xl bg-gray-400/10"
          animate={{ scale: [1.2, 1, 1.2], rotate: [360, 180, 0] }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
        />

        {/* Billing Cycle Toggle */}
        <motion.div
          className="flex justify-center mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <div className="bg-white/70 dark:bg-gray-900/70 backdrop-blur-xl border border-gray-200/50 dark:border-gray-700/50 rounded-full p-1">
            <div className="flex">
              <motion.button
                type="button"
                onClick={() => setBillingCycle("monthly")}
                className={`px-6 py-3 rounded-full text-sm font-medium transition-all duration-300 ${
                  billingCycle === "monthly"
                    ? "text-white bg-gold-600"
                    : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
                }`}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                Monthly
              </motion.button>
              <motion.button
                type="button"
                onClick={() => setBillingCycle("annual")}
                className={`px-6 py-3 rounded-full text-sm font-medium transition-all duration-300 flex items-center gap-2 ${
                  billingCycle === "annual"
                    ? "text-white bg-gold-600"
                    : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
                }`}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                Annual
                <Badge className="bg-gold-500 text-white text-xs px-2 py-0.5">
                  Save up to 30%
                </Badge>
              </motion.button>
            </div>
          </div>
        </motion.div>

        {/* Plans Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 px-2">
          {plans.map((plan, index) => {
            const isSelected = selectedPlanId === plan.id;
            const price =
              billingCycle === "monthly" ? plan.monthlyPrice : plan.annualPrice;
            const discount =
              billingCycle === "annual"
                ? getDiscountPercentage(plan.monthlyPrice, plan.annualPrice)
                : 0;

            return (
              <motion.div
                key={plan.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 + index * 0.1 }}
                whileHover={{ scale: 1.02, y: -5 }}
                className="group relative"
              >
                {plan.isPopular && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 z-10">
                    <Badge className="text-white px-4 py-1 bg-gold-300">
                      <Sparkles className="w-3 h-3 mr-1" />
                      Most Popular
                    </Badge>
                  </div>
                )}

                <Card
                  className={`relative overflow-hidden transition-all duration-300 cursor-pointer rounded-3xl ${
                    isSelected
                      ? "ring-2 ring-gold-500-gold-500/25"
                      : ""
                  } ${
                    plan.isPremium
                      ? "border-gray-200/50 dark:border-gray-700/50 bg-gray-50/80 dark:bg-gray-900/30"
                      : "bg-white/70 dark:bg-gray-900/70 border-gray-200/50 dark:border-gray-700/50"
                  } backdrop-blur-xl`}
                  onClick={() => onPlanSelect(plan.id, billingCycle)}
                >

                  <CardContent className="p-6 relative">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <motion.div
                          className="w-10 h-10 rounded-2xl flex items-center justify-center bg-gold-600"
                          whileHover={{ rotate: 5 }}
                        >
                          {getPlanIcon(plan.name)}
                        </motion.div>
                        <div>
                          <h3 className="font-bold text-lg text-gray-900 dark:text-white">
                            {plan.name}
                          </h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {plan.description}
                          </p>
                        </div>
                      </div>
                      {isSelected && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="w-6 h-6 bg-gold-500 rounded-full flex items-center justify-center"
                        >
                          <Check className="w-4 h-4 text-white" />
                        </motion.div>
                      )}
                    </div>

                    {/* Pricing */}
                    <div className="mb-6">
                      <div className="flex items-baseline gap-2">
                        <span className="text-3xl font-bold text-gray-900 dark:text-white">
                          {formatPrice(price)}
                        </span>
                        <span className="text-gray-600 dark:text-gray-400">
                          /{billingCycle === "monthly" ? "month" : "year"}
                        </span>
                      </div>
                      {billingCycle === "annual" && discount > 0 && (
                        <div className="flex items-center gap-2 mt-2">
                          <Badge className="bg-gray-100 text-gray-900 dark:bg-gray-800/30 dark:text-white">
                            Save {discount}%
                          </Badge>
                          <span className="text-sm text-gray-500 line-through">
                            {formatPrice(plan.monthlyPrice * 12)}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Features */}
                    <div className="space-y-3 mb-6">
                      {(Array.isArray(plan.features) ? plan.features : []).map(
                        (feature, idx) => (
                          <motion.div
                            key={idx}
                            className="flex items-center gap-3"
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.3 + idx * 0.05 }}
                          >
                            <div className="w-5 h-5 bg-gray-100 dark:bg-gray-800/30 rounded-full flex items-center justify-center flex-shrink-0">
                              <Check className="w-3 h-3 text-gray-900 dark:text-white" />
                            </div>
                            <span className="text-sm text-gray-700 dark:text-gray-300">
                              {feature}
                            </span>
                          </motion.div>
                        )
                      )}
                    </div>

                    {/* Action Button */}
                    <motion.div
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <Button
                        type="button"
                        onClick={() => onPlanSelect(plan.id, billingCycle)}
                        disabled={loading}
                        className={`w-full rounded-2xl ${
                          isSelected
                            ? "bg-gold-600 hover:bg-gold-700 text-white"
                            : "text-white bg-gold-600 hover:bg-gold-700"
                        } transition-all duration-300`}
                      >
                        {isSelected ? (
                          <>
                            <Check className="w-4 h-4 mr-2" />
                            Selected
                          </>
                        ) : (
                          <>
                            <TrendingUp className="w-4 h-4 mr-2" />
                            Select Plan
                          </>
                        )}
                      </Button>
                    </motion.div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
