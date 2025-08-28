"use client";

import React, { useEffect } from "react";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useLoginPrompt } from "@/contexts/LoginPromptContext";
import { apiClient, handleApiError } from "@/config/api";
import ProductForm, { ProductFormData } from "@/components/product/ProductForm";
import { useRouter } from "next/navigation";

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
    queryKey: ["/api/categories"],
    queryFn: async () => {
      try {
        const response = await apiClient.get("/api/categories");
        return response.data;
      } catch (error) {
        throw new Error(handleApiError(error));
      }
    },
  });

  // Product creation mutation
  const createProductMutation = useMutation({
    mutationFn: async (productData: ProductFormData) => {
      try {
        const response = await apiClient.post("/api/products", {
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
        title: "Product created successfully!",
        description: `${product.name} has been submitted for approval.`,
      });
      router.push("/producer-dashboard");
    },
    onError: (error: any) => {
      toast({
        title: "Failed to create product",
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
        <ProductForm
          title="New Product"
          submitLabel="Create Product"
          initialValues={initialFormData}
          categories={(categories as any[]).map((c: any) => ({
            id: c.id,
            name: c.name,
          }))}
          loading={createProductMutation.isPending}
          onCancel={() => router.push("/producer-dashboard")}
          onSubmit={async (data) => {
            await createProductMutation.mutateAsync(data);
          }}
        />
      </div>
      </main>
    </ProtectedRoute>
  );
}

export default ProductRegistration;
