import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/config/api";

export interface SubscriptionStatus {
  hasActiveSubscription: boolean;
  subscriptionId?: string;
  status?: string;
  expiresAt?: string;
  planId?: string;
  message?: string;
}

export interface SubscriptionPlan {
  id: string;
  name: string;
  description: string;
  monthlyPrice: string;
  annualPrice: string;
  features: string[];
  maxProducts: number;
  maxOrders: number;
}

export function useProducerSubscriptionStatus() {
  const { user, isAuthenticated } = useAuth();

  const enabled = !!isAuthenticated && !!user && user.role === "producer";

  const statusQuery = useQuery<SubscriptionStatus>({
    queryKey: ["producer-subscription-status", user?.id],
    queryFn: async () => {
      const { data } = await apiClient.get<SubscriptionStatus>(
        "/api/producer/subscription-status"
      );
      return data;
    },
    enabled,
    staleTime: 1000 * 60, // 1 minute
    gcTime: 1000 * 60 * 5, // 5 minutes cache
    retry: 1,
  });

  const planQuery = useQuery<SubscriptionPlan | null>({
    queryKey: [
      "subscription-plan",
      statusQuery.data?.planId || null,
    ],
    queryFn: async () => {
      if (!statusQuery.data?.planId) return null;
      const { data } = await apiClient.get<SubscriptionPlan>(
        `/api/subscription-plans/${statusQuery.data.planId}`
      );
      return data as any;
    },
    enabled: enabled && !!statusQuery.data?.planId,
    staleTime: 1000 * 60,
    gcTime: 1000 * 60 * 5,
    retry: 1,
  });

  return {
    status: statusQuery.data || null,
    plan: planQuery.data || null,
    loading: statusQuery.isLoading || planQuery.isLoading,
    error:
      (statusQuery.error as any)?.message ||
      (planQuery.error as any)?.message ||
      null,
    refetch: async () => {
      await statusQuery.refetch();
      await planQuery.refetch();
    },
  };
}
