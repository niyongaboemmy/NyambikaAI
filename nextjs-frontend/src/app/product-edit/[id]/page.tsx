"use client";

import React, { useEffect, useMemo } from "react";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQuery } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { useLoginPrompt } from "@/contexts/LoginPromptContext";
import ProductForm, { ProductFormData } from "@/components/product/ProductForm";
import { ArrowLeft } from "lucide-react";
import { useRouter, useParams } from "next/navigation";
import { apiClient, handleApiError } from "@/config/api";

// Use shared ProductFormData type

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

// Size/color UI now handled inside ProductForm

function ProductEdit() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  const params = useParams();
  const productId = useMemo(() => (params?.id as string) || "", [params]);
  const { open } = useLoginPrompt();

  // Prompt login or redirect based on auth/role (after auth finished loading)
  useEffect(() => {
    if (isLoading) return; // wait until auth is resolved
    if (!isAuthenticated) {
      open();
      return;
    }
    if (user?.role !== "producer" && user?.role !== "admin") {
      router.push("/");
      return;
    }
  }, [isLoading, isAuthenticated, user, router, open]);

  // Fetch categories is declared below (single source)

  // Load product details
  const { data: loadedProduct, isLoading: loadingProduct } = useQuery({
    queryKey: ["product", productId],
    enabled: !!productId,
    queryFn: async () => {
      try {
        const response = await apiClient.get(`/api/products/${productId}`);
        return response.data;
      } catch (error) {
        throw new Error(handleApiError(error));
      }
    },
  });

  // Fetch categories for select options
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

  const updateProductMutation = useMutation({
    mutationFn: async (productData: ProductFormData) => {
      try {
        const response = await apiClient.put(`/api/products/${productId}`, {
          ...productData,
          price: productData.price,
        });
        return response.data;
      } catch (error) {
        throw new Error(handleApiError(error));
      }
    },
    onSuccess: (product) => {
      // Optimistically update and invalidate caches so detail shows fresh data
      queryClient.setQueryData(["product", productId], (prev: any) => ({
        ...(prev || {}),
        ...product,
      }));
      queryClient.invalidateQueries({ queryKey: ["product", productId] });
      // Optionally invalidate generic product lists
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      toast({
        title: "Product updated successfully!",
        description: `${product.name} has been updated.`,
      });
      router.push(`/product/${productId}`);
    },
    onError: (error: any) => {
      toast({
        title: "Failed to update product",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Move useMemo outside of conditional rendering to fix hooks order
  const initialValues = useMemo(() => {
    const cached: any = queryClient.getQueryData(["product", productId]);
    const p: any = loadedProduct || cached;
    if (!p) return initialFormData;
    return {
      name: p.name || "",
      nameRw: p.nameRw || "",
      description: p.description || "",
      descriptionRw: p.descriptionRw || "",
      price: typeof p.price === "number" ? String(p.price) : p.price || "",
      categoryId: p.categoryId || "",
      imageUrl: p.imageUrl || "",
      additionalImages: Array.isArray(p.additionalImages)
        ? p.additionalImages
        : [],
      sizes: Array.isArray(p.sizes) ? p.sizes : [],
      colors: Array.isArray(p.colors) ? p.colors : [],
      stockQuantity:
        typeof p.stockQuantity === "number"
          ? p.stockQuantity
          : Number(p.stockQuantity || 0),
      material: p.material || "",
      materialRw: p.materialRw || "",
      careInstructions: p.careInstructions || "",
      careInstructionsRw: p.careInstructionsRw || "",
      tags: Array.isArray(p.tags) ? p.tags : [],
      isCustomizable: Boolean(p.isCustomizable),
      customizationOptions: Array.isArray(p.customizationOptions)
        ? p.customizationOptions
        : [],
    } as ProductFormData;
  }, [loadedProduct, productId]);

  if (isLoading) return null;
  if (!isAuthenticated || (user?.role !== "producer" && user?.role !== "admin"))
    return null;

  return (
    <ProtectedRoute>
      <main className="pt-12 pb-16">
        <div className="max-w-4xl mx-auto">
          {/* Back to details */}
          <div className="mb-2">
            <Button
              type="button"
              variant="secondary"
              onClick={() => router.push(`/product/${productId}`)}
              className="bg-white dark:bg-gray-900 dark:hover:bg-gray-800 flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to details
            </Button>
          </div>

          <ProductForm
            title="Edit Product Details"
            submitLabel="Save Changes"
            initialValues={initialValues}
            categories={(categories as any[]).map((c: any) => ({
              id: c.id,
              name: c.name,
            }))}
            loading={updateProductMutation.isPending || loadingProduct}
            onCancel={() => router.push(`/product/${productId}`)}
            onSubmit={async (data) => {
              await updateProductMutation.mutateAsync(data);
            }}
          />
          <Button
            type="button"
            variant="secondary"
            onClick={() => router.push(`/product/${productId}`)}
            className="bg-white dark:bg-gray-900 dark:hover:bg-gray-800 flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to details
          </Button>
        </div>

        <ProductForm
          title="Edit Product Details"
          submitLabel="Save Changes"
          initialValues={initialValues}
          categories={(categories as any[]).map((c: any) => ({
            id: c.id,
            name: c.name,
          }))}
          loading={updateProductMutation.isPending || loadingProduct}
          onCancel={() => router.push(`/product/${productId}`)}
          onSubmit={async (data) => {
            await updateProductMutation.mutateAsync(data);
          }}
        />
      </main>
    </ProtectedRoute>
  );
}

export default ProductEdit;
