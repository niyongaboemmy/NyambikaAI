import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Button } from "@/components/custom-ui/button";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import BoostProductDialog from "@/components/BoostProductDialog";
import ProductCard from "@/components/ProductCard";
import type { Product } from "@/shared/types/product";
import { useCompanies } from "@/hooks/useCompanies";
import type { Category } from "@/shared/schema";
import { useInfiniteProducts } from "@/hooks/useInfiniteProducts";
import { apiClient, handleApiError, API_ENDPOINTS } from "@/config/api";
import { useAuth } from "@/contexts/AuthContext";
import SelectedCompanyBar from "./feed/SelectedCompanyBar";

interface HomeProductsProps {
  searchParams?: {
    query?: string;
    category?: string;
    company?: string;
  };
}

// Modern category card component with images
function CategoryCard({
  category,
  isSelected,
  onClick,
  productCount,
}: {
  category: Category & { id: string; name: string; nameRw: string };
  isSelected: boolean;
  onClick: () => void;
  productCount?: number;
}) {
  const getCategoryImage = (category: any) => {
    if (category.imageUrl) {
      return category.imageUrl;
    }
    const imageMap: Record<string, string> = {
      Clothing: "👗",
      Accessories: "💍",
      Shoes: "👠",
      Bags: "👜",
      Electronics: "📱",
      Beauty: "💄",
      All: "🛍️",
      Fashion: "✨",
      Sports: "⚽",
      Home: "🏠",
    };
    return imageMap[category.name] || "🛍️";
  };

  const getGradientColors = (categoryName: string) => {
    const gradientMap: Record<string, string> = {
      Clothing: "from-blue-600/80 via-blue-500/80 to-blue-400/80",
      Accessories: "from-blue-700/80 via-blue-600/80 to-indigo-500/80",
      Shoes: "from-blue-500/80 via-cyan-500/80 to-violet-500/80",
      Bags: "from-blue-800/80 via-blue-600/80 to-violet-500/80",
      Electronics: "from-slate-600/80 via-blue-600/80 to-blue-500/80",
      Beauty: "from-blue-500/80 via-indigo-500/80 to-purple-500/80",
      All: "from-blue-600/80 via-blue-500/80 to-sky-400/80",
      Fashion: "from-blue-700/80 via-indigo-600/80 to-blue-500/80",
      Sports: "from-blue-500/80 via-cyan-500/80 to-violet-400/80",
      Home: "from-blue-800/80 via-blue-600/80 to-blue-400/80",
    };
    return (
      gradientMap[categoryName] || "from-blue-500/80 via-blue/80 to-violet/50"
    );
  };

  const categoryImage = getCategoryImage(category);
  const isImageUrl = categoryImage.startsWith("http");

  return (
    <button
      onClick={onClick}
      className={`group relative overflow-hidden rounded-3xl transition-all duration-500 transform hover:scale-105 hover:-translate-y-2 ${
        isSelected
          ? "ring-4 ring-purple-500/50 shadow-2xl shadow-purple-500/30 scale-105"
          : "hover:shadow-2xl hover:shadow-black/20"
      } aspect-[4/5]`}
    >
      {/* Background Image or Gradient */}
      <div className="absolute inset-0">
        {isImageUrl ? (
          <>
            <img
              src={categoryImage}
              alt={category.name}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
            />
            <div
              className={`absolute inset-0 bg-gradient-to-t ${getGradientColors(
                category.name
              )} mix-blend-multiply group-hover:opacity-80 transition-opacity duration-300`}
            />
          </>
        ) : (
          <div
            className={`w-full h-full bg-gradient-to-br ${getGradientColors(
              category.name
            )}`}
          />
        )}
      </div>

      {/* Floating particles animation */}
      <div className="absolute inset-0 overflow-hidden">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-white/40 rounded-full animate-float"
            style={{
              left: `${10 + i * 15}%`,
              top: `${20 + (i % 3) * 25}%`,
              animationDelay: `${i * 0.8}s`,
              animationDuration: "4s",
            }}
          />
        ))}
      </div>

      {/* Emoji Icon for non-image categories */}
      {!isImageUrl && (
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-6xl group-hover:scale-110 group-hover:animate-bounce transition-all duration-300 drop-shadow-lg">
            {categoryImage}
          </span>
        </div>
      )}

      {/* Floating Content Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
      <div className="absolute bottom-0 left-0 right-0 p-6">
        <div className="transform translate-y-2 group-hover:translate-y-0 transition-transform duration-300">
          <h3 className="font-bold text-white text-xl mb-1 drop-shadow-lg">
            {category.name}
          </h3>
          {productCount !== undefined && (
            <p className="text-white/90 text-sm font-medium drop-shadow">
              {productCount} items ✨
            </p>
          )}
        </div>
      </div>

      {/* Selection indicator */}
      {isSelected && (
        <div className="absolute top-4 right-4 z-20">
          <div className="bg-white/20 backdrop-blur-sm rounded-full p-2">
            <span className="text-2xl animate-bounce">💖</span>
          </div>
        </div>
      )}

      {/* Sparkle effect on hover */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            className="absolute text-white/80 animate-ping text-sm"
            style={{
              left: `${Math.random() * 80 + 10}%`,
              top: `${Math.random() * 80 + 10}%`,
              animationDelay: `${i * 0.3}s`,
              animationDuration: "2s",
            }}
          >
            ✨
          </div>
        ))}
      </div>

      {/* Hover overlay */}
      <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
    </button>
  );
}

