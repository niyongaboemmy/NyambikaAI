"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { Check, Sparkles, Zap, Crown, ArrowRight, Loader2 } from "lucide-react";

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
}

interface UserSubscription {
  subscription: {
    id: string;
    status: string;
    billingCycle: string;
    endDate: string;
  };
  plan: SubscriptionPlan;
}

export default function SubscriptionPage() {
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [currentSubscription, setCurrentSubscription] =
    useState<UserSubscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [subscribing, setSubscribing] = useState<string | null>(null);
  const [billingCycle, setBillingCycle] = useState<"monthly" | "annual">(
    "monthly"
  );

  useEffect(() => {
    fetchPlans();
    if (user?.id) {
      fetchCurrentSubscription();
    }
  }, [isAuthenticated, user]);

  const fetchPlans = async () => {
    try {
      const response = await fetch("/api/subscription-plans");
      if (response.ok) {
        const data = await response.json();
        const normalized = Array.isArray(data)
          ? data.map((p: any) => ({
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
      }
    } catch (error) {
      console.error("Error fetching plans:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCurrentSubscription = async () => {
    try {
      const response = await fetch(`/api/subscriptions/user/${user?.id}`);
      if (response.ok) {
        const data = await response.json();
        setCurrentSubscription(data);
      }
    } catch (error) {
      console.error("Error fetching current subscription:", error);
    }
  };

  const handleSubscribe = async (planId: string) => {
    if (!isAuthenticated || !user?.id) {
      router.push("/auth/signin");
      return;
    }

    setSubscribing(planId);

    try {
      const plan = plans.find((p) => p.id === planId);
      if (!plan) return;

      const amount =
        billingCycle === "monthly" ? plan.monthlyPrice : plan.annualPrice;

      const response = await fetch("/api/subscriptions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: user?.id,
          planId,
          billingCycle,
          amount,
          status: "pending",
        }),
      });

      if (response.ok) {
        const subscription = await response.json();
        // Redirect to payment page
        router.push(`/subscription/payment/${subscription.id}`);
      } else {
        throw new Error("Failed to create subscription");
      }
    } catch (error) {
      console.error("Error creating subscription:", error);
      alert("Failed to create subscription. Please try again.");
    } finally {
      setSubscribing(null);
    }
  };

  const getPlanIcon = (planName: string) => {
    switch (planName.toLowerCase()) {
      case "starter":
        return <Sparkles className="h-8 w-8" />;
      case "professional":
        return <Zap className="h-8 w-8" />;
      case "enterprise":
        return <Crown className="h-8 w-8" />;
      default:
        return <Sparkles className="h-8 w-8" />;
    }
  };

  const getPlanGradient = (planName: string) => {
    switch (planName.toLowerCase()) {
      case "starter":
        return "from-blue-500 to-cyan-500";
      case "professional":
        return "from-purple-500 to-blue-500";
      case "enterprise":
        return "from-orange-500 to-red-500";
      default:
        return "from-blue-500 to-cyan-500";
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-purple-400 mx-auto mb-4" />
          <p className="text-white">Loading subscription plans...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-cyan-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute top-40 left-40 w-80 h-80 bg-blue-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000"></div>
      </div>

      <div className="relative z-10 container mx-auto px-4 py-16">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center justify-center p-2 bg-purple-500/20 rounded-full mb-6">
            <Sparkles className="h-8 w-8 text-purple-400" />
          </div>
          <h1 className="text-5xl font-bold text-white mb-6">
            Choose Your
            <span className="bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">
              {" "}
              AI-Powered{" "}
            </span>
            Plan
          </h1>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            Unlock the full potential of your fashion business with our
            AI-driven subscription plans
          </p>
        </div>

        {/* Current Subscription Banner */}
        {currentSubscription && (
          <div className="mb-12 p-6 bg-gradient-to-r from-green-500/20 to-emerald-500/20 border border-green-500/30 rounded-2xl backdrop-blur-xl">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-semibold text-white mb-2">
                  Current Plan: {currentSubscription.plan.name}
                </h3>
                <p className="text-gray-300">
                  Status: {currentSubscription.subscription.status} • Expires:{" "}
                  {new Date(
                    currentSubscription.subscription.endDate
                  ).toLocaleDateString()}
                </p>
              </div>
              <button
                onClick={() => router.push("/subscription/manage")}
                className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-all duration-300"
              >
                Manage Plan
              </button>
            </div>
          </div>
        )}

        {/* Billing Toggle */}
        <div className="flex justify-center mb-12">
          <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-2 border border-white/20">
            <div className="flex">
              <button
                onClick={() => setBillingCycle("monthly")}
                className={`px-6 py-3 rounded-xl transition-all duration-300 ${
                  billingCycle === "monthly"
                    ? "bg-purple-500 text-white shadow-lg"
                    : "text-gray-300 hover:text-white"
                }`}
              >
                Monthly
              </button>
              <button
                onClick={() => setBillingCycle("annual")}
                className={`px-6 py-3 rounded-xl transition-all duration-300 relative ${
                  billingCycle === "annual"
                    ? "bg-purple-500 text-white shadow-lg"
                    : "text-gray-300 hover:text-white"
                }`}
              >
                Annual
                <span className="absolute -top-2 -right-2 bg-green-500 text-white text-xs px-2 py-1 rounded-full">
                  Save 17%
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* Subscription Plans */}
        <div className="grid md:grid-cols-3 gap-8 max-w-7xl mx-auto">
          {plans.map((plan, index) => {
            const isPopular = plan.name.toLowerCase() === "professional";
            const price =
              billingCycle === "monthly" ? plan.monthlyPrice : plan.annualPrice;
            const isCurrentPlan = currentSubscription?.plan.id === plan.id;

            return (
              <div
                key={plan.id}
                className={`relative group ${
                  isPopular ? "scale-105 z-10" : ""
                }`}
              >
                {isPopular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 z-20">
                    <div className="bg-gradient-to-r from-purple-500 to-blue-500 text-white px-6 py-2 rounded-full text-sm font-semibold">
                      Most Popular
                    </div>
                  </div>
                )}

                <div
                  className={`h-full p-8 rounded-3xl backdrop-blur-xl border transition-all duration-500 group-hover:scale-105 ${
                    isPopular
                      ? "bg-gradient-to-br from-purple-500/20 to-blue-500/20 border-purple-500/50 shadow-2xl shadow-purple-500/25"
                      : "bg-white/5 border-white/10 hover:border-white/20"
                  }`}
                >
                  {/* Plan Icon */}
                  <div
                    className={`inline-flex p-3 rounded-2xl bg-gradient-to-r ${getPlanGradient(
                      plan.name
                    )} mb-6`}
                  >
                    {getPlanIcon(plan.name)}
                  </div>

                  {/* Plan Name & Price */}
                  <h3 className="text-2xl font-bold text-white mb-2">
                    {plan.name}
                  </h3>
                  <p className="text-gray-300 mb-6">{plan.description}</p>

                  <div className="mb-8">
                    <div className="flex items-baseline">
                      <span className="text-4xl font-bold text-white">
                        {parseInt(price).toLocaleString()} RWF
                      </span>
                      <span className="text-gray-400 ml-2">
                        /{billingCycle === "monthly" ? "month" : "year"}
                      </span>
                    </div>
                    {billingCycle === "annual" && (
                      <p className="text-sm text-green-400 mt-1">
                        Save{" "}
                        {Math.round(
                          (1 -
                            parseFloat(plan.annualPrice) /
                              12 /
                              parseFloat(plan.monthlyPrice)) *
                            100
                        )}
                        % annually
                      </p>
                    )}
                  </div>

                  {/* Features */}
                  <ul className="space-y-4 mb-8">
                    {(Array.isArray(plan.features) ? plan.features : []).map(
                      (feature, featureIndex) => (
                        <li key={featureIndex} className="flex items-start">
                          <Check className="h-5 w-5 text-green-400 mr-3 mt-0.5 flex-shrink-0" />
                          <span className="text-gray-300">{feature}</span>
                        </li>
                      )
                    )}
                  </ul>

                  {/* CTA Button */}
                  <button
                    onClick={() => handleSubscribe(plan.id)}
                    disabled={subscribing === plan.id || isCurrentPlan}
                    className={`w-full py-4 px-6 rounded-2xl font-semibold transition-all duration-300 flex items-center justify-center ${
                      isCurrentPlan
                        ? "bg-green-500/20 text-green-400 cursor-not-allowed"
                        : isPopular
                        ? "bg-gradient-to-r from-purple-500 to-blue-500 text-white hover:shadow-lg hover:shadow-purple-500/25"
                        : "bg-white/10 text-white hover:bg-white/20"
                    }`}
                  >
                    {subscribing === plan.id ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : isCurrentPlan ? (
                      "Current Plan"
                    ) : (
                      <>
                        Get Started
                        <ArrowRight className="h-5 w-5 ml-2" />
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Features Comparison */}
        <div className="mt-20 text-center">
          <h2 className="text-3xl font-bold text-white mb-8">
            All Plans Include
          </h2>
          <div className="grid md:grid-cols-4 gap-6 max-w-4xl mx-auto">
            {[
              {
                icon: "🤖",
                title: "AI Try-On Technology",
                desc: "Advanced virtual fitting",
              },
              {
                icon: "📱",
                title: "Mobile Payments",
                desc: "MTN & Airtel Money",
              },
              {
                icon: "🛡️",
                title: "Secure Platform",
                desc: "Enterprise-grade security",
              },
              {
                icon: "🌍",
                title: "Multi-language",
                desc: "English, Kinyarwanda, French",
              },
            ].map((feature, index) => (
              <div
                key={index}
                className="p-6 bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10"
              >
                <div className="text-3xl mb-3">{feature.icon}</div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  {feature.title}
                </h3>
                <p className="text-gray-400 text-sm">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
