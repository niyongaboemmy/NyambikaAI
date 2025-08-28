"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { usePathname, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertCircle, CreditCard, Loader2 } from "lucide-react";
import { useProducerSubscriptionStatus } from "@/hooks/useProducerSubscriptionStatus";

interface SubscriptionStatus {
  hasActiveSubscription: boolean;
  subscriptionId?: string;
  status?: string;
  expiresAt?: string;
  message?: string;
}

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
  const { status: subscriptionStatus, loading } = useProducerSubscriptionStatus();
  const [showPrompt, setShowPrompt] = useState(false);

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
  }, [authLoading, isAuthenticated, user, pathname, router, subscriptionStatus?.hasActiveSubscription, loading]);

  const handleSubscriptionRedirect = () => {
    router.push("/producer-subscription");
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
        <Card className="w-full max-w-md mx-auto shadow-xl border-0 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
          <CardHeader className="text-center space-y-4">
            <div className="mx-auto w-16 h-16 bg-gradient-to-r from-orange-500 to-red-500 rounded-full flex items-center justify-center">
              <AlertCircle className="h-8 w-8 text-white" />
            </div>
            <CardTitle className="text-2xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
              Subscription Required
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="text-center space-y-2">
              <p className="text-gray-600 dark:text-gray-300">
                To access producer features and start selling your products, you
                need an active subscription plan.
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {subscriptionStatus?.message ||
                  "Please select a subscription plan to continue."}
              </p>
            </div>

            <div className="space-y-3">
              <Button
                onClick={handleSubscriptionRedirect}
                className="w-full bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 text-white"
                size="lg"
              >
                <CreditCard className="h-5 w-5 mr-2" />
                Choose Subscription Plan
              </Button>

              <Button
                onClick={handleDismiss}
                variant="outline"
                className="w-full"
                size="lg"
              >
                Continue Without Subscription
              </Button>
            </div>

            <div className="text-xs text-center text-gray-500 dark:text-gray-400">
              You can access limited features without a subscription, but full
              producer capabilities require an active plan.
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Render children normally for non-producers or producers with active subscriptions
  return <>{children}</>;
}
