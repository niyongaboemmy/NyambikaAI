"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import { Wand2 } from "lucide-react";
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

  // Update browser title and meta tags when product loads
  useEffect(() => {
    if (product) {
      // Update document title
      document.title = `${product.name} - Try On | Nyambika`;

      // Update or create meta tags for social sharing
      updateMetaTags(product.name, product.description, product.imageUrl);
    }

    // Cleanup function to reset title when component unmounts
    return () => {
      document.title = "Nyambika - AI Fashion Try-On";
    };
  }, [product]);

  // Helper function to update meta tags
  const updateMetaTags = (
    title: string,
    description: string,
    imageUrl: string
  ) => {
    if (typeof document === "undefined") return;

    // Update existing meta tags or create new ones
    const updateOrCreateMeta = (property: string, content: string) => {
      let meta = document.querySelector(
        `meta[property="${property}"]`
      ) as HTMLMetaElement;
      if (!meta) {
        meta = document.createElement("meta");
        meta.setAttribute("property", property);
        document.head.appendChild(meta);
      }
      meta.setAttribute("content", content);
    };

    // Open Graph tags
    updateOrCreateMeta("og:title", `${title} - Try On | Nyambika`);
    updateOrCreateMeta("og:description", description);
    updateOrCreateMeta(
      "og:image",
      imageUrl.startsWith("http")
        ? imageUrl
        : `${window.location.origin}${imageUrl}`
    );
    updateOrCreateMeta("og:url", window.location.href);

    // Twitter Card tags
    updateOrCreateMeta("twitter:title", `${title} - Try On | Nyambika`);
    updateOrCreateMeta("twitter:description", description);
    updateOrCreateMeta(
      "twitter:image",
      imageUrl.startsWith("http")
        ? imageUrl
        : `${window.location.origin}${imageUrl}`
    );
    updateOrCreateMeta("twitter:card", "summary_large_image");
  };

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
    <div className="min-h-screen">
      {/* AI-Motivated Animated Background */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-10 left-10 w-40 h-40 bg-gradient-to-r from-blue-400/20 via-purple-400/20 to-blue-400/25 rounded-full blur-3xl animate-pulse" />
        <div
          className="absolute top-20 left-20 w-32 h-32 bg-gradient-to-r from-slate-400/15 via-gray-400/10 to-slate-400/15 dark:from-slate-600/20 dark:via-gray-600/15 dark:to-slate-600/20 rounded-full blur-3xl animate-bounce"
          style={{ animationDuration: "6s" }}
        />
        <div
          className="absolute top-1/3 right-1/4 w-32 h-32 bg-gradient-to-r from-emerald-400/15 via-sky-400/15 to-blue-400/20 rounded-full blur-2xl animate-ping"
          style={{ animationDuration: "5s" }}
        />
        <div
          className="absolute top-1/4 left-1/3 w-28 h-28 bg-gradient-to-r from-violet-400/10 via-purple-400/15 to-indigo-400/10 rounded-full blur-2xl animate-pulse"
          style={{ animationDuration: "6s" }}
        />
      </div>

      <main className="relative z-10 pt-10 sm:pt-10 pb-4 sm:pb-6 px-2 sm:px-0">
        <div className="">
          {/* Try-On Widget */}
          <TryOnWidget
            productId={productId}
            productImageUrl={productImageUrl}
            onUnselectProduct={() => router.back()}
            productName={product.name}
            productPrice={String(product.price)}
            otherImages={product.additionalImages || []}
          />
        </div>
      </main>
    </div>
  );
}
