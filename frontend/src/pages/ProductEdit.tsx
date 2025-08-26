import React, { useEffect, useMemo } from "react";
import { useLocation, useRoute } from "wouter";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQuery } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { useLoginPrompt } from "@/contexts/LoginPromptContext";
import ProductForm, { ProductFormData } from "@/components/product/ProductForm";
import { ArrowLeft } from "lucide-react";

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

export default function ProductEdit() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [, params] = useRoute("/product-edit/:id");
  const productId = useMemo(() => params?.id || "", [params]);
  const { open } = useLoginPrompt();

  // Prompt login or redirect based on auth/role (after auth finished loading)
  useEffect(() => {
    if (isLoading) return; // wait until auth is resolved
    if (!isAuthenticated) {
      open();
      return;
    }
    if (user?.role !== "producer" && user?.role !== "admin") {
      setLocation("/");
      return;
    }
  }, [isLoading, isAuthenticated, user, setLocation, open]);

  // Fetch categories is declared below (single source)

  // Load product details
  const { data: loadedProduct, isLoading: loadingProduct } = useQuery({
    queryKey: ["product", productId],
    enabled: !!productId,
    queryFn: async () => {
      const token = localStorage.getItem("auth_token");
      const res = await fetch(`/api/products/${productId}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });
      if (!res.ok) throw new Error("Failed to load product");
      return res.json();
    },
  });

  // Fetch categories for select options
  const { data: categories = [] } = useQuery({
    queryKey: ["/api/categories"],
    queryFn: async () => {
      const response = await fetch("/api/categories");
      if (!response.ok) throw new Error("Failed to fetch categories");
      return response.json();
    },
  });

  const updateProductMutation = useMutation({
    mutationFn: async (productData: ProductFormData) => {
      const token = localStorage.getItem("auth_token");
      const res = await fetch(`/api/products/${productId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...productData,
          // Backend expects decimal as string; keep price as string
          price: productData.price,
        }),
      });
      if (!res.ok) {
        let message = "Failed to update product";
        try {
          const err = await res.json();
          message = err.message || message;
        } catch {}
        throw new Error(message);
      }
      return res.json();
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
      setLocation(`/product/${productId}`);
    },
    onError: (error: any) => {
      toast({
        title: "Failed to update product",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  if (isLoading) return null;
  if (!isAuthenticated || (user?.role !== "producer" && user?.role !== "admin"))
    return null;

  return (
    <main className="pt-10 pb-12">
      <div className="max-w-4xl mx-auto">
        {/* Back to details */}
        <div className="mb-2">
          <Button
            type="button"
            variant="secondary"
            onClick={() => setLocation(`/product/${productId}`)}
            className="bg-white dark:bg-gray-900 dark:hover:bg-gray-800 flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to details
          </Button>
        </div>

        <ProductForm
          title="Edit Product Details"
          submitLabel="Save Changes"
          initialValues={useMemo(() => {
            const cached: any = queryClient.getQueryData([
              "product",
              productId,
            ]);
            const p: any = loadedProduct || cached;
            if (!p) return initialFormData;
            return {
              name: p.name || "",
              nameRw: p.nameRw || "",
              description: p.description || "",
              descriptionRw: p.descriptionRw || "",
              price:
                typeof p.price === "number" ? String(p.price) : p.price || "",
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
          }, [loadedProduct, productId])}
          categories={(categories as any[]).map((c: any) => ({
            id: c.id,
            name: c.name,
          }))}
          loading={updateProductMutation.isPending || loadingProduct}
          onCancel={() => setLocation(`/product/${productId}`)}
          onSubmit={async (data) => {
            await updateProductMutation.mutateAsync(data);
          }}
        />
      </div>
    </main>
  );
}