// Page-level skeleton shown during initial load
function HomeProductsSkeleton() {
  return (
    <section id="home-products" className="space-y-8 w-full min-h-screen">
      <div className="">
        {/* Brands Stories skeleton */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-6">
            <div className="h-6 w-32 rounded bg-gray-200 dark:bg-gray-700 animate-pulse" />
            <div className="flex gap-1">
              <div className="w-2 h-2 bg-gray-300 dark:bg-gray-600 rounded-full animate-pulse" />
              <div className="w-2 h-2 bg-gray-300 dark:bg-gray-600 rounded-full animate-pulse" />
              <div className="w-2 h-2 bg-gray-300 dark:bg-gray-600 rounded-full animate-pulse" />
            </div>
          </div>
          <div className="overflow-x-auto scrollbar-hide">
            <div className="flex items-start gap-6 pb-6 pt-2 min-w-max">
              {Array.from({ length: 5 }).map((_, i) => (
                <div
                  key={i}
                  className="min-w-[180px] aspect-[4/5] rounded-2xl bg-gray-200 dark:bg-gray-700 animate-pulse"
                />
              ))}
            </div>
          </div>
        </div>

        {/* Shop by Category skeleton */}
        <div className="mb-12">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="h-6 w-40 rounded bg-gray-200 dark:bg-gray-700 animate-pulse" />
              <div className="flex items-center gap-1">
                <div className="w-4 h-4 bg-gray-300 dark:bg-gray-600 rounded-full animate-pulse" />
                <div className="w-3 h-3 bg-gray-300 dark:bg-gray-600 rounded-full animate-pulse" />
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-5 gap-3.5 md:gap-6 px-2 md:px-0">
            {Array.from({ length: 10 }).map((_, i) => (
              <div
                key={i}
                className="aspect-[3/4] rounded-2xl bg-gray-200 dark:bg-gray-700 animate-pulse"
              />
            ))}
          </div>
        </div>

        {/* Trending Products skeleton */}
        <div className="mb-16">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <div className="h-6 w-48 rounded bg-gray-200 dark:bg-gray-700 animate-pulse" />
              <div className="flex items-center gap-3">
                <div className="h-6 w-16 rounded-full bg-gray-300 dark:bg-gray-600 animate-pulse" />
                <div className="flex gap-2">
                  <div className="w-6 h-6 bg-gray-300 dark:bg-gray-600 rounded-full animate-pulse" />
                  <div className="w-5 h-5 bg-gray-300 dark:bg-gray-600 rounded-full animate-pulse" />
                </div>
              </div>
            </div>
          </div>

          {/* Products grid skeleton */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {Array.from({ length: 10 }).map((_, i) => (
              <div
                key={i}
                className="aspect-square bg-gray-200 dark:bg-gray-700 animate-pulse rounded-xl"
              />
            ))}
          </div>

          {/* Enhanced Products Search Banner skeleton */}
          <div className="mt-8">
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-600 p-6 md:p-8">
              {/* Animated Background Elements */}
              <div className="absolute inset-0 overflow-hidden">
                <div className="absolute -top-4 -right-4 w-24 h-24 bg-white/10 rounded-full animate-pulse" />
                <div className="absolute top-1/2 -left-6 w-16 h-16 bg-white/5 rounded-full animate-pulse" />
                <div className="absolute bottom-4 right-1/3 w-8 h-8 bg-white/10 rounded-full animate-pulse" />
              </div>

              {/* Content */}
              <div className="relative z-10 text-center">
                <div className="flex items-center justify-center gap-2 mb-4">
                  <div className="w-6 h-6 bg-gray-300 dark:bg-gray-600 rounded-full animate-pulse" />
                  <div className="h-6 w-64 rounded bg-gray-300 dark:bg-gray-600 animate-pulse" />
                  <div className="w-6 h-6 bg-gray-300 dark:bg-gray-600 rounded-full animate-pulse" />
                </div>

                <div className="space-y-2 mb-6">
                  <div className="h-4 w-80 rounded bg-gray-300 dark:bg-gray-600 animate-pulse mx-auto" />
                  <div className="h-4 w-60 rounded bg-gray-300 dark:bg-gray-600 animate-pulse mx-auto" />
                </div>

                <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                  <div className="h-12 w-48 rounded-2xl bg-gray-300 dark:bg-gray-600 animate-pulse" />
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-gray-300 dark:bg-gray-600 rounded-full animate-pulse" />
                    <div className="h-3 w-40 rounded bg-gray-300 dark:bg-gray-600 animate-pulse" />
                    <div className="w-4 h-4 bg-gray-300 dark:bg-gray-600 rounded-full animate-pulse" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default function HomeProducts({ searchParams }: HomeProductsProps) {
  const router = useRouter();
  const searchParamsStr = searchParams
    ? new URLSearchParams(searchParams as Record<string, string>).toString()
    : "";
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [searchExpanded, setSearchExpanded] = useState(false);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>("");
  const [selectedCompany, setSelectedCompany] = useState<any>(null);
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  const isProducer = user?.role === "producer";
  const [boostProductId, setBoostProductId] = useState<{
    id: string;
    producer_id: string;
  } | null>(null);

  // Debounce search typing for smoother UX
  useEffect(() => {
    const id = setTimeout(() => setDebouncedSearch(searchQuery), 250);
    return () => clearTimeout(id);
  }, [searchQuery]);

  // Fetch categories for filter bar
  const { data: categories = [], isLoading: categoriesLoading } = useQuery<
    (Category & { id: string; name: string; nameRw: string })[]
  >({
    queryKey: ["categories"],
    queryFn: async () => {
      try {
        const response = await apiClient.get("/api/categories");
        return response.data;
      } catch (error) {
        throw new Error(handleApiError(error));
      }
    },
    staleTime: 60_000,
  });

  // Infinite products by category (50 per page)
  const {
    data: productsPages,
    isLoading: productsLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteProducts(
    selectedCategoryId || undefined,
    selectedCompany?.producerId || undefined,
    undefined // search - handled locally
  );

  // Sort products by display_order then by createdAt
  const products: Product[] = useMemo(() => {
    const allProducts = (productsPages?.pages || []).flatMap(
      (page) => page.products || []
    );

    return allProducts.sort((a, b) => {
      if (a.displayOrder !== b.displayOrder) {
        return (a.displayOrder || 999) - (b.displayOrder || 999);
      }
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }, [productsPages]);

  // Map of products by id for quick lookups (stable reference)
  const productsById = useMemo(() => {
    const map: Record<string, Product> = {};
    for (const p of products) {
      if (p?.id) map[p.id] = p;
    }
    return map;
  }, [products]);

  // Build unique producer ids present in current products
  const producerIds = useMemo(() => {
    const ids = new Set<string>();
    for (const p of products) {
      if (p?.producerId) ids.add(String(p.producerId));
    }
    return Array.from(ids);
  }, [products]);

  // Fetch verification status for those producers (status lives on producer)
  // Avoid network storms by limiting verification checks to a manageable number of producers
  const APPLY_VERIFICATION_LIMIT = 30;
  const shouldApplyVerification =
    producerIds.length > 0 && producerIds.length <= APPLY_VERIFICATION_LIMIT;

  type VerifiedMap = Record<string, boolean>;

  const { data: verifiedMap = {}, isLoading: verifyingProducers } =
    useQuery<VerifiedMap>({
      queryKey: [
        "producers-verified-map",
        producerIds.slice(0, APPLY_VERIFICATION_LIMIT),
      ],
      queryFn: async () => {
        const entries: Array<[string, boolean]> = await Promise.all(
          producerIds.slice(0, APPLY_VERIFICATION_LIMIT).map(async (id) => {
            try {
              const res = await apiClient.get(`/api/producers/${id}`);
              const isVerified = Boolean((res.data as any)?.isVerified);
              return [id, isVerified];
            } catch (e) {
              // On error, default to false to be safe
              return [id, false];
            }
          })
        );
        return Object.fromEntries(entries);
      },
      enabled: shouldApplyVerification,
      staleTime: 60_000,
    });

  // Local search across all keys
  const term = (debouncedSearch || "").trim().toLowerCase();
  const locallyFilteredProducts: Product[] = useMemo(() => {
    if (!products || !Array.isArray(products)) return [];

    return products.filter((product) => {
      if (!product) return false;
      if (!term) return true;

      // Convert product to record of string values for searching
      const productRecord: Record<string, unknown> = {
        ...product,
        price: product.price?.toString() || "",
        createdAt: product.createdAt?.toString() || "",
        updatedAt: product.updatedAt?.toString() || "",
        name: product.name || "",
        nameRw: product.nameRw || "",
        description: product.description || "",
        categoryId: product.categoryId || "",
        producerId: product.producerId || "",
      };

      return Object.values(productRecord).some((v) => {
        if (v == null || v === undefined) return false;
        const s =
          typeof v === "string"
            ? v
            : typeof v === "number"
            ? v.toString()
            : typeof v === "boolean"
            ? v.toString()
            : v instanceof Date
            ? v.toISOString()
            : "";
        return s.toLowerCase().includes(term);
      });
    });
  }, [products, term]);

  // Apply active-producer filter
  const activeProducerProducts: Product[] = useMemo(() => {
    // If verification not applied (too many producers), skip filtering by verification
    if (!shouldApplyVerification) return locallyFilteredProducts as Product[];
    return locallyFilteredProducts.filter((p: Product) => {
      const pid = p?.producerId ? String(p.producerId) : undefined;
      if (!pid) return true; // keep if no producerId info
      const v = verifiedMap[pid];
      // Only show when verified === true
      return v === true;
    }) as Product[];
  }, [locallyFilteredProducts, verifiedMap, shouldApplyVerification]);

  // Sentinel for infinite scroll
  const loadMoreRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    const el = loadMoreRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      (entries) => {
        const first = entries[0];
        if (first.isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      { root: null, rootMargin: "300px 0px", threshold: 0 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  // If search/category changes and no local results in current pages, auto fetch next page
  useEffect(() => {
    if (
      locallyFilteredProducts.length === 0 &&
      hasNextPage &&
      !isFetchingNextPage
    ) {
      fetchNextPage();
    }
  }, [
    searchQuery,
    selectedCategoryId,
    locallyFilteredProducts.length,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
  ]);

  // Favorites mutations
  const addToFavoritesMutation = useMutation({
    mutationFn: async (productId: string) => {
      try {
        const response = await apiClient.post(
          "/api/favorites",
          { productId },
          { headers: { "x-user-id": "demo-user" } }
        );
        return response.data;
      } catch (error) {
        throw new Error(handleApiError(error));
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["favorites"] });
    },
  });

  const removeFromFavoritesMutation = useMutation({
    mutationFn: async (productId: string) => {
      try {
        await apiClient.delete(`/api/favorites/${productId}`, {
          headers: { "x-user-id": "demo-user" },
        });
      } catch (error) {
        throw new Error(handleApiError(error));
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["favorites"] });
    },
  });

  const toggleFavorite = useCallback(
    (productId: string) => {
      if (favorites.includes(productId)) {
        removeFromFavoritesMutation.mutate(productId);
        setFavorites((prev) => prev.filter((id) => id !== productId));
      } else {
        addToFavoritesMutation.mutate(productId);
        setFavorites((prev) => [...prev, productId]);
      }
    },
    [favorites, removeFromFavoritesMutation, addToFavoritesMutation]
  );

  const onViewDetails = useCallback(
    (productId: string) => router.push(`/product/${productId}`),
    [router]
  );

  // Boost mutation for producers/admin
  const boostMutation = useMutation({
    mutationFn: async (productId: string) => {
      try {
        const res = await apiClient.post(
          API_ENDPOINTS.PRODUCT_BOOST(productId)
        );
        return res.data;
      } catch (error) {
        throw new Error(handleApiError(error));
      }
    },
    onSuccess: () => {
      // Refresh products so ordering updates
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["infinite-products"] });
    },
  });

  // Companies for stories
  const { data: companies = [] } = useCompanies();

  // Handle company selection
  const handleCompanySelect = useCallback((company: any | null) => {
    setSelectedCompany(company);
  }, []);

  // Stable boost handler to avoid recreating per-card closures
  const handleBoost = useCallback(
    (productId: string) => {
      const product: any = productsById[productId];
      if (!product) return;
      if ((isAdmin || isProducer) && product.producerId === user?.id) {
        setBoostProductId({
          id: product.id,
          producer_id: product.producerId || "",
        });
      }
    },
    [isAdmin, isProducer, user?.id, productsById]
  );

  // Debug logging
  console.log("Categories loading:", categoriesLoading);
  console.log("Products loading:", productsLoading);
  console.log("Products pages:", productsPages);

  // Get all products from pages
  const allProducts =
    productsPages?.pages?.flatMap((page) => page.products || []) || [];
  const hasProducts = allProducts.length > 0;

  // Debug logging for loading states
  console.log("=== DEBUG ===");
  console.log("Categories loading:", categoriesLoading);
  console.log("Products loading:", productsLoading);
  console.log("Has products pages:", !!productsPages);
  console.log("Pages count:", productsPages?.pages?.length || 0);
  console.log("Total products:", allProducts.length);
  console.log("First page data:", productsPages?.pages?.[0]);

  // Determine loading states
  const isLoading = categoriesLoading || productsLoading;
  const showSkeleton = isLoading && !hasProducts;

  // Show skeleton only if everything is loading and we have no data yet
  if (showSkeleton) {
    console.log("Showing loading skeleton - initial load");
    return <HomeProductsSkeleton />;
  }

  return (
    <section id="home-products" className="space-y-8 w-full min-h-screen">
      <div className="">
        {/* Brands */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-6">
            <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-black dark:text-white">
              💕 Brands Stories
            </h2>
            <div className="flex gap-1">
              <div className="w-2 h-2 bg-pink-400 rounded-full animate-ping" />
              <div
                className="w-2 h-2 bg-purple-400 rounded-full animate-ping"
                style={{ animationDelay: "0.5s" }}
              />
              <div
                className="w-2 h-2 bg-rose-400 rounded-full animate-ping"
                style={{ animationDelay: "1s" }}
              />
            </div>
          </div>
          <div className="overflow-x-auto scrollbar-hide">
            <div className="flex items-start gap-6 pb-6 pt-2 min-w-max">
              {/* Company Cards */}
              {companies.map((company: any) => {
                const isSelected = selectedCompany?.id === company.id;
                const label = company.name;
                const logo = company.logoUrl as string | undefined;
                const initials = (label || "?")
                  .split(" ")
                  .slice(0, 2)
                  .map((s: string) => s[0])
                  .join("")
                  .toUpperCase();

                return (
                  <button
                    key={company.id}
                    onClick={() => router.push(`/store/${company.id}`)}
                    className="group relative min-w-[180px] aspect-[4/5] rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
                    aria-pressed={isSelected}
                    title={label}
                  >
                    {/* Background image or initials */}
                    {logo ? (
                      <Image
                        src={logo}
                        alt={label}
                        fill
                        sizes="180px"
                        quality={60}
                        placeholder="empty"
                        loading="lazy"
                        className="object-cover transform group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center bg-gray-200 dark:bg-gray-800">
                        <span className="text-4xl font-bold text-gray-700 dark:text-gray-200">
                          {initials}
                        </span>
                      </div>
                    )}
                    {/* Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent opacity-90" />
                    {/* Content */}
                    <div className="absolute bottom-0 left-0 right-0 p-4">
                      <div className="translate-y-2 group-hover:translate-y-0 transition-transform duration-300">
                        <h3 className="text-white text-lg font-semibold drop-shadow">
                          {label}
                        </h3>
                        {company.location && (
                          <p className="text-white/90 text-xs truncate drop-shadow-sm">
                            {company.location}
                          </p>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Modern Categories Grid with Bigger Images */}
        <div className="mb-12">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-black dark:text-white">
                🎀 Shop by Category
              </h2>
              <div className="flex items-center gap-1">
                <span
                  className="text-base animate-spin"
                  style={{ animationDuration: "3s" }}
                >
                  🌈
                </span>
                <span className="text-sm animate-bounce">✨</span>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-5 gap-3.5 md:gap-6 px-2 md:px-0">
            {categories.map((category) => (
              <CategoryCard
                key={category.id}
                category={category}
                isSelected={selectedCategoryId === category.id}
                onClick={() =>
                  router.push(`/products-search?category=${category.id}`)
                }
                productCount={
                  products.filter((p: any) => p.categoryId === category.id)
                    .length
                }
              />
            ))}
          </div>
        </div>

        {/* Selected Company Bar */}
        {selectedCompany && (
          <SelectedCompanyBar
            company={selectedCompany}
            onClear={() => handleCompanySelect(null)}
          />
        )}

        {/* Cute Trending Products Section */}
        <div className="mb-16">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <h2 className="text-lg sm:text-xl md:text-2xl lg:text-2xl font-bold text-black dark:text-white">
                {selectedCompany
                  ? `${selectedCompany.name} Products`
                  : "🔥 Trending Products"}
              </h2>
              <div className="flex items-center gap-3">
                <span className="px-2 py-1 sm:px-3 sm:py-1.5 md:px-4 md:py-1.5 bg-gradient-to-r from-orange-400 via-red-500 to-pink-500 text-white text-xs sm:text-sm md:text-base font-bold rounded-full animate-pulse shadow-xl">
                  HOT 🔥
                </span>
                <div className="flex gap-2">
                  <span
                    className="text-2xl animate-bounce"
                    style={{ animationDelay: "0s" }}
                  >
                    💫
                  </span>
                  <span
                    className="text-lg animate-bounce"
                    style={{ animationDelay: "0.3s" }}
                  >
                    ⭐
                  </span>
                </div>
              </div>
            </div>
          </div>

          {productsLoading || verifyingProducers ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
              {Array.from({ length: 10 }).map((_, i) => (
                <div
                  key={i}
                  className="aspect-square bg-gray-200 dark:bg-gray-700 animate-pulse rounded-xl"
                />
              ))}
            </div>
          ) : activeProducerProducts.length > 0 ? (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-6 gap-3">
                {activeProducerProducts.slice(0, 12).map((product: Product) => (
                  <div key={product.id} className="group">
                    <ProductCard
                      product={product}
                      isProducer={isProducer}
                      isAdmin={isAdmin}
                      currentUserId={user?.id || undefined}
                      showBoostLabel={true}
                      isFavorited={favorites.includes(product.id)}
                      onToggleFavorite={toggleFavorite}
                      onViewDetails={onViewDetails}
                      onBoost={handleBoost}
                      hideDesc={true}
                    />
                  </div>
                ))}
              </div>

              {/* Enhanced Products Search Banner */}
              {activeProducerProducts.length > 10 && (
                <div className="mt-8">
                  <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-purple-600 via-blue-600 to-blue-600 p-6 md:p-8 shadow-2xl">
                    {/* Animated Background Elements */}
                    <div className="absolute inset-0 overflow-hidden">
                      <div className="absolute -top-4 -right-4 w-24 h-24 bg-white/10 rounded-full animate-pulse" />
                      <div className="absolute top-1/2 -left-6 w-16 h-16 bg-white/5 rounded-full animate-bounce" />
                      <div className="absolute bottom-4 right-1/3 w-8 h-8 bg-white/10 rounded-full animate-ping" />
                    </div>

                    {/* Content */}
                    <div className="relative z-10 text-center">
                      <div className="flex items-center justify-center gap-2 mb-4">
                        <span className="text-2xl sm:text-3xl animate-bounce">
                          🎉
                        </span>
                        <h3 className="text-xl sm:text-2xl md:text-3xl font-bold text-white">
                          More Amazing Products Await!
                        </h3>
                        <span
                          className="text-2xl sm:text-3xl animate-bounce"
                          style={{ animationDelay: "0.3s" }}
                        >
                          ✨
                        </span>
                      </div>

                      <p className="text-white/90 text-sm sm:text-base md:text-lg mb-6 max-w-2xl mx-auto">
                        Discover {activeProducerProducts.length - 10}+ more
                        incredible products in our full collection. Find your
                        perfect style match! 💖
                      </p>

                      <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                        <Button
                          onClick={() => router.push("/products-search")}
                          className="bg-white text-purple-600 hover:bg-gray-50 font-bold px-6 py-3 sm:px-8 sm:py-4 rounded-2xl transition-all duration-300 hover:scale-105 shadow-lg text-sm sm:text-base w-full sm:w-auto"
                        >
                          🔍 Browse All Products
                        </Button>

                        <div className="flex items-center gap-2 text-white/80 text-xs sm:text-sm">
                          <span className="animate-pulse">⚡</span>
                          <span>Advanced search & filters available</span>
                          <span className="animate-pulse">⚡</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="col-span-full py-12 text-center">
              <div className="text-6xl mb-4">📦</div>
              <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-2">
                No products found
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md mx-auto">
                We couldn't find any products matching your criteria. Try
                adjusting your filters.
              </p>
              <Button
                onClick={() => {
                  setSelectedCategoryId("all");
                  setSearchQuery("");
                  setSelectedCompany(null);
                }}
                variant="outline"
                className="border-2 border-dashed border-gray-300 dark:border-gray-600 hover:border-primary transition-colors"
              >
                Clear Filters
              </Button>
            </div>
          )}
        </div>

        {/* Boost Dialog for home products */}
        {boostProductId &&
          (isAdmin || isProducer) &&
          user.id === boostProductId?.producer_id && (
            <BoostProductDialog
              open={!!boostProductId}
              onOpenChange={(open) => {
                if (!open) setBoostProductId(null);
              }}
              productId={boostProductId?.id || ""}
            />
          )}
      </div>
    </section>
  );
}
