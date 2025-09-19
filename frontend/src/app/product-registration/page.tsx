"use client";

import React, { useEffect, useMemo, useState } from "react";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useLoginPrompt } from "@/contexts/LoginPromptContext";
import { apiClient, handleApiError, API_ENDPOINTS } from "@/config/api";
import ProductForm, { ProductFormData } from "@/components/product/ProductForm";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/contexts/LanguageContext";

// Use ProductFormData from shared component

const initialFormData: ProductFormData = {
  name: "",
  nameRw: "",
  description: "",
  descriptionRw: "",
  price: "",
  categoryId: "",
  imageUrl: "",
  additionalImages: [],
  sizes: [],
  colors: [],
  stockQuantity: 0,
  material: "",
  materialRw: "",
  careInstructions: "",
  careInstructionsRw: "",
  tags: [],
  isCustomizable: false,
  customizationOptions: [],
};

// size/color presets are handled inside ProductForm

const commonTags = [
  "Traditional",
  "Modern",
  "Casual",
  "Formal",
  "Wedding",
  "Party",
  "Business",
  "Summer",
  "Winter",
  "Handmade",
  "Eco-friendly",
  "Luxury",
];

function ProductRegistration() {
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  const { open } = useLoginPrompt();
  const { t } = useLanguage();
  const [formKey, setFormKey] = useState(0);

  // Prompt login if unauthenticated; redirect home if not producer/admin
  useEffect(() => {
    if (!isAuthenticated) {
      open();
      return;
    }
    if (user?.role !== "producer" && user?.role !== "admin") {
      router.push("/");
      return;
    }
  }, [isAuthenticated, user, router, open]);

  // Fetch categories
  const { data: categories = [] } = useQuery({
    queryKey: [API_ENDPOINTS.CATEGORIES],
    queryFn: async () => {
      try {
        const response = await apiClient.get(API_ENDPOINTS.CATEGORIES);
        return response.data;
      } catch (error) {
        throw new Error(handleApiError(error));
      }
    },
  });

  // Fetch subscription status for current producer
  const { data: subStatus, isLoading: subLoading } = useQuery({
    queryKey: [API_ENDPOINTS.PRODUCER_SUBSCRIPTION_STATUS],
    queryFn: async () => {
      const resp = await apiClient.get(API_ENDPOINTS.PRODUCER_SUBSCRIPTION_STATUS);
      return resp.data as {
        hasActiveSubscription: boolean;
        planId?: string;
        status?: string;
      };
    },
    enabled: isAuthenticated && (user?.role === "producer" || user?.role === "admin"),
  });

  // Fetch all plans so we can read maxProducts
  const { data: plans = [], isLoading: plansLoading } = useQuery({
    queryKey: [API_ENDPOINTS.SUBSCRIPTION_PLANS],
    queryFn: async () => {
      const resp = await apiClient.get(API_ENDPOINTS.SUBSCRIPTION_PLANS);
      return resp.data as Array<{ id: string; name: string; maxProducts: number }>;
    },
  });

  const currentPlanMaxProducts = useMemo(() => {
    if (!subStatus?.hasActiveSubscription || !subStatus.planId) return 0; // 0 means unlimited in backend seed
    const plan = (plans as any[]).find((p) => p.id === subStatus.planId);
    if (!plan) return 0;
    const mp = (plan as any).maxProducts;
    const val = typeof mp === "number" ? mp : parseInt(String(mp || 0), 10) || 0;
    return val;
  }, [subStatus, plans]);

  // Fetch current products for this producer to compare against limit
  const { data: myProducts = [], isLoading: productsLoading } = useQuery({
    queryKey: [API_ENDPOINTS.PRODUCTS, { producerId: user?.id }],
    queryFn: async () => {
      if (!user?.id) return [] as any[];
      const resp = await apiClient.get(API_ENDPOINTS.PRODUCTS, {
        params: { producerId: user.id },
      });
      return resp.data as any[];
    },
    enabled: isAuthenticated && Boolean(user?.id) && (user?.role === "producer" || user?.role === "admin"),
  });

  // Product creation mutation
  const createProductMutation = useMutation({
    mutationFn: async (productData: ProductFormData) => {
      try {
        const response = await apiClient.post(API_ENDPOINTS.PRODUCTS, {
          ...productData,
          price: parseFloat(productData.price),
        });
        return response.data;
      } catch (error) {
        throw new Error(handleApiError(error));
      }
    },
    onSuccess: (product) => {
      toast({
        title: t("productCreatedTitle"),
        description: `${t("productCreatedDesc_prefix")}${product.name}${t("productCreatedDesc_suffix")}`,
      });
      // Instead of navigating away, clear the form by remounting it
      setFormKey((k) => k + 1);
    },
    onError: (error: any) => {
      toast({
        title: t("productCreateFailed"),
        description: error.message,
        variant: "destructive",
      });
    },
  });

  if (
    !isAuthenticated ||
    (user?.role !== "producer" && user?.role !== "admin")
  ) {
    return null;
  }

  return (
    <ProtectedRoute>
      <main className="pt-12 pb-16">
        <div className="max-w-4xl mx-auto">
          {/* Block UI while loading plan or products info */}
          {(subLoading || plansLoading || productsLoading) && (
            <div className="rounded-2xl border border-purple-200/20 bg-purple-500/10 p-6 text-purple-100">
              {t("loading")}
            </div>
          )}
          {/* Enforce: active subscription required for producers (admins can bypass form) */}
          {user?.role === "producer" && !subLoading && subStatus && !subStatus.hasActiveSubscription && (
            <div className="rounded-2xl border border-amber-200/20 bg-amber-500/10 p-6 text-amber-100 mb-6">
              <p className="font-semibold mb-1">{t("activeSubscriptionRequired")}</p>
              <p className="opacity-90">{t("needActiveSubscription")}</p>
              <button
                onClick={() => router.push("/producer-subscription")}
                className="mt-4 inline-flex items-center rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 px-4 py-2 text-white hover:opacity-90"
              >
                {t("manageSubscription")}
              </button>
            </div>
          )}

          {/* Enforce: max products limit for producers only (0 means unlimited) */}
          {user?.role === "producer" && !subLoading && !productsLoading && currentPlanMaxProducts > 0 && (myProducts as any[]).length >= currentPlanMaxProducts ? (
            <div className="rounded-2xl border border-red-200/20 bg-red-500/10 p-6 text-red-100">
              <p className="font-semibold mb-1">{t("productLimitReached")}</p>
              <p className="opacity-90">
                {t("planAllowsUpTo_prefix")} {currentPlanMaxProducts} {t("planAllowsUpTo_suffix")}
              </p>
              <div className="mt-4 flex gap-3">
                <button
                  onClick={() => router.push("/producer-subscription")}
                  className="inline-flex items-center rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 px-4 py-2 text-white hover:opacity-90"
                >
                  {t("upgradePlan")}
                </button>
                <button
                  onClick={() => router.push("/producer/dashboard")}
                  className="inline-flex items-center rounded-xl border border-white/20 px-4 py-2 text-white/90 hover:bg-white/10"
                >
                  {t("goToDashboard")}
                </button>
              </div>
            </div>
          ) : (
          <ProductForm
            key={formKey}
            title={t("newProduct")}
            submitLabel={t("createProduct")}
            initialValues={initialFormData}
            categories={(categories as any[]).map((c: any) => ({
              id: c.id,
              name: c.name,
            }))}
            loading={createProductMutation.isPending}
            onCancel={() => router.push("/producer-orders")}
            onSubmit={async (data) => {
              await createProductMutation.mutateAsync(data);
            }}
          />
          )}
        </div>
      </main>
    </ProtectedRoute>
  );
}

export default ProductRegistration;
