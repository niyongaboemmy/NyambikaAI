"use client";

import { useState, useRef } from "react";
import {
  ArrowLeft,
  Heart,
  Share2,
  Star,
  ShoppingCart,
  Truck,
  Shield,
  RotateCcw,
  Wand2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiClient, handleApiError } from "@/config/api";
import TryOnWidget from "@/components/TryOnWidget";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/contexts/AuthContext";
import { useLoginPrompt } from "@/contexts/LoginPromptContext";
import { Product } from "@/shared/schema";
import { useParams, useRouter } from "next/navigation";

interface ExtendedProduct extends Product {
  images?: string[];
  originalPrice?: number;
  discount?: number;
  rating?: number;
  reviewCount?: number;
  measurements?: Record<string, Record<string, string>>;
}

export default function ProductDetail() {
  const { id } = useParams();
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();
  const { open: openLoginPrompt } = useLoginPrompt();
  const [selectedSize, setSelectedSize] = useState("");
  const [selectedColor, setSelectedColor] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [tryOnControls, setTryOnControls] = useState<{
    open: () => void;
    close: () => void;
  } | null>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isFavorite, setIsFavorite] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const { addItem } = useCart();

  const handleBack = () => {
    if (typeof window !== "undefined" && window.history.length > 1) {
      window.history.back();
    } else {
      router.push("/products");
    }
  };

  // Fetch product from API
  const {
    data: product,
    isLoading: productLoading,
    error,
  } = useQuery<ExtendedProduct>({
    queryKey: ["product", id],
    queryFn: async () => {
      try {
        if (!id) throw new Error("Product ID is required");
        const productId = Array.isArray(id) ? id[0] : id;
        const response = await apiClient.get(`/api/products/${productId}`);
        const data = response.data;

        // Build images array from main image and any additional images from backend
        const images = [
          data.imageUrl,
          ...((data.additionalImages as string[] | undefined) || []),
        ].filter(Boolean);

        return {
          ...data,
          images,
          rating: data.rating ?? 0,
          reviewCount: data.reviewCount ?? 0,
        };
      } catch (error) {
        throw new Error(handleApiError(error));
      }
    },
    enabled: !!id,
  });

  // Try-on is now handled by TryOnWidget

  const handleAddToCart = () => {
    // Check authentication first
    if (!isAuthenticated) {
      openLoginPrompt();
      return;
    }

    if (!product) return;
    if (!selectedSize) {
      toast({
        title: "Size Required",
        description: "Please select a size first",
        variant: "destructive",
      });
      return;
    }
    if (!selectedColor) {
      toast({
        title: "Color Required",
        description: "Please select a color first",
        variant: "destructive",
      });
      return;
    }
    addItem(
      {
        id: product.id,
        name: product.name,
        nameRw: product.nameRw,
        description: product.description,
        price:
          typeof product.price === "number"
            ? product.price
            : parseFloat(product.price),
        image: product.imageUrl,
        size: selectedSize,
      },
      quantity
    );
    toast({
      title: "Added to cart",
      description: "Product added to your cart",
    });
  };

  const handleBuyNow = () => {
    // Check authentication first
    if (!isAuthenticated) {
      openLoginPrompt();
      return;
    }

    if (!selectedSize) {
      toast({
        title: "Size Required",
        description: "Please select a size first",
        variant: "destructive",
      });
      return;
    }
    if (!selectedColor) {
      toast({
        title: "Color Required",
        description: "Please select a color first",
        variant: "destructive",
      });
      return;
    }

    handleAddToCart();
    setTimeout(() => {
      router.push("/cart");
    }, 500);
  };

  const formatPrice = (price: string | number) => {
    const numPrice = typeof price === "string" ? parseFloat(price) : price;
    return new Intl.NumberFormat("rw-RW", {
      style: "currency",
      currency: "RWF",
      minimumFractionDigits: 0,
    })
      .format(numPrice)
      .replace("RWF", "RWF");
  };

  if (productLoading) {
    return (
      <div className="">
        {/* AI-Motivated Animated Background */}
        <div className="fixed inset-0 pointer-events-none">
          <div className="absolute top-10 left-10 w-40 h-40 bg-gradient-to-r from-blue-400/20 via-purple-400/20 to-pink-400/25 rounded-full blur-3xl animate-pulse" />
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

        <main className="relative z-10 pt-12 sm:pt-10 pb-4 sm:pb-6 px-2 sm:px-0">
          <div className="">
            {/* Header Skeleton */}
            <div className="flex items-center justify-between mb-2 sm:mb-4">
              <div className="flex flex-row items-center gap-2">
                <Skeleton className="h-10 w-20" />
                <Skeleton className="h-6 w-32" />
              </div>
              <div className="flex items-center gap-1 sm:gap-2">
                <Skeleton className="h-8 w-8 rounded-full" />
                <Skeleton className="h-8 w-8 rounded-full" />
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4">
              {/* Product Image Skeleton */}
              <div className="space-y-2">
                <div className="relative group overflow-hidden rounded-lg sm:rounded-xl bg-white dark:bg-gray-900 border border-gray-200/60 dark:border-gray-700/60 shadow-xl">
                  <Skeleton className="w-full h-64 sm:h-80 lg:h-96" />
                  <div className="absolute top-2 right-2 sm:top-3 sm:right-3">
                    <Skeleton className="h-6 w-16 rounded-md" />
                  </div>
                </div>
                {/* Thumbnail Skeletons */}
                <div className="flex gap-2 overflow-x-auto">
                  {[...Array(4)].map((_, i) => (
                    <Skeleton
                      key={i}
                      className="w-16 h-16 rounded-md flex-shrink-0"
                    />
                  ))}
                </div>
              </div>

              {/* Product Info Skeleton */}
              <div className="space-y-2 sm:space-y-2">
                <div className="bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl rounded-lg sm:rounded-xl p-3 sm:p-4 border border-gray-200/60 dark:border-gray-700/60 shadow-xl">
                  <Skeleton className="h-6 w-3/4 mb-2" />
                  <Skeleton className="h-4 w-1/2 mb-3" />
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Skeleton className="h-4 w-20" />
                      <Skeleton className="h-4 w-16" />
                    </div>
                    <Skeleton className="h-6 w-20 rounded-full" />
                  </div>
                  <Skeleton className="h-8 w-24 mb-3" />
                  <Skeleton className="h-16 w-full" />
                </div>

                {/* Size Selection Skeleton */}
                <div className="bg-gray-50 dark:bg-gray-900 backdrop-blur-xl rounded-xl p-3 border border-gray-200 dark:border-none">
                  <Skeleton className="h-4 w-16 mb-2" />
                  <div className="grid grid-cols-4 sm:grid-cols-5 gap-1 mb-2">
                    {[...Array(5)].map((_, i) => (
                      <Skeleton key={i} className="h-8 rounded-md" />
                    ))}
                  </div>
                </div>

                {/* Color Selection Skeleton */}
                <div className="bg-gray-50 dark:bg-gray-900 backdrop-blur-xl rounded-xl p-3 border border-gray-200 dark:border-none">
                  <Skeleton className="h-4 w-16 mb-2" />
                  <div className="flex gap-1 flex-wrap">
                    {[...Array(4)].map((_, i) => (
                      <Skeleton key={i} className="h-7 w-16 rounded-md" />
                    ))}
                  </div>
                </div>

                {/* Action Buttons Skeleton */}
                <div className="flex gap-2">
                  <Skeleton className="h-12 flex-1" />
                  <Skeleton className="h-12 flex-1" />
                </div>

                {/* Features Skeleton */}
                <div className="bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl rounded-lg p-3 border border-gray-200/60 dark:border-none">
                  <div className="grid grid-cols-3 gap-2 text-center">
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className="flex flex-col items-center gap-1">
                        <Skeleton className="h-4 w-4 rounded-full" />
                        <Skeleton className="h-3 w-12" />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 dark:from-background dark:via-slate-900 dark:to-slate-800">
        <div className="flex justify-center items-center min-h-screen">
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-4">Product Not Found</h2>
            <Button onClick={handleBack}>Back to Products</Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="">
      {/* AI-Motivated Animated Background */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-10 left-10 w-40 h-40 bg-gradient-to-r from-blue-400/20 via-purple-400/20 to-pink-400/25 rounded-full blur-3xl animate-pulse" />
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

      <main className="relative z-10 pt-6 sm:pt-10 pb-4 sm:pb-6 px-2 sm:px-0">
        <div className="">
          {/* Compact Header */}
          <div className="flex items-center justify-between mb-2 sm:mb-4">
            <div className="flex flex-row items-center gap-2 pt-4 md:pt-0">
              <Button
                variant="ghost"
                onClick={handleBack}
                className="flex items-center gap-1 sm:gap-1 bg-gradient-to-r from-white/95 via-blue-50/90 to-white dark:from-slate-800/95 dark:via-indigo-900/90 dark:to-purple-900/95 backdrop-blur-md rounded-full px-4 sm:px-5 py-1.5 sm:py-2 text-xs sm:text-sm hover:from-blue-50 hover:via-indigo-50 hover:to-purple-50 dark:hover:from-slate-700 dark:hover:via-indigo-800 dark:hover:to-purple-800 transition-all duration-300 dark:shadow-indigo-500/20"
              >
                <ArrowLeft className="h-4 w-4 text-blue-600 dark:text-violet-500" />
                <span className="hidden sm:inline">Back </span>
                <span className="sm:hidden">Back</span>
              </Button>
              <div className="font-bold text-xl hidden md:inline-block">
                Product Details
              </div>
            </div>
            <div className="flex items-center gap-1 sm:gap-2">
              {(user?.role === "admin" ||
                (user?.role === "producer" &&
                  product.producerId === user?.id)) && (
                <Button
                  variant="outline"
                  size="sm"
                  className="bg-gradient-to-r from-white/95 via-emerald-50/90 to-teal-50/95 dark:from-slate-800/95 dark:via-emerald-900/90 dark:to-teal-900/95 backdrop-blur-md border border-emerald-200/40 dark:border-emerald-700/40 rounded-lg sm:rounded-xl text-xs px-2 py-1 shadow-lg shadow-emerald-500/10 dark:shadow-emerald-500/20"
                  onClick={() => router.push(`/product-edit/${id}`)}
                >
                  Edit
                </Button>
              )}
              <Button
                variant="ghost"
                size="icon"
                className="w-7 h-7 sm:w-8 sm:h-8 bg-gradient-to-r from-white/95 via-cyan-50/90 to-blue-50/95 dark:from-slate-800/95 dark:via-cyan-900/90 dark:to-blue-900/95 backdrop-blur-md border border-cyan-200/40 dark:border-cyan-700/40 rounded-lg sm:rounded-xl shadow-lg shadow-cyan-500/10 dark:shadow-cyan-500/20 hover:shadow-cyan-500/20 dark:hover:shadow-cyan-500/30 transition-all duration-300"
              >
                <Share2 className="h-3 w-3 sm:h-4 sm:w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className={`w-7 h-7 sm:w-8 sm:h-8 backdrop-blur-md rounded-lg sm:rounded-xl transition-all duration-300 ${
                  isFavorite
                    ? "bg-gradient-to-r from-rose-100/95 via-pink-100/90 to-red-100/95 dark:from-rose-900/80 dark:via-pink-900/70 dark:to-red-900/80 border border-rose-300/50 dark:border-rose-600/50 text-rose-600 dark:text-rose-400 shadow-lg shadow-rose-500/20 dark:shadow-rose-500/30"
                    : "bg-gradient-to-r from-white/95 via-rose-50/90 to-pink-50/95 dark:from-slate-800/95 dark:via-rose-900/90 dark:to-pink-900/95 border border-rose-200/40 dark:border-rose-700/40 shadow-lg shadow-rose-500/10 dark:shadow-rose-500/20 hover:shadow-rose-500/20 dark:hover:shadow-rose-500/30"
                }`}
                onClick={() => setIsFavorite(!isFavorite)}
              >
                <Heart
                  className={`h-3 w-3 sm:h-4 sm:w-4 ${
                    isFavorite ? "fill-current" : ""
                  }`}
                />
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-6">
            {/* Product Images */}
            <div className="space-y-2 sm:space-y-4">
              <div className="aspect-square rounded-xl sm:rounded-2xl overflow-hidden bg-gradient-to-br from-blue-50/80 via-indigo-50/60 to-purple-50/80 dark:from-slate-800/90 dark:via-indigo-900/80 dark:to-purple-900/90 border border-blue-200/30 dark:border-indigo-700/30 relative group shadow-2xl shadow-blue-500/10 dark:shadow-indigo-500/20">
                <img
                  src={product.images?.[currentImageIndex] || product.imageUrl}
                  alt={product.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                {/* AI Badge */}
                <div className="absolute top-2 right-2 sm:top-3 sm:right-3 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 text-white px-1.5 py-0.5 sm:px-2 sm:py-1 rounded-md sm:rounded-lg text-xs font-medium flex items-center gap-1 shadow-lg shadow-purple-500/30 backdrop-blur-sm border border-white/20">
                  <Wand2 className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                  AI Ready
                </div>
              </div>
              {product.images && product.images.length > 1 && (
                <div className="grid grid-cols-3 sm:grid-cols-5 gap-1 sm:gap-2">
                  {product.images.map((image, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentImageIndex(index)}
                      className={`aspect-square rounded-xl overflow-hidden bg-gradient-to-br from-blue-50/80 via-indigo-50/60 to-purple-50/80 dark:from-slate-800/90 dark:via-indigo-900/80 dark:to-purple-900/90 border-2 transition-all duration-300 ${
                        currentImageIndex === index
                          ? "border-blue-500 ring-2 ring-blue-200/50 dark:ring-indigo-600/50 scale-105 shadow-lg shadow-blue-500/20 dark:shadow-indigo-500/30"
                          : "border-transparent hover:border-blue-300/60 hover:scale-105 hover:shadow-md hover:shadow-blue-500/10 dark:hover:shadow-indigo-500/20"
                      }`}
                    >
                      <img
                        src={image}
                        alt={`${product.name} ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Product Info */}
            <div className="space-y-2 sm:space-y-2">
              <div className="bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl rounded-lg sm:rounded-xl p-3 sm:p-4 border border-gray-200/60 dark:border-gray-700/60 dark:border-none shadow-gray-500/10 dark:shadow-black/30">
                <h1 className="text-base sm:text-lg md:text-xl font-bold text-gray-900 dark:text-white mb-1">
                  {product.name}
                </h1>
                {product.nameRw && (
                  <p className="text-xs text-gray-500 dark:text-gray-500 mb-2">
                    {product.nameRw}
                  </p>
                )}
                <div className="flex items-center justify-between mb-1 sm:mb-2">
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`h-3 w-3 ${
                            i < Math.floor(product.rating || 0)
                              ? "text-yellow-400 fill-current"
                              : "text-gray-300 dark:text-gray-600"
                          }`}
                        />
                      ))}
                    </div>
                    <span className="text-xs text-gray-600 dark:text-gray-400">
                      {product.rating} ({product.reviewCount})
                    </span>
                  </div>
                  <Badge
                    variant={product.inStock ? "default" : "secondary"}
                    className="text-xs"
                  >
                    {product.inStock ? "✓ In Stock" : "Out of Stock"}
                  </Badge>
                </div>
                <div className="flex items-center gap-1 sm:gap-2 mb-2 sm:mb-3">
                  <p className="text-lg sm:text-xl md:text-2xl font-bold text-emerald-600 dark:text-emerald-400 mb-1 sm:mb-2">
                    RF {parseFloat(String(product.price)).toLocaleString()}
                  </p>
                  {product.originalPrice && (
                    <div className="flex items-center gap-1 sm:gap-2">
                      <span className="text-sm text-gray-500 dark:text-gray-400 line-through">
                        {formatPrice(product.originalPrice)}
                      </span>
                      <Badge
                        variant="destructive"
                        className="text-xs animate-pulse"
                      >
                        -{product.discount}% OFF
                      </Badge>
                    </div>
                  )}
                </div>

                <p className="text-xs text-gray-700 dark:text-gray-300 leading-relaxed">
                  {product.description}
                </p>
              </div>

              {/* Size Selection */}
              <div className="bg-gray-50 dark:bg-gray-900 backdrop-blur-xl rounded-xl p-3 border border-gray-200 dark:border-none dark:border-gray-700/50 dark:shadow-lg">
                <h3 className="text-xs font-semibold mb-2 flex items-center gap-1 text-gray-800 dark:text-gray-200">
                  <span>📏 Size</span>
                  {selectedSize && (
                    <Badge variant="outline" className="text-xs">
                      {selectedSize}
                    </Badge>
                  )}
                </h3>
                <div className="grid grid-cols-4 sm:grid-cols-5 gap-1 mb-1 sm:mb-2">
                  {product.sizes?.map((size) => (
                    <button
                      key={size}
                      onClick={() => setSelectedSize(size)}
                      className={`p-1 sm:p-1.5 text-center border-3 rounded-full transition-all duration-300 font-bold text-xs min-h-[32px] sm:min-h-auto flex items-center justify-center relative ${
                        selectedSize === size
                          ? "border-blue-500 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white scale-110 dark:shadow-xl dark:shadow-blue-500/40 ring-4 ring-blue-200 dark:ring-blue-800 z-10"
                          : "border-gray-400 dark:border-gray-600 hover:border-blue-400 hover:scale-105 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 dark:hover:shadow-md"
                      }`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
                {selectedSize && product.measurements?.[selectedSize] && (
                  <div className="p-1.5 sm:p-2 bg-gray-50 dark:bg-gray-800 rounded-sm sm:rounded-md border border-gray-200/60 dark:border-gray-600/60 shadow-inner">
                    <h3 className="text-sm font-semibold mb-2 text-gray-900 dark:text-white">
                      ✨ Product Features
                    </h3>
                    <p className="text-sm font-semibold mb-2 text-gray-900 dark:text-white">
                      Size {selectedSize} Measurements:
                    </p>
                    <div className="text-xs text-gray-700 dark:text-gray-300 flex flex-wrap gap-0.5 sm:gap-1">
                      {Object.entries(product.measurements[selectedSize]).map(
                        ([key, value]) => (
                          <span
                            key={key}
                            className="bg-gray-100 dark:bg-gray-700 rounded text-xs font-mono text-gray-800 dark:text-gray-200 mr-1"
                          >
                            {key}:{value}
                            {key}:{value}
                          </span>
                        )
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Color Selection */}
              <div className="bg-gray-50 dark:bg-gray-900 backdrop-blur-xl rounded-xl p-3 border border-gray-200 dark:border-none dark:border-gray-700/50 dark:shadow-lg">
                <h3 className="text-xs font-semibold mb-2 flex items-center gap-1 text-gray-800 dark:text-gray-200">
                  <span>🎨 Color</span>
                  {selectedColor && (
                    <Badge variant="outline" className="text-xs">
                      {selectedColor}
                    </Badge>
                  )}
                </h3>
                <div className="flex gap-1 sm:gap-1.5 flex-wrap">
                  {product.colors?.map((color) => (
                    <button
                      key={color}
                      onClick={() => setSelectedColor(color)}
                      className={`px-1.5 sm:px-2 py-1 sm:py-1.5 border-3 rounded-full transition-all duration-300 font-bold text-xs min-h-[28px] sm:min-h-auto flex items-center justify-center relative ${
                        selectedColor === color
                          ? "border-purple-500 bg-gradient-to-r from-purple-600 via-pink-600 to-rose-600 text-white scale-110 dark:shadow-xl dark:shadow-purple-500/40 ring-4 ring-purple-200 dark:ring-purple-800 z-10"
                          : "border-gray-400 dark:border-gray-600 hover:border-purple-400 hover:scale-105 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 dark:hover:shadow-md"
                      }`}
                    >
                      {color}
                    </button>
                  ))}
                </div>
              </div>

              {/* AI Try-On Section */}
              <TryOnWidget
                productId={Array.isArray(id) ? id[0] : id!}
                productImageUrl={product.imageUrl}
                autoOpenFullscreen={false}
                onRegisterControls={setTryOnControls}
              />

              {/* Action Buttons */}
              <div className="space-y-1.5 sm:space-y-2">
                <div className="flex gap-1.5 sm:gap-2">
                  <Button
                    onClick={handleAddToCart}
                    disabled={!selectedSize || !selectedColor}
                    variant="outline"
                    className="flex-1 border-2 border-blue-400/60 bg-gradient-to-r from-white/95 via-blue-50/80 to-indigo-50/95 dark:from-slate-800/95 dark:via-blue-900/80 dark:to-indigo-900/95 text-blue-600 dark:text-blue-400 hover:from-blue-50 hover:via-indigo-50 hover:to-purple-50 dark:hover:from-blue-900/30 dark:hover:via-indigo-900/20 dark:hover:to-purple-900/30 py-2 sm:py-1.5 rounded-md sm:rounded-lg backdrop-blur-md transition-all duration-300 hover:scale-105 text-xs sm:text-sm min-h-[40px] sm:min-h-auto shadow-lg shadow-blue-500/10 dark:shadow-blue-500/20 hover:shadow-blue-500/20 dark:hover:shadow-blue-500/30 dark:border-blue-600/50"
                  >
                    <ShoppingCart className="h-3 w-3 mr-0.5 sm:mr-1" />
                    Add to Cart
                  </Button>
                  <Button
                    onClick={handleBuyNow}
                    disabled={!selectedSize || !selectedColor}
                    className="w-full py-2 sm:py-2.5 px-4 sm:px-6 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold rounded-md sm:rounded-lg transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl text-xs sm:text-sm flex items-center justify-center gap-1 sm:gap-2 border border-blue-500/30 dark:border-blue-400/40"
                  >
                    Buy Now
                  </Button>
                </div>

                {/* Product Features */}
                <div className="bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl rounded-lg sm:rounded-xl p-3 sm:p-4 border border-gray-200/60 dark:border-none dark:border-gray-700/60 shadow-gray-500/10 dark:shadow-black/30">
                  <div className="grid grid-cols-3 gap-1 sm:gap-2 text-center">
                    <div className="flex flex-col items-center gap-1">
                      <Truck className="h-3 w-3 text-emerald-500 dark:text-emerald-400" />
                      <span className="text-xs text-gray-600 dark:text-gray-400">
                        Free Ship
                      </span>
                    </div>
                    <div className="flex flex-col items-center gap-1">
                      <Shield className="h-3 w-3 text-teal-500 dark:text-teal-400" />
                      <span className="text-xs text-gray-600 dark:text-gray-400">
                        Quality
                      </span>
                    </div>
                    <div className="flex flex-col items-center gap-1">
                      <RotateCcw className="h-3 w-3 text-cyan-500 dark:text-cyan-400" />
                      <span className="text-xs text-gray-600 dark:text-gray-400">
                        Returns
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
