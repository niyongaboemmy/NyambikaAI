"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import {
  Calendar,
  AlertTriangle,
  CheckCircle,
  RefreshCw,
  X,
  Crown,
  Zap,
  Sparkles,
} from "lucide-react";

interface CurrentSubscription {
  id: string;
  planId: string;
  planName: string;
  status: string;
  billingCycle: string;
  startDate: string;
  endDate: string;
  amount: string;
  autoRenew: boolean;
}

interface SubscriptionPlan {
  id: string;
  name: string;
  description: string;
  monthlyPrice: string;
  annualPrice: string;
  features: string[];
}

export default function SubscriptionManagePage() {
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();
  const [currentSubscription, setCurrentSubscription] =
    useState<CurrentSubscription | null>(null);
  const [availablePlans, setAvailablePlans] = useState<SubscriptionPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [showUpgradeDialog, setShowUpgradeDialog] = useState(false);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    if (!isAuthenticated || !user?.id) {
      fetchSubscriptionData();
    }
  }, [isAuthenticated, user]);

  const fetchSubscriptionData = async () => {
    try {
      // Fetch current subscription
      const subResponse = await fetch(`/api/subscriptions/user/${user?.id}`);
      if (subResponse.ok) {
        const subData = await subResponse.json();
        setCurrentSubscription({
          id: subData.subscription.id,
          planId: subData.subscription.planId,
          planName: subData.plan.name,
          status: subData.subscription.status,
          billingCycle: subData.subscription.billingCycle,
          startDate: subData.subscription.startDate,
          endDate: subData.subscription.endDate,
          amount: subData.subscription.amount,
          autoRenew: subData.subscription.autoRenew,
        });
      }

      // Fetch available plans
      const plansResponse = await fetch("/api/subscription-plans");
      if (plansResponse.ok) {
        const plansData = await plansResponse.json();
        setAvailablePlans(plansData);
      }
    } catch (error) {
      console.error("Error fetching subscription data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelSubscription = async () => {
    if (!currentSubscription) return;

    setProcessing(true);
    try {
      const response = await fetch(
        `/api/subscriptions/${currentSubscription.id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: "cancelled", autoRenew: false }),
        }
      );

      if (response.ok) {
        setCurrentSubscription((prev) =>
          prev ? { ...prev, status: "cancelled", autoRenew: false } : null
        );
        setShowCancelDialog(false);
      } else {
        throw new Error("Failed to cancel subscription");
      }
    } catch (error) {
      console.error("Error cancelling subscription:", error);
      alert("Failed to cancel subscription. Please try again.");
    } finally {
      setProcessing(false);
    }
  };

  const handleUpgradePlan = async (
    newPlan: SubscriptionPlan,
    billingCycle: "monthly" | "annual"
  ) => {
    if (!currentSubscription) return;

    setProcessing(true);
    try {
      const amount =
        billingCycle === "monthly" ? newPlan.monthlyPrice : newPlan.annualPrice;

      // In production, this would handle prorated billing and payment processing
      const response = await fetch(
        `/api/subscriptions/${currentSubscription.id}/upgrade`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            newPlanId: newPlan.id,
            billingCycle,
            amount,
          }),
        }
      );

      if (response.ok) {
        // Redirect to payment page for upgrade
        router.push(
          `/subscription/payment/${currentSubscription.id}?upgrade=true`
        );
      } else {
        throw new Error("Failed to upgrade subscription");
      }
    } catch (error) {
      console.error("Error upgrading subscription:", error);
      alert("Failed to upgrade subscription. Please try again.");
    } finally {
      setProcessing(false);
    }
  };

  const toggleAutoRenew = async () => {
    if (!currentSubscription) return;

    try {
      const response = await fetch(
        `/api/subscriptions/${currentSubscription.id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ autoRenew: !currentSubscription.autoRenew }),
        }
      );

      if (response.ok) {
        setCurrentSubscription((prev) =>
          prev ? { ...prev, autoRenew: !prev.autoRenew } : null
        );
      }
    } catch (error) {
      console.error("Error updating auto-renew:", error);
    }
  };

  const getPlanIcon = (planName: string) => {
    switch (planName.toLowerCase()) {
      case "starter":
        return <Sparkles className="h-6 w-6 text-blue-400" />;
      case "professional":
        return <Zap className="h-6 w-6 text-purple-400" />;
      case "enterprise":
        return <Crown className="h-6 w-6 text-orange-400" />;
      default:
        return <Sparkles className="h-6 w-6 text-gray-400" />;
    }
  };

  const getDaysUntilExpiry = () => {
    if (!currentSubscription) return 0;
    const endDate = new Date(currentSubscription.endDate);
    const now = new Date();
    return Math.ceil(
      (endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    );
  };

  const isExpiringSoon = () => {
    const days = getDaysUntilExpiry();
    return days <= 7 && days > 0;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-400 mx-auto mb-4"></div>
          <p className="text-white">Loading subscription details...</p>
        </div>
      </div>
    );
  }

  if (!currentSubscription) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center max-w-md">
          <AlertTriangle className="h-16 w-16 text-orange-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-white mb-4">
            No Active Subscription
          </h1>
          <p className="text-gray-300 mb-6">
            You don't have an active subscription. Choose a plan to get started.
          </p>
          <button
            onClick={() => router.push("/subscription")}
            className="px-6 py-3 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-xl hover:shadow-lg transition-all duration-300"
          >
            Choose a Plan
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Animated background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-cyan-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
      </div>

      <div className="relative z-10 container mx-auto px-4 py-16">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-white mb-4">
            Manage Subscription
          </h1>
          <p className="text-gray-300">
            Control your subscription settings and billing
          </p>
        </div>

        {/* Current Subscription Card */}
        <div className="max-w-4xl mx-auto mb-12">
          <div className="bg-white/10 backdrop-blur-xl rounded-3xl border border-white/20 p-8">
            <div className="flex items-start justify-between mb-6">
              <div className="flex items-center gap-4">
                {getPlanIcon(currentSubscription.planName)}
                <div>
                  <h2 className="text-2xl font-bold text-white">
                    {currentSubscription.planName} Plan
                  </h2>
                  <p className="text-gray-300">
                    {currentSubscription.billingCycle === "monthly"
                      ? "Monthly"
                      : "Annual"}{" "}
                    billing
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-3xl font-bold text-white">
                  {parseInt(currentSubscription.amount).toLocaleString()} RWF
                </p>
                <p className="text-gray-400">
                  per{" "}
                  {currentSubscription.billingCycle === "monthly"
                    ? "month"
                    : "year"}
                </p>
              </div>
            </div>

            {/* Status and Expiry */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              <div className="text-center p-4 bg-white/5 rounded-xl">
                <div className="flex items-center justify-center mb-2">
                  {currentSubscription.status === "active" ? (
                    <CheckCircle className="h-6 w-6 text-green-400" />
                  ) : (
                    <AlertTriangle className="h-6 w-6 text-orange-400" />
                  )}
                </div>
                <p className="text-white font-semibold capitalize">
                  {currentSubscription.status}
                </p>
                <p className="text-gray-400 text-sm">Status</p>
              </div>

              <div className="text-center p-4 bg-white/5 rounded-xl">
                <Calendar className="h-6 w-6 text-blue-400 mx-auto mb-2" />
                <p className="text-white font-semibold">
                  {new Date(currentSubscription.endDate).toLocaleDateString()}
                </p>
                <p className="text-gray-400 text-sm">
                  {isExpiringSoon()
                    ? `Expires in ${getDaysUntilExpiry()} days`
                    : "Next billing"}
                </p>
              </div>

              <div className="text-center p-4 bg-white/5 rounded-xl">
                <RefreshCw className="h-6 w-6 text-purple-400 mx-auto mb-2" />
                <p className="text-white font-semibold">
                  {currentSubscription.autoRenew ? "Enabled" : "Disabled"}
                </p>
                <p className="text-gray-400 text-sm">Auto-renewal</p>
              </div>
            </div>

            {/* Expiry Warning */}
            {isExpiringSoon() && (
              <div className="mb-6 p-4 bg-orange-500/10 border border-orange-500/30 rounded-xl">
                <div className="flex items-start">
                  <AlertTriangle className="h-5 w-5 text-orange-400 mr-3 mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="text-orange-300 font-medium mb-1">
                      Subscription Expiring Soon
                    </h4>
                    <p className="text-orange-200 text-sm">
                      Your subscription expires in {getDaysUntilExpiry()} days.
                      {!currentSubscription.autoRenew &&
                        " Enable auto-renewal or renew manually to avoid service interruption."}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-4">
              <button
                onClick={toggleAutoRenew}
                className="px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-xl transition-colors"
              >
                {currentSubscription.autoRenew ? "Disable" : "Enable"}{" "}
                Auto-Renewal
              </button>

              <button
                onClick={() => setShowUpgradeDialog(true)}
                className="px-6 py-3 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-xl hover:shadow-lg transition-all duration-300"
              >
                Upgrade Plan
              </button>

              {currentSubscription.status === "active" && (
                <button
                  onClick={() => setShowCancelDialog(true)}
                  className="px-6 py-3 bg-red-500 hover:bg-red-600 text-white rounded-xl transition-colors"
                >
                  Cancel Subscription
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Cancel Subscription Dialog */}
        {showCancelDialog && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-slate-900 rounded-2xl border border-white/20 p-6 max-w-md w-full">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-semibold text-white">
                  Cancel Subscription
                </h3>
                <button
                  onClick={() => setShowCancelDialog(false)}
                  className="text-gray-400 hover:text-white"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="mb-6">
                <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl mb-4">
                  <AlertTriangle className="h-5 w-5 text-red-400 mb-2" />
                  <p className="text-red-300 text-sm">
                    Cancelling your subscription will disable all premium
                    features at the end of your current billing period.
                  </p>
                </div>

                <p className="text-gray-300 text-sm">
                  Your subscription will remain active until{" "}
                  {new Date(currentSubscription.endDate).toLocaleDateString()}.
                  After that, you'll lose access to:
                </p>
                <ul className="text-gray-400 text-sm mt-2 space-y-1">
                  <li>• Advanced analytics</li>
                  <li>• Priority support</li>
                  <li>• Custom branding</li>
                  <li>• Unlimited products</li>
                </ul>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowCancelDialog(false)}
                  className="flex-1 py-3 bg-gray-600 text-white rounded-xl hover:bg-gray-700 transition-colors"
                >
                  Keep Subscription
                </button>
                <button
                  onClick={handleCancelSubscription}
                  disabled={processing}
                  className="flex-1 py-3 bg-red-500 text-white rounded-xl hover:bg-red-600 transition-colors disabled:opacity-50"
                >
                  {processing ? "Cancelling..." : "Cancel Subscription"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Upgrade Plan Dialog */}
        {showUpgradeDialog && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-slate-900 rounded-2xl border border-white/20 p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-semibold text-white">
                  Upgrade Your Plan
                </h3>
                <button
                  onClick={() => setShowUpgradeDialog(false)}
                  className="text-gray-400 hover:text-white"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {availablePlans
                  .filter((plan) => plan.id !== currentSubscription.planId)
                  .map((plan) => (
                    <div
                      key={plan.id}
                      className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 p-6 hover:bg-white/15 transition-all duration-300"
                    >
                      <div className="flex items-center gap-3 mb-4">
                        {getPlanIcon(plan.name)}
                        <h4 className="text-xl font-semibold text-white">
                          {plan.name}
                        </h4>
                      </div>

                      <p className="text-gray-300 text-sm mb-4">
                        {plan.description}
                      </p>

                      <div className="mb-6">
                        <div className="flex items-baseline mb-2">
                          <span className="text-2xl font-bold text-white">
                            {parseInt(plan.monthlyPrice).toLocaleString()} RWF
                          </span>
                          <span className="text-gray-400 ml-2">/month</span>
                        </div>
                        <div className="flex items-baseline">
                          <span className="text-lg font-semibold text-green-400">
                            {parseInt(plan.annualPrice).toLocaleString()} RWF
                          </span>
                          <span className="text-gray-400 ml-2">/year</span>
                          <span className="text-green-400 text-xs ml-2">
                            Save 17%
                          </span>
                        </div>
                      </div>

                      <ul className="space-y-2 mb-6">
                        {plan.features.slice(0, 4).map((feature, index) => (
                          <li
                            key={index}
                            className="flex items-start text-sm text-gray-300"
                          >
                            <CheckCircle className="h-4 w-4 text-green-400 mr-2 mt-0.5 flex-shrink-0" />
                            {feature}
                          </li>
                        ))}
                      </ul>

                      <div className="space-y-2">
                        <button
                          onClick={() => handleUpgradePlan(plan, "monthly")}
                          disabled={processing}
                          className="w-full py-2 bg-white/10 text-white rounded-xl hover:bg-white/20 transition-colors text-sm disabled:opacity-50"
                        >
                          Upgrade Monthly
                        </button>
                        <button
                          onClick={() => handleUpgradePlan(plan, "annual")}
                          disabled={processing}
                          className="w-full py-2 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-xl hover:shadow-lg transition-all duration-300 text-sm disabled:opacity-50"
                        >
                          Upgrade Annual
                        </button>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
