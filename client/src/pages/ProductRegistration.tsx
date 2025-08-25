import React, { useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useLoginPrompt } from "@/contexts/LoginPromptContext";
import ProductForm, { ProductFormData } from "@/components/product/ProductForm";

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

export default function ProductRegistration() {
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const { open } = useLoginPrompt();

  // Prompt login if unauthenticated; redirect home if not producer/admin
  useEffect(() => {
    if (!isAuthenticated) {
      open();
      return;
    }
    if (user?.role !== "producer" && user?.role !== "admin") {
      setLocation("/");
      return;
    }
  }, [isAuthenticated, user, setLocation, open]);

  // Fetch categories
  const { data: categories = [] } = useQuery({
    queryKey: ["/api/categories"],
    queryFn: async () => {
      const response = await fetch("/api/categories");
      if (!response.ok) throw new Error("Failed to fetch categories");
      return response.json();
    },
  });

  // Product creation mutation
  const createProductMutation = useMutation({
    mutationFn: async (productData: ProductFormData) => {
      const token = localStorage.getItem("auth_token");
      const response = await fetch("/api/products", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...productData,
          price: parseFloat(productData.price),
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to create product");
      }

      return response.json();
    },
    onSuccess: (product) => {
      toast({
        title: "Product created successfully!",
        description: `${product.name} has been submitted for approval.`,
      });
      setLocation("/producer-dashboard");
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
    <main className="pt-12 pb-16">
      <div className="max-w-4xl mx-auto">
        <ProductForm
          title="New Product"
          submitLabel="Create Product"
          initialValues={initialFormData}
          categories={(categories as any[]).map((c: any) => ({ id: c.id, name: c.name }))}
          loading={createProductMutation.isPending}
          onCancel={() => setLocation("/producer-dashboard")}
          onSubmit={async (data) => {
            await createProductMutation.mutateAsync(data);
          }}
        />
      </div>
    </main>
  );
}
