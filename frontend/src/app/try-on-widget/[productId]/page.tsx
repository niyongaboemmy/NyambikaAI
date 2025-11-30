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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 dark:from-background dark:via-slate-900 dark:to-slate-800">
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
          {/* Product Header Section */}
          <div className="mb-6 sm:mb-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-6">
              {/* Product Image */}
              <div className="space-y-2 sm:space-y-4">
                <div className="aspect-square rounded-xl sm:rounded-2xl overflow-hidden bg-gradient-to-br from-blue-50/80 via-indigo-50/60 to-purple-50/80 dark:from-slate-800/90 dark:via-indigo-900/80 dark:to-purple-900/90 border border-blue-200/30 dark:border-indigo-700/30 relative group shadow-2xl shadow-blue-500/10 dark:shadow-indigo-500/20">
                  <Image
                    src={product.imageUrl}
                    alt={product.name}
                    fill
                    sizes="(min-width: 1024px) 50vw, 100vw"
                    quality={70}
                    priority
                    fetchPriority="high"
                    placeholder="empty"
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  {/* AI Badge */}
                  <div className="absolute top-2 right-2 sm:top-3 sm:right-3 bg-gradient-to-r from-blue-500 via-purple-500 to-blue-500 text-white px-1.5 py-0.5 sm:px-2 sm:py-1 rounded-md sm:rounded-lg text-xs font-medium flex items-center gap-1 shadow-lg shadow-purple-500/30 backdrop-blur-sm border border-white/20">
                    <Wand2 className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                    AI Ready
                  </div>
                </div>
              </div>

              {/* Product Info */}
              <div className="space-y-2 sm:space-y-2">
                <div className="bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl rounded-lg sm:rounded-xl p-3 sm:p-4 border border-gray-200/60 dark:border-gray-700/60 dark:border-none shadow-gray-500/10 dark:shadow-black/30">
                  <div className="flex flex-row items-center justify-between gap-2">
                    <div>
                      <h1 className="text-base sm:text-lg md:text-xl font-bold text-gray-900 dark:text-white mb-1">
                        {product.name}
                      </h1>
                      {product.nameRw && (
                        <p className="text-sm text-gray-500 dark:text-gray-500 mb-2">
                          {product.nameRw}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-1 sm:gap-2 mb-1">
                    <p className="text-lg sm:text-xl md:text-2xl font-bold text-emerald-600 dark:text-emerald-400 mb-1 sm:mb-2">
                      RF {parseFloat(String(product.price)).toLocaleString()}
                    </p>
                  </div>

                  <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                    {product.description}
                  </p>
                </div>
              </div>
            </div>
          </div>

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
