"use client";

import { useState, useRef } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
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
  Trash2,
  Edit3,
  Zap,
  MessageCircle,
  ChevronDown,
  Package,
  Clock,
  MapPin,
} from "lucide-react";
import { Button } from "@/components/custom-ui/button";
import { Badge } from "@/components/custom-ui/badge";
import { Skeleton } from "@/components/custom-ui/skeleton";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiClient, handleApiError, API_ENDPOINTS } from "@/config/api";
import TryOnWidget from "@/components/TryOnWidget";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/contexts/AuthContext";
import { useLoginPrompt } from "@/contexts/LoginPromptContext";
import { Product } from "@/shared/schema";
import { useParams, useRouter } from "next/navigation";
import { useCompany } from "@/contexts/CompanyContext";
import BoostProductDialog from "@/components/BoostProductDialog";
import Share from "@/components/Share";
import WhatsAppChatModal from "@/components/WhatsAppChatModal";

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
  const queryClient = useQueryClient();
  const [boostOpen, setBoostOpen] = useState(false);
  const [confirmChecked, setConfirmChecked] = useState(false);
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
  const [showDescriptionFit, setShowDescriptionFit] = useState(false);
  const [showShipping, setShowShipping] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const { addItem } = useCart();
  const productIdStr = Array.isArray(id) ? (id ? id[0] : "") : (id as string);
  const [isChatOpen, setIsChatOpen] = useState(false);

  const handleBack = () => {
    if (user?.business_id) {
      return router.push(`/store/${user.business_id}`);
    } else if (typeof window !== "undefined" && window.history.length > 1) {
      window.history.back();
    } else {
      router.push("/products");
    }
  };

  // Share handler
  const handleShare = async () => {
    try {
      const url = typeof window !== "undefined" ? window.location.href : "";
      const title = product ? `${product.name} • Nyambika` : "Nyambika";
      if (navigator.share) {
        await navigator.share({ title, url });
      } else if (navigator.clipboard) {
        await navigator.clipboard.writeText(url);
        toast({
          title: "Link copied",
          description: "Product link copied to clipboard.",
        });

        // Suggested products (simple heuristic: fetch a few and exclude current)
        const { data: suggestions } = useQuery<ExtendedProduct[] | undefined>({
          queryKey: ["suggested-products", productIdStr],
          queryFn: async () => {
            try {
              const res = await apiClient.get(`/api/products`, {
                params: { limit: 8 },
              });
              const items: ExtendedProduct[] = (
                res.data?.items ||
                res.data ||
                []
              )
                .filter((p: any) => String(p.id) !== String(productIdStr))
                .map((p: any) => ({
                  ...p,
                  images: [
                    p.imageUrl,
                    ...((p.additionalImages as string[]) || []),
                  ].filter(Boolean),
                }));
              return items;
            } catch {
              return undefined;
            }
          },
          enabled: !!productIdStr,
          staleTime: 60_000,
        });
      }
    } catch (e) {
      // swallow
    }
  };

  // Favorites: initial status
  const { data: isFavInitial } = useQuery<{ favorited: boolean }>({
    queryKey: ["favorite-status", productIdStr],
    queryFn: async () => {
      if (!productIdStr) return { favorited: false };
      try {
        const res = await apiClient.get(
          API_ENDPOINTS.FAVORITES_CHECK(productIdStr),
          { suppressAuthModal: true } as any
        );
        return res.data || { favorited: false };
      } catch {
        return { favorited: false };
      }
    },
    enabled: !!productIdStr,
    staleTime: 30_000,
  });

  // Sync local favorite state with server once
  const [isFavHydrated, setIsFavHydrated] = useState(false);
  if (!isFavHydrated && typeof isFavInitial?.favorited === "boolean") {
    setIsFavorite(isFavInitial.favorited);
    setIsFavHydrated(true);
  }

  const addFavMutation = useMutation({
    mutationFn: async () => {
      await apiClient.post(API_ENDPOINTS.FAVORITES_ITEM(productIdStr));
    },
    onError: () => {
      setIsFavorite(false);
      toast({
        title: "Failed",
        description: "Could not add to favorites.",
        variant: "destructive",
      });
    },
  });

  const removeFavMutation = useMutation({
    mutationFn: async () => {
      await apiClient.delete(API_ENDPOINTS.FAVORITES_ITEM(productIdStr));
    },
    onError: () => {
      setIsFavorite(true);
      toast({
        title: "Failed",
        description: "Could not remove from favorites.",
        variant: "destructive",
      });
    },
  });

  const toggleFavoriteServer = () => {
    if (!productIdStr) return;
    // Require login for toggling favorites
    if (!isAuthenticated) {
      openLoginPrompt();
      return;
    }
    const next = !isFavorite;
    setIsFavorite(next);
    if (next) addFavMutation.mutate();
    else removeFavMutation.mutate();
  };

  // Delete product
  const deleteMutation = useMutation({
    mutationFn: async () => {
      if (!productIdStr) throw new Error("Missing product id");
      await apiClient.delete(API_ENDPOINTS.PRODUCT_BY_ID(productIdStr));
    },
    onSuccess: () => {
      toast({ title: "Deleted", description: "Product deleted successfully." });
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["infinite-products"] });
      queryClient.invalidateQueries({ queryKey: ["companies"] });
      // Navigate away
      handleBack();
    },
    onError: (e) => {
      const msg = handleApiError(e);
      toast({
        title: "Delete failed",
        description: msg,
        variant: "destructive",
      });
    },
  });
  const handleDelete = async () => {
    if (!product) return;
    const ok =
      typeof window !== "undefined"
        ? window.confirm("Delete this product? This cannot be undone.")
        : false;
    if (!ok) return;
    deleteMutation.mutate();
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

  // Producer contact info for WhatsApp
  const { data: producerContact } = useQuery<any>({
    queryKey: ["producer-contact", (product as any)?.producerId],
    queryFn: async () => {
      if (!product?.producerId) return null;
      const res = await apiClient.get(`/api/producers/${product.producerId}`);
      return res.data;
    },
    enabled: Boolean(product?.producerId),
    staleTime: 60_000,
  });

  // Lightweight presence indicator (served by local API)
  const { data: presence } = useQuery<{
    isOnline: boolean;
    lastSeen?: string | null;
  } | null>({
    queryKey: ["producer-presence", (product as any)?.producerId],
    queryFn: async () => {
      if (!product?.producerId) return null;
      const res = await fetch(`/api/producers/${product.producerId}/presence`, {
        cache: "no-store",
      });
      if (!res.ok) return null;
      return res.json();
    },
    enabled: Boolean(product?.producerId),
    refetchInterval: 30_000,
    staleTime: 15_000,
  });

  // Fetch wallet to display balance
  const { data: wallet } = useQuery<
    { id: string; balance: string } | undefined
  >({
    queryKey: ["wallet"],
    queryFn: async () => {
      try {
        const res = await apiClient.get(API_ENDPOINTS.WALLET, {
          suppressAuthModal: true,
        } as any);
        return res.data;
      } catch (error) {
        // Fail silently for non-auth users
        return undefined;
      }
    },
    enabled: !!user,
    staleTime: 30_000,
  });

  // Boost mutation
  const boostMutation = useMutation({
    mutationFn: async () => {
      const productId = Array.isArray(id) ? id[0] : (id as string);
      const res = await apiClient.post(API_ENDPOINTS.PRODUCT_BOOST(productId));
      return res.data as any;
    },
    onSuccess: () => {
      setBoostOpen(false);
      setConfirmChecked(false);
      // Refresh any product-related queries so ordering reflects across app
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["infinite-products"] });
      queryClient.invalidateQueries({ queryKey: ["companies"] });
      // Feedback
      toast({ title: "Boosted", description: "Product boosted successfully." });
    },
    onError: (e: any) => {
      const msg = handleApiError(e);
      try {
        const data = e?.response?.data;
        if (e?.response?.status === 402 && data?.required != null) {
          toast({
            title: "Insufficient balance",
            description: `Required: RF ${Number(
              data.required
            ).toLocaleString()} | Your balance: RF ${Number(
              data.balance || 0
            ).toLocaleString()}`,
            variant: "destructive",
          });
          return;
        }
      } catch {}
      toast({
        title: "Boost failed",
        description: msg,
        variant: "destructive",
      });
    },
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

              {/* Boost dialog only renders on main page when product is loaded */}
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

      <main className="relative z-10 pt-10 sm:pt-10 pb-4 sm:pb-6 px-2 sm:px-0">
        <div className="">
          {/* Modern Header with Responsive Toolbar */}
          <div className="relative mb-4 sm:mb-6">
            {/* Back Navigation */}
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <motion.div
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ duration: 0.3 }}
                className="flex items-center gap-2 sm:gap-3"
              >
                <Button
                  variant="ghost"
                  onClick={handleBack}
                  className="group relative overflow-hidden bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border border-gray-200/50 dark:border-gray-700/50 rounded-xl sm:rounded-2xl px-3 py-2 sm:px-4 sm:py-2.5 hover:bg-white dark:hover:bg-gray-800 transition-all duration-300 shadow-lg hover:shadow-xl"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  <div className="relative flex items-center gap-1.5 sm:gap-2">
                    <ArrowLeft className="h-4 w-4 text-gray-600 dark:text-gray-300 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-300" />
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-200 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-300">
                      Back
                    </span>
                  </div>
                </Button>
                <div className="hidden md:block">
                  <h1 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-gray-900 via-gray-700 to-gray-900 dark:from-white dark:via-gray-200 dark:to-white bg-clip-text text-transparent">
                    Product Details
                  </h1>
                </div>
              </motion.div>
            </div>
            <div className="absolute z-50 p-1 pt-3">
              <Share
                metadata={{
                  title: product.name,
                  description: product.description,
                  icon: product.imageUrl || undefined,
                }}
                size="sm"
                triggerLabel="Share"
                triggerClassName="rounded-full text-xs bg-blue-500 text-white"
              />
            </div>
            {/* Desktop Toolbar - Top Right Floating */}
            <motion.div
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.4, delay: 0.1 }}
              className="absolute top-0 right-0 z-20"
            >
              <div className="flex items-center gap-2 bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl border border-gray-200/60 dark:border-gray-700/60 rounded-2xl p-2 shadow-xl shadow-gray-500/10 dark:shadow-black/20">
                {/* Management Tools - Only for owners */}
                {(user?.role === "admin" ||
                  (user?.role === "producer" &&
                    product.producerId === user?.id)) && (
                  <>
                    <div className="flex items-center gap-1">
                      {/* Edit Button */}
                      <motion.div
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => router.push(`/product-edit/${id}`)}
                          className="group relative w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-900/30 dark:to-teal-900/30 border border-emerald-200/50 dark:border-emerald-700/50 hover:from-emerald-100 hover:to-teal-100 dark:hover:from-emerald-800/40 dark:hover:to-teal-800/40 transition-all duration-300 hover:shadow-lg hover:shadow-emerald-500/20"
                          title="Edit product"
                        >
                          <Edit3 className="h-4 w-4 text-emerald-600 dark:text-emerald-400 group-hover:scale-110 transition-transform duration-200" />
                        </Button>
                      </motion.div>

                      {/* Boost Button */}
                      <motion.div
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setBoostOpen(true)}
                          className="group relative w-10 h-10 rounded-xl bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/30 dark:to-orange-900/30 border border-amber-200/50 dark:border-amber-700/50 hover:from-amber-100 hover:to-orange-100 dark:hover:from-amber-800/40 dark:hover:to-orange-800/40 transition-all duration-300 hover:shadow-lg hover:shadow-amber-500/20"
                          title="Boost product"
                        >
                          <Zap className="h-4 w-4 text-amber-600 dark:text-amber-400 group-hover:scale-110 transition-transform duration-200" />
                        </Button>
                      </motion.div>

                      {/* Delete Button */}
                      <motion.div
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <Button
                          variant="ghost"
                          size="icon"
                          disabled={deleteMutation.isPending}
                          onClick={handleDelete}
                          className="group relative w-10 h-10 rounded-xl bg-gradient-to-br from-rose-50 to-red-50 dark:from-rose-900/30 dark:to-red-900/30 border border-rose-200/50 dark:border-rose-700/50 hover:from-rose-100 hover:to-red-100 dark:hover:from-rose-800/40 dark:hover:to-red-800/40 transition-all duration-300 hover:shadow-lg hover:shadow-rose-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
                          title="Delete product"
                        >
                          <Trash2 className="h-4 w-4 text-rose-600 dark:text-rose-400 group-hover:scale-110 transition-transform duration-200" />
                        </Button>
                      </motion.div>
                    </div>
                  </>
                )}
              </div>
            </motion.div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-6">
            {/* Product Images */}
            <div className="space-y-2 sm:space-y-4">
              <div className="aspect-square rounded-xl sm:rounded-2xl overflow-hidden bg-gradient-to-br from-blue-50/80 via-indigo-50/60 to-purple-50/80 dark:from-slate-800/90 dark:via-indigo-900/80 dark:to-purple-900/90 border border-blue-200/30 dark:border-indigo-700/30 relative group shadow-2xl shadow-blue-500/10 dark:shadow-indigo-500/20">
                <Image
                  src={product.images?.[currentImageIndex] || product.imageUrl}
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
                <div className="absolute top-2 right-2 sm:top-3 sm:right-3 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 text-white px-1.5 py-0.5 sm:px-2 sm:py-1 rounded-md sm:rounded-lg text-xs font-medium flex items-center gap-1 shadow-lg shadow-purple-500/30 backdrop-blur-sm border border-white/20">
                  <Wand2 className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                  AI Ready
                </div>
              </div>
              {product.images && product.images.length > 1 && (
                <div className="grid grid-cols-6 sm:grid-cols-7 gap-1 sm:gap-2">
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
                      <Image
                        src={image}
                        alt={`${product.name} ${index + 1}`}
                        width={120}
                        height={120}
                        sizes="(min-width: 640px) 80px, 56px"
                        quality={60}
                        loading="lazy"
                        placeholder="empty"
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
                <div className="flex items-center gap-1 sm:gap-2 mb-1">
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

                <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed line-clamp-2">
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

              {/* Action Buttons */}
              <div className="space-y-1.5 sm:space-y-2">
                <div className="flex gap-1.5 sm:gap-2">
                  {/* WhatsApp (large) */}
                  <Button
                    onClick={() => setIsChatOpen(true)}
                    disabled={!producerContact?.phone}
                    className="flex-1 py-2 sm:py-2.5 px-4 sm:px-6 bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white font-semibold rounded-md sm:rounded-lg transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl text-xs sm:text-sm flex items-center justify-center gap-2 border border-emerald-500/30 dark:border-emerald-400/40 min-h-[44px]"
                    title={
                      producerContact?.phone
                        ? "Chat on WhatsApp"
                        : "Producer phone unavailable"
                    }
                  >
                    <span
                      className={`inline-block w-2 h-2 rounded-full ${
                        presence?.isOnline
                          ? "bg-emerald-300 animate-pulse"
                          : "bg-gray-300"
                      }`}
                    />
                    <MessageCircle className="h-4 w-4" />
                    WhatsApp
                  </Button>
                  {/* Add to Cart */}
                  <Button
                    onClick={handleAddToCart}
                    disabled={!selectedSize || !selectedColor}
                    variant="outline"
                    className="flex-1 border-2 border-blue-400/60 bg-gradient-to-r from-white/95 via-blue-50/80 to-indigo-50/95 dark:from-slate-800/95 dark:via-blue-900/80 dark:to-indigo-900/95 text-blue-600 dark:text-blue-400 hover:from-blue-50 hover:via-indigo-50 hover:to-purple-50 dark:hover:from-blue-900/30 dark:hover:via-indigo-900/20 dark:hover:to-purple-900/30 py-2 sm:py-2 rounded-md sm:rounded-lg backdrop-blur-md transition-all duration-300 hover:scale-105 text-xs sm:text-sm min-h-[44px] sm:min-h-[44px] shadow-lg shadow-blue-500/10 dark:shadow-blue-500/20 hover:shadow-blue-500/20 dark:hover:shadow-blue-500/30 dark:border-blue-600/50"
                  >
                    <ShoppingCart className="h-3.5 w-3.5 mr-1" />
                    Add to Cart
                  </Button>
                  {/* Buy Now */}
                  <Button
                    onClick={handleBuyNow}
                    disabled={!selectedSize || !selectedColor}
                    className="flex-1 py-2 sm:py-2.5 px-4 sm:px-6 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold rounded-md sm:rounded-lg transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl text-xs sm:text-sm flex items-center justify-center gap-2 border border-blue-500/30 dark:border-blue-400/40 min-h-[44px]"
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

      {/* Fixed Try-On Widget Button */}
      {product && (
        <div className="fixed bottom-4 left-4 right-4 z-50 flex justify-center">
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="max-w-md w-full"
          >
            <Button
              onClick={() => router.push(`/try-on-widget/${product.id}`)}
              className="w-full py-4 px-6 bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-600 hover:from-purple-700 hover:via-blue-700 hover:to-indigo-700 text-white font-bold rounded-full shadow-2xl hover:shadow-purple-500/25 transition-all duration-300 text-lg flex items-center justify-center gap-3 border-2 border-white/20"
            >
              <Wand2 className="h-6 w-6" />
              Try On with AI
            </Button>
          </motion.div>
        </div>
      )}

      {/* Boost Dialog (renders only when product is loaded and user can manage) */}
      {(user?.role === "admin" || user?.role === "producer") &&
        product.producerId === user?.id && (
          <BoostProductDialog
            open={boostOpen}
            onOpenChange={setBoostOpen}
            productId={product.id}
          />
        )}

      {/* Inline WhatsApp Chat Modal */}
      {product && (
        <WhatsAppChatModal
          isOpen={isChatOpen}
          onOpenChange={setIsChatOpen}
          producer={{
            id: String(product.producerId || ""),
            name:
              producerContact?.business_name ||
              producerContact?.fullName ||
              producerContact?.name ||
              null,
            phone: producerContact?.phone ?? null,
          }}
          product={{
            id: product.id,
            name: product.name,
            url:
              typeof window !== "undefined" ? window.location.href : undefined,
          }}
          online={presence || null}
          defaultMessage={`Hello ${
            producerContact?.business_name ||
            producerContact?.fullName ||
            producerContact?.name ||
            "there"
          }, I'm interested in "${product.name}". Is it available in ${
            selectedSize || "[your preferred size]"
          } and ${
            selectedColor || "[your preferred color]"
          }? Price RF ${parseFloat(String(product.price)).toLocaleString()}?`}
        />
      )}
    </div>
  );
}
