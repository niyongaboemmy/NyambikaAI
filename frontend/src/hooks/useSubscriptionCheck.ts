import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { useProducerSubscriptionStatus } from "@/hooks/useProducerSubscriptionStatus";

interface SubscriptionStatus {
  hasActiveSubscription: boolean;
  subscriptionId?: string;
  status?: string;
  expiresAt?: string;
}

export function useSubscriptionCheck() {
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();
  const [isChecking, setIsChecking] = useState(false);
  const { status: subscriptionStatus, loading } = useProducerSubscriptionStatus();

  useEffect(() => {
    const checkSubscription = async () => {
      // Only check for producers
      if (!isAuthenticated || !user || user.role !== "producer") {
        return;
      }

      setIsChecking(true);
      try {
        if (!loading && !subscriptionStatus?.hasActiveSubscription) {
          router.push("/producer-subscription");
        }
      } finally {
        setIsChecking(false);
      }
    };

    // Add a small delay to ensure the auth context is fully loaded
    const timeoutId = setTimeout(checkSubscription, 500);

    return () => clearTimeout(timeoutId);
  }, [isAuthenticated, user, router, loading, subscriptionStatus?.hasActiveSubscription]);

  return {
    isChecking,
    subscriptionStatus,
    hasActiveSubscription: subscriptionStatus?.hasActiveSubscription || false,
  };
}
