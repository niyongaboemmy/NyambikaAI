"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { apiClient, handleApiError } from "@/config/api";
import { useAuth } from "@/contexts/AuthContext";
import { useLoginPrompt } from "@/contexts/LoginPromptContext";

import TryOnWidget from "@/components/TryOnWidget";
import { Loader2 } from "lucide-react";
import { Product } from "@/shared/schema";

interface ApiError {
  message: string;
  // Add other error properties as needed
}

export default function TryOnWidgetPage() {
  const params = useParams();
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const { open: openLoginPrompt } = useLoginPrompt();
  const [product, setProduct] = useState<Product | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const productId =
    (Array.isArray(params.productId)
      ? params.productId[0]
      : params.productId) || "";

  // useEffect(() => {
  //   if (!isAuthenticated) {
  //     openLoginPrompt();
  //   }
  // }, [isAuthenticated, openLoginPrompt]);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setIsLoading(true);
        const response = await apiClient.get<Product>(
          `/api/products/${productId}`
        );
        setProduct(response.data);
      } catch (err) {
        const error = handleApiError(err) as ApiError | string;
        setError(
          typeof error === "string"
            ? error
            : error?.message || "Failed to load product"
        );
        console.error("Error fetching product:", error);
      } finally {
        setIsLoading(false);
      }
    };

    if (productId) {
      fetchProduct();
    }
  }, [productId]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4 text-center">
        <h2 className="text-2xl font-bold text-red-500 mb-4">Error</h2>
        <p className="text-gray-600 mb-4">{error || "Product not found"}</p>
        <button
          onClick={() => router.back()}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
        >
          Go Back
        </button>
      </div>
    );
  }

  // Ensure we have a valid product image URL
  const productImageUrl = product.imageUrl || "";

  return (
    <div className="pt-10">
      <TryOnWidget
        productId={productId}
        productImageUrl={productImageUrl}
        onUnselectProduct={() => router.back()}
        productName={product.name}
        productPrice={String(product.price)}
        otherImages={product.additionalImages || []}
      />
    </div>
  );
}
