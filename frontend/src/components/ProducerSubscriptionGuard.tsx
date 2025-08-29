"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { usePathname, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertCircle, CreditCard, Loader2, Sparkles, UserCheck } from "lucide-react";
import { useProducerSubscriptionStatus } from "@/hooks/useProducerSubscriptionStatus";
import SubscriptionPlanSelector from "./SubscriptionPlanSelector";
import { apiClient, API_ENDPOINTS } from "@/config/api";
import { useToast } from "@/hooks/use-toast";

interface ProducerSubscriptionGuardProps {
  children: React.ReactNode;
}

export function ProducerSubscriptionGuard({
  children,
}: ProducerSubscriptionGuardProps) {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [isChecking, setIsChecking] = useState(true);
  const { status: subscriptionStatus, loading } =
    useProducerSubscriptionStatus();
  const [showPrompt, setShowPrompt] = useState(false);
  const [selectedPlanId, setSelectedPlanId] = useState<string>("");
  const [selectedBillingCycle, setSelectedBillingCycle] = useState<"monthly" | "annual">("monthly");
  const [subscriptionLoading, setSubscriptionLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    // Only check for authenticated producers
    if (authLoading || !isAuthenticated || !user) {
      setIsChecking(false);
      return;
    }

    if (user.role !== "producer") {
      setIsChecking(false);
      return;
    }

    // Wait until hook finishes loading
    if (loading) return;

    try {
      const isOnSubscriptionPage = pathname === "/producer-subscription";
      if (!subscriptionStatus?.hasActiveSubscription) {
        if (!isOnSubscriptionPage) {
          router.push("/producer-subscription");
          return;
        }
        setShowPrompt(true);
      }
    } finally {
      setIsChecking(false);
    }
  }, [
    authLoading,
    isAuthenticated,
    user,
    pathname,
    router,
    subscriptionStatus?.hasActiveSubscription,
    loading,
  ]);

  const handlePlanSelect = (planId: string, billingCycle: "monthly" | "annual") => {
    setSelectedPlanId(planId);
    setSelectedBillingCycle(billingCycle);
  };

  const handleSubscriptionActivation = async () => {
    if (!selectedPlanId || !user) return;

    try {
      setSubscriptionLoading(true);
      
      // Create subscription for producer
      await apiClient.post("/api/producer/subscribe", {
        planId: selectedPlanId,
        billingCycle: selectedBillingCycle,
      });

      toast({
        title: "Success",
        description: "Subscription activated successfully!",
      });

      // Refresh the page to update subscription status
      window.location.reload();
    } catch (error: any) {
      console.error("Error activating subscription:", error);
      toast({
        title: "Subscription Failed",
        description: error?.response?.data?.message || "Failed to activate subscription",
        variant: "destructive",
      });
    } finally {
      setSubscriptionLoading(false);
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
  };

  // Show loading while checking
  if (authLoading || isChecking) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex items-center space-x-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Loading...</span>
        </div>
      </div>
    );
  }

  // Do not show the guard on the subscription selection page itself
  const isOnSubscriptionPage = pathname === "/producer-subscription";

  // Show subscription prompt for producers without active subscription, except on subscription page
  if (!isOnSubscriptionPage && showPrompt && user?.role === "producer") {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 -mt-12">
        <div className="w-full max-w-6xl mx-auto">
          <Card className="shadow-xl border-0 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
            <CardHeader className="text-center space-y-4">
              <div className="mx-auto w-16 h-16 bg-gradient-to-r from-orange-500 to-red-500 rounded-full flex items-center justify-center">
                <UserCheck className="h-8 w-8 text-white" />
              </div>
              <CardTitle className="text-2xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
                Activate Your Producer Account
              </CardTitle>
              <p className="text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
                To access producer features and start selling your products, please select a subscription plan below.
              </p>
            </CardHeader>
            
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold flex items-center justify-center gap-2">
                  <Sparkles className="w-5 h-5 text-purple-600" />
                  Choose Your Plan
                </h3>
                
                <SubscriptionPlanSelector
                  onPlanSelect={handlePlanSelect}
                  selectedPlanId={selectedPlanId}
                  selectedBillingCycle={selectedBillingCycle}
                  loading={subscriptionLoading}
                />
              </div>

              <div className="flex items-center justify-center gap-4 pt-4 border-t">
                <Button
                  onClick={handleDismiss}
                  variant="outline"
                  size="lg"
                  disabled={subscriptionLoading}
                >
                  Continue Without Subscription
                </Button>
                <Button
                  onClick={handleSubscriptionActivation}
                  disabled={subscriptionLoading || !selectedPlanId}
                  className="bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 text-white"
                  size="lg"
                >
                  {subscriptionLoading ? (
                    <>
                      <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                      Activating...
                    </>
                  ) : (
                    <>
                      <CreditCard className="h-5 w-5 mr-2" />
                      Activate Subscription
                    </>
                  )}
                </Button>
              </div>

              <div className="text-xs text-center text-gray-500 dark:text-gray-400">
                You can access limited features without a subscription, but full producer capabilities require an active plan.
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Render children normally for non-producers or producers with active subscriptions
  return <>{children}</>;
}
