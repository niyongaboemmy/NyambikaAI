"use client";

import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import {
  Search,
  ChevronDown,
  ArrowLeft,
  X,
  Sparkles,
  AlertCircle,
  RefreshCw,
  ShoppingBag,
  Loader2,
} from "lucide-react";

import { apiClient, API_ENDPOINTS } from "@/config/api";
import ProductCard from "@/components/ProductCard";
import { Button } from "@/components/custom-ui/button";
import { Skeleton } from "@/components/custom-ui/skeleton";
import { Badge } from "@/components/custom-ui/badge";
import { Card, CardContent } from "@/components/custom-ui/card";

// Custom hook for debouncing
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

// Utility function for class names
function cn(...classes: (string | undefined | null | boolean)[]): string {
  return classes.filter(Boolean).join(" ");
}

type SortOption = "newest" | "price-asc" | "price-desc" | "popular";

interface Category {
  id: string;
  name: string;
  nameRw: string;
  imageUrl?: string;
  productCount?: number;
}

interface Product {
  id: string;
  name: string;
  nameRw?: string;
  description: string;
  price: number;
  imageUrl: string;
  images?: string[];
  categoryId: string;
  categoryName?: string;
  producerId: string;
  stockQuantity: number;
  inStock: boolean;
  isApproved: boolean;
  displayOrder: number;
  createdAt: Date;
  updatedAt: Date;
}

// Error boundary fallback component
function ErrorFallback({
  error,
  onRetry,
}: {
  error: Error;
  onRetry: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] p-6 text-center animate-fade-in">
      <div className="bg-red-50 dark:bg-red-900/20 rounded-full p-4 mb-4">
        <AlertCircle className="h-12 w-12 text-red-500" />
      </div>
      <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
        Something went wrong
      </h2>
      <p className="text-gray-600 dark:text-gray-400 mb-4 max-w-md">
        {error.message || "We couldn't load the products. Please try again."}
      </p>
      <Button onClick={onRetry} className="gap-2">
        <RefreshCw className="h-4 w-4" />
        Try again
      </Button>
    </div>
  );
}

// Loading skeleton component
function ProductsSkeleton() {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
      {Array.from({ length: 10 }).map((_, i) => (
        <Card key={i} className="overflow-hidden animate-pulse">
          <div className="aspect-square bg-gray-200 dark:bg-gray-700 loading-skeleton" />
          <CardContent className="p-3">
            <Skeleton className="h-4 w-full mb-2 loading-skeleton" />
            <Skeleton className="h-3 w-2/3 mb-2 loading-skeleton" />
            <Skeleton className="h-4 w-1/2 loading-skeleton" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// Sort dropdown component
function SortDropdown({
  sortBy,
  onSortChange,
}: {
  sortBy: SortOption;
  onSortChange: (sort: SortOption) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);

  const sortOptions = [
    { value: "newest" as const, label: "Newest First" },
    { value: "popular" as const, label: "Most Popular" },
    { value: "price-asc" as const, label: "Price: Low to High" },
    { value: "price-desc" as const, label: "Price: High to Low" },
  ];

  const currentSort = sortOptions.find((option) => option.value === sortBy);

  return (
    <div className="relative">
      <Button
        variant="outline"
        onClick={() => setIsOpen(!isOpen)}
        className="gap-2 min-w-[140px] justify-between"
      >
        {currentSort?.label}
        <ChevronDown
          className={cn(
            "h-4 w-4 transition-transform duration-200",
            isOpen && "rotate-180"
          )}
        />
      </Button>
      {isOpen && (
        <div className="absolute top-full left-0 mt-1 w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md shadow-lg animate-fade-in">
          {sortOptions.map((option) => (
            <button
              key={option.value}
              onClick={() => {
                onSortChange(option.value);
                setIsOpen(false);
              }}
              className={cn(
                "w-full px-3 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors",
                sortBy === option.value && "bg-gray-100 dark:bg-gray-700"
              )}
            >
              {option.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function ClientProductsSearchPage() {
  const searchParams = useSearchParams();
  const router = useRouter();

  // State management
  const [searchQuery, setSearchQuery] = useState(
    searchParams?.get("search") || ""
  );
  const [selectedCategoryId, setSelectedCategoryId] = useState(
    searchParams?.get("category") || "all"
  );

  // Ref for categories scroll container
  const categoriesScrollRef = useRef<HTMLDivElement>(null);
  const [sortBy, setSortBy] = useState<SortOption>(
    (searchParams?.get("sort") as SortOption) || "newest"
  );

  const debouncedSearchQuery = useDebounce(searchQuery, 500);

  // Fetch categories
  const {
    data: categories = [],
    isLoading: categoriesLoading,
    isError: categoriesError,
    refetch: refetchCategories,
  } = useQuery<Category[]>({
    queryKey: ["categories"],
    queryFn: async () => {
      const response = await apiClient.get(API_ENDPOINTS.CATEGORIES);
      return response.data?.data || response.data || [];
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Track if this is initial load from URL params
  const isInitialLoad = useRef(true);

  // Use original categories order (no reordering)
  const orderedCategories = categories;

  // Fetch products with infinite query
  const {
    data: productsPages,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading: productsLoading,
    isError: productsError,
    refetch: refetchProducts,
  } = useInfiniteQuery({
    queryKey: ["products", debouncedSearchQuery, selectedCategoryId, sortBy],
    queryFn: async ({ pageParam = 1 }) => {
      const params = new URLSearchParams({
        page: pageParam.toString(),
        limit: "20",
        ...(debouncedSearchQuery && { search: debouncedSearchQuery }),
        ...(selectedCategoryId !== "all" && { category: selectedCategoryId }),
        ...(sortBy && { sort: sortBy }),
      });

      try {
        const response = await apiClient.get(
          `${API_ENDPOINTS.PRODUCTS}?${params}`
        );

        // Handle different response formats
        if (response.data?.products) {
          return {
            products: response.data.products,
            hasNextPage: response.data.hasNextPage || false,
            totalCount:
              response.data.totalCount || response.data.products.length,
          };
        }

        // Fallback for direct array response
        const products = Array.isArray(response.data) ? response.data : [];

        // Filter by category on client side if API doesn't support it
        const filteredProducts =
          selectedCategoryId !== "all"
            ? products.filter(
                (product) =>
                  product.categoryId === selectedCategoryId ||
                  product.category?.id === selectedCategoryId ||
                  product.category === selectedCategoryId
              )
            : products;

        return {
          products: filteredProducts,
          hasNextPage: false,
          totalCount: filteredProducts.length,
        };
      } catch (error) {
        console.error("Error fetching products:", error);
        return {
          products: [],
          hasNextPage: false,
          totalCount: 0,
        };
      }
    },
    getNextPageParam: (lastPage, pages) => {
      return lastPage.hasNextPage ? pages.length + 1 : undefined;
    },
    initialPageParam: 1,
  });

  // Flatten products from all pages and sort by display_order
  const products = useMemo(() => {
    if (!productsPages?.pages) return [];

    // Flatten all products and remove duplicates by ID
    const allProducts = productsPages.pages.flatMap((page) => page.products);
    const uniqueProducts = allProducts.filter(
      (product, index, array) =>
        array.findIndex((p) => p.id === product.id) === index
    );

    // Sort by display_order (ascending) then by createdAt (descending)
    const sortedProducts = uniqueProducts.sort((a, b) => {
      if (a.displayOrder !== b.displayOrder) {
        return (a.displayOrder || 999) - (b.displayOrder || 999);
      }
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    console.log(
      "📊 Total products after deduplication and sorting:",
      sortedProducts.length
    );
    return sortedProducts;
  }, [productsPages]);

  // Check if we actually have more pages available
  const actualHasNextPage = useMemo(() => {
    if (!productsPages?.pages?.length) return false;
    const lastPage = productsPages.pages[productsPages.pages.length - 1];
    return lastPage?.hasNextPage === true && lastPage?.products?.length > 0;
  }, [productsPages]);

  // Auto-scroll to selected category position on initial page load
  useEffect(() => {
    if (
      isInitialLoad.current &&
      selectedCategoryId !== "all" &&
      categoriesScrollRef.current &&
      categories.length > 0
    ) {
      // Find the index of the selected category
      const selectedIndex = categories.findIndex(
        (cat) => cat.id === selectedCategoryId
      );

      if (selectedIndex > 0) {
        // Only scroll if category is found and not the first one
        // Calculate scroll position based on screen size
        const isMobile = window.innerWidth < 640; // sm breakpoint
        const categoryWidth = isMobile ? 96 : 112; // w-24 on mobile, w-28 on larger screens
        const gap = 12; // gap-3 = 12px
        const containerWidth = categoriesScrollRef.current.clientWidth;

        // Calculate base scroll position
        const baseScrollPosition = selectedIndex * (categoryWidth + gap);

        let scrollPosition;
        if (isMobile) {
          // Center the selected category on mobile
          const centerOffset = (containerWidth - categoryWidth) / 2;
          scrollPosition = Math.max(0, baseScrollPosition - centerOffset);
        } else {
          // Use original behavior for desktop
          scrollPosition = baseScrollPosition;
        }

        categoriesScrollRef.current.scrollTo({
          left: scrollPosition,
          behavior: "smooth",
        });
      }
    }
  }, [selectedCategoryId, categories]); // Trigger when categories load and selectedCategoryId is set

  // Update URL when filters change
  useEffect(() => {
    if (typeof window === "undefined") return;

    const params = new URLSearchParams();
    if (selectedCategoryId !== "all") {
      params.set("category", selectedCategoryId);
    }
    if (searchQuery) {
      params.set("search", searchQuery);
    }
    if (sortBy !== "newest") {
      params.set("sort", sortBy);
    }

    const newUrl = `${window.location.pathname}?${params.toString()}`;
    // Trigger Next.js navigation so layout generateMetadata runs
    router.replace(newUrl);
  }, [selectedCategoryId, searchQuery, sortBy]);

  // Handle retry
  const handleRetry = useCallback(() => {
    if (categoriesError) refetchCategories();
    if (productsError) refetchProducts();
  }, [categoriesError, productsError, refetchCategories, refetchProducts]);

  // Handle category change with conditional auto-scroll
  const handleCategoryChange = useCallback((categoryId: string) => {
    setSelectedCategoryId(categoryId);

    // Mark that user has interacted (no longer initial load)
    isInitialLoad.current = false;
  }, []);

  // Handle sort change
  const handleSortChange = useCallback((sort: SortOption) => {
    setSortBy(sort);
  }, []);

  // Show error state
  if ((categoriesError || productsError) && !productsPages) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <div className="container mx-auto px-4 py-8">
          <ErrorFallback
            error={new Error("Failed to load products")}
            onRetry={handleRetry}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-5">
      <div className="px-2 md:px-0 py-6">
        {/* Header - Mobile Responsive */}
        <div className="flex items-center gap-2 sm:gap-4 mb-0 md:mb-8">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.back()}
            className="lg:hidden touch-feedback p-1.5 sm:p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-200"
          >
            <ArrowLeft className="h-4 w-4 sm:h-5 sm:w-5" />
          </Button>
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="relative">
              <div className="w-8 h-8 sm:w-11 sm:h-11 rounded-xl sm:rounded-2xl bg-gradient-to-br from-blue-500 via-purple-600 to-pink-500 flex items-center justify-center shadow-lg animate-pulse">
                <ShoppingBag className="h-3.5 w-3.5 sm:h-5 sm:w-5 text-white" />
              </div>
              <div className="absolute -top-0.5 -right-0.5 sm:-top-1 sm:-right-1 w-3 h-3 sm:w-4 sm:h-4 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full border border-white dark:border-gray-900 animate-bounce">
                <Sparkles className="h-1.5 w-1.5 sm:h-2 sm:w-2 text-white ml-0.5 mt-0.5" />
              </div>
            </div>
            <div className="min-w-0 flex-1">
              <h1 className="text-lg sm:text-2xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 dark:from-blue-400 dark:via-purple-400 dark:to-pink-400 bg-clip-text text-transparent truncate">
                Discover Products
              </h1>
              <div className="hidden md:inline-block text-xs sm:text-sm text-gray-600 dark:text-gray-400 w-full">
                Find amazing products with AI-powered search ✨
              </div>
            </div>
          </div>
        </div>

        {/* Modern Search Bar */}
        <div className="relative mb-8">
          {/* Enhanced search stats with animation */}
          {debouncedSearchQuery && (
            <div className="mt-4 text-center animate-slide-up">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 border border-blue-200/50 dark:border-blue-700/50 rounded-2xl backdrop-blur-sm">
                <div className="w-3 h-3 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full animate-spin" />
                <span className="text-sm font-medium bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400 bg-clip-text text-transparent">
                  Searching for "{debouncedSearchQuery}"
                </span>
                <Sparkles className="h-4 w-4 text-purple-500 animate-pulse" />
              </div>
            </div>
          )}
        </div>

        {/* Facebook Stories Style Categories */}
        <div className="mb-4 sm:mb-6">
          <div
            ref={categoriesScrollRef}
            className="flex gap-3 overflow-x-auto py-2 scrollbar-hide px-2"
          >
            {categoriesLoading ? (
              // Loading skeletons
              Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  className="flex-shrink-0 w-24 sm:w-28 aspect-[3/4] rounded-2xl overflow-hidden"
                >
                  <Skeleton className="w-full h-full loading-skeleton" />
                </div>
              ))
            ) : (
              <>
                {/* All Categories */}
                <div
                  className={`flex-shrink-0 w-24 sm:w-28 aspect-[3/4] rounded-2xl overflow-hidden cursor-pointer transition-all duration-300 touch-manipulation relative group ${
                    selectedCategoryId === "all"
                      ? "ring-4 ring-offset-2 ring-blue-500 shadow-2xl transform"
                      : "hover:shadow-lg hover:scale-102"
                  }`}
                  onClick={() => handleCategoryChange("all")}
                >
                  {/* Background with gradient overlay */}
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-500 via-purple-600 to-pink-500">
                    <div className="absolute inset-0 bg-black/20" />
                  </div>

                  {/* Floating emoji icon */}
                  <div className="absolute top-2 left-2 text-xl sm:text-2xl animate-bounce">
                    🛍️
                  </div>

                  {/* Floating title */}
                  <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/80 via-black/40 to-transparent">
                    <h3 className="text-white font-bold text-xs sm:text-sm truncate">
                      All Products
                    </h3>
                    <p className="text-white/80 text-[10px] sm:text-xs truncate">
                      Browse all
                    </p>
                  </div>

                  {/* Selection indicator */}
                  {selectedCategoryId === "all" && (
                    <div className="absolute top-2 right-2 w-5 h-5 bg-white rounded-full flex items-center justify-center shadow-lg animate-pulse">
                      <div className="w-2.5 h-2.5 bg-blue-500 rounded-full" />
                    </div>
                  )}
                </div>

                {/* Category Items */}
                {orderedCategories.map((category, index) => (
                  <div
                    key={category.id}
                    className={`flex-shrink-0 cursor-pointer transition-all duration-300 touch-manipulation animate-fade-in ${
                      selectedCategoryId === category.id
                        ? "transform scale-110"
                        : "hover:scale-102"
                    }`}
                    style={{ animationDelay: `${index * 100}ms` }}
                    onClick={() => handleCategoryChange(category.id)}
                  >
                    {/* Gradient Border Wrapper */}
                    <div
                      className={`relative rounded-2xl transition-all duration-300 ${
                        selectedCategoryId === category.id
                          ? "p-1 bg-gradient-to-r from-blue-500 via-purple-600 to-pink-500 shadow-2xl"
                          : "p-0"
                      }`}
                    >
                      <div className="w-24 sm:w-28 aspect-[3/4] rounded-2xl overflow-hidden relative group hover:shadow-lg transition-all duration-300">
                        {/* Background Image */}
                        <div className="absolute inset-0">
                          {category.imageUrl ? (
                            <>
                              <img
                                src={category.imageUrl}
                                alt={category.name}
                                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                              />
                              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                            </>
                          ) : (
                            <>
                              <div className="w-full h-full bg-gradient-to-br from-gray-200 via-gray-300 to-gray-400 dark:from-gray-700 dark:via-gray-600 dark:to-gray-500" />
                              <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/20 to-transparent" />
                              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-2xl sm:text-3xl opacity-60">
                                📦
                              </div>
                            </>
                          )}
                        </div>

                        {/* Floating sparkle effect */}
                        <div className="absolute top-1.5 right-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                          <Sparkles className="h-3 w-3 text-white animate-pulse" />
                        </div>

                        {/* Floating title */}
                        <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/90 via-black/50 to-transparent">
                          <h3 className="text-white font-bold text-xs sm:text-sm truncate">
                            {category.name}
                          </h3>
                          {category.productCount && (
                            <p className="text-white/80 text-[10px] sm:text-xs truncate">
                              {category.productCount} items
                            </p>
                          )}
                        </div>

                        {/* Selection indicator */}
                        {selectedCategoryId === category.id && (
                          <div className="absolute top-2 right-2 w-5 h-5 bg-white rounded-full flex items-center justify-center shadow-lg animate-pulse">
                            <div className="w-2.5 h-2.5 bg-blue-500 rounded-full" />
                          </div>
                        )}

                        {/* Hover overlay */}
                        <div className="absolute inset-0 bg-blue-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                      </div>
                    </div>
                  </div>
                ))}
              </>
            )}
          </div>
        </div>

        {/* Modern Lightweight Filter Bar - Sticky */}
        <div className="mb-4 sm:mb-6 z-10">
          <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border border-gray-200/50 dark:border-gray-700/50 rounded-2xl shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-4 p-2 sm:p-2 pl-2 md:pl-4">
              {/* Left side - Product count and filters */}
              <div className="flex items-center gap-2 sm:gap-3 flex-wrap min-w-0">
                <div className="flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-gradient-to-r from-blue-500 to-purple-500"></div>
                  <span className="text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300">
                    {products.length}
                  </span>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    product{products.length !== 1 ? "s" : ""}
                  </span>
                </div>

                {selectedCategoryId !== "all" && (
                  <div className="flex items-center gap-1 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/30 dark:to-purple-900/30 border border-blue-200/50 dark:border-blue-700/50 px-2 sm:px-3 py-1 rounded-full">
                    <span className="text-xs font-medium text-blue-700 dark:text-blue-300 truncate max-w-[80px] sm:max-w-[120px]">
                      {categories.find((c) => c.id === selectedCategoryId)
                        ?.name || "Category"}
                    </span>
                    <button
                      onClick={() => handleCategoryChange("all")}
                      className="ml-1 w-4 h-4 flex items-center justify-center rounded-full hover:bg-blue-200/50 dark:hover:bg-blue-800/50 transition-colors touch-manipulation"
                    >
                      <X className="h-2.5 w-2.5 text-blue-600 dark:text-blue-400" />
                    </button>
                  </div>
                )}
              </div>

              {/* Right side - Sort dropdown */}
              <div className="flex-shrink-0 self-start sm:self-auto">
                <SortDropdown sortBy={sortBy} onSortChange={handleSortChange} />
              </div>
            </div>
          </div>
        </div>

        {/* Results Info */}
        {!productsLoading && (
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {products.length > 0 ? (
                <>
                  Showing {products.length} product
                  {products.length !== 1 ? "s" : ""}
                  {debouncedSearchQuery && <> for "{debouncedSearchQuery}"</>}
                </>
              ) : (
                "No products found"
              )}
            </p>
          </div>
        )}

        {/* Products Grid */}
        <div className="space-y-6">
          {productsLoading && !productsPages ? (
            <ProductsSkeleton />
          ) : products.length > 0 ? (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2 sm:gap-3 md:gap-4">
                {products.map((product, index) => (
                  <div
                    key={product.id}
                    className="animate-fade-in touch-feedback transform transition-all duration-300 hover:scale-105 hover:shadow-lg"
                    style={{
                      animationDelay: `${index * 50}ms`,
                    }}
                  >
                    <ProductCard
                      product={product}
                      onToggleFavorite={(productId: string) => {
                        // TODO: Implement favorite functionality
                        console.log("Toggle favorite for product:", productId);
                      }}
                      onViewDetails={(productId: string) => {
                        router.push(`/product/${productId}`);
                      }}
                      hideActions={true}
                      compact={true}
                    />
                  </div>
                ))}
              </div>

              {/* Load More Button */}
              {(hasNextPage || actualHasNextPage) && (
                <div className="flex justify-center pt-6 pb-4">
                  <Button
                    onClick={() => fetchNextPage()}
                    disabled={isFetchingNextPage}
                    className="touch-feedback gap-2 px-6 sm:px-8 py-2.5 sm:py-3 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-medium shadow-lg hover:shadow-xl transform transition-all duration-300 hover:scale-105 text-sm sm:text-base"
                  >
                    {isFetchingNextPage ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span className="hidden sm:inline">
                          Loading more products...
                        </span>
                        <span className="sm:hidden">Loading...</span>
                      </>
                    ) : (
                      <>
                        <span className="hidden sm:inline">
                          Load More Products
                        </span>
                        <span className="sm:hidden">Load More</span>
                        <div className="w-2 h-2 bg-white/30 rounded-full animate-pulse" />
                      </>
                    )}
                  </Button>
                </div>
              )}

              {/* Loading More Indicator */}
              {isFetchingNextPage && (
                <div className="flex justify-center items-center py-4 text-sm text-gray-500 dark:text-gray-400">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-1 h-1 bg-blue-500 rounded-full animate-bounce"
                      style={{ animationDelay: "0ms" }}
                    />
                    <div
                      className="w-1 h-1 bg-purple-500 rounded-full animate-bounce"
                      style={{ animationDelay: "150ms" }}
                    />
                    <div
                      className="w-1 h-1 bg-blue-500 rounded-full animate-bounce"
                      style={{ animationDelay: "300ms" }}
                    />
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 text-center animate-fade-in">
              <div className="bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700 rounded-full p-8 mb-6 shadow-inner">
                <Search className="h-16 w-16 text-gray-400 animate-pulse" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                No products found
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md leading-relaxed">
                {debouncedSearchQuery
                  ? `We couldn't find any products matching "${debouncedSearchQuery}". Try adjusting your search or filters.`
                  : "No products available in this category."}
              </p>
              {(debouncedSearchQuery || selectedCategoryId !== "all") && (
                <Button
                  variant="outline"
                  onClick={() => {
                    setSearchQuery("");
                    setSelectedCategoryId("all");
                  }}
                  className="touch-feedback gap-2 px-6 py-3 rounded-full border-2 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all duration-300 hover:scale-105"
                >
                  <X className="h-4 w-4" />
                  Clear filters
                </Button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Custom CSS for animations */}
      <style jsx>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes slide-up {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes pulse {
          0%,
          100% {
            opacity: 1;
          }
          50% {
            opacity: 0.5;
          }
        }

        @keyframes shimmer {
          0% {
            background-position: -200px 0;
          }
          100% {
            background-position: calc(200px + 100%) 0;
          }
        }

        @keyframes bounce-in {
          0% {
            opacity: 0;
            transform: scale(0.3);
          }
          50% {
            opacity: 1;
            transform: scale(1.05);
          }
          70% {
            transform: scale(0.9);
          }
          100% {
            opacity: 1;
            transform: scale(1);
          }
        }

        .animate-fade-in {
          animation: fade-in 0.6s ease-out forwards;
        }

        .animate-slide-up {
          animation: slide-up 0.5s ease-out forwards;
        }

        .animate-bounce-in {
          animation: bounce-in 0.8s cubic-bezier(0.68, -0.55, 0.265, 1.55)
            forwards;
        }

        .animate-pulse {
          animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }

        .animate-shimmer {
          background: linear-gradient(
            90deg,
            #f0f0f0 0px,
            #e0e0e0 40px,
            #f0f0f0 80px
          );
          background-size: 200px;
          animation: shimmer 1.5s ease-in-out infinite;
        }

        /* Enhanced mobile optimizations */
        @media (max-width: 640px) {
          .container {
            padding-left: 0.75rem;
            padding-right: 0.75rem;
          }

          .search-input {
            font-size: 16px; /* Prevents zoom on iOS */
            padding: 0.875rem 2.5rem 0.875rem 2.5rem;
          }

          .category-scroll {
            -webkit-overflow-scrolling: touch;
            scrollbar-width: none;
            -ms-overflow-style: none;
            padding-bottom: 0.5rem;
          }

          .category-scroll::-webkit-scrollbar {
            display: none;
          }

          .mobile-grid {
            grid-template-columns: repeat(2, 1fr);
            gap: 0.75rem;
          }

          .mobile-card {
            border-radius: 1rem;
            overflow: hidden;
          }
        }

        /* Scrollbar hiding utilities */
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }

        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }

        /* Tablet optimizations */
        @media (min-width: 641px) and (max-width: 1024px) {
          .tablet-grid {
            grid-template-columns: repeat(3, 1fr);
            gap: 1rem;
          }
        }

        /* Desktop optimizations */
        @media (min-width: 1025px) {
          .desktop-grid {
            grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
            gap: 1.5rem;
          }
        }

        /* Ultra-wide screen optimizations */
        @media (min-width: 1920px) {
          .ultrawide-grid {
            grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
            gap: 2rem;
          }
        }

        /* Smooth transitions for all interactive elements */
        .smooth-transition {
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }

        /* Enhanced touch feedback */
        .touch-feedback {
          transition: transform 0.15s ease;
        }

        .touch-feedback:active {
          transform: scale(0.95);
        }

        .touch-feedback:hover {
          transform: translateY(-2px);
        }

        /* Loading states with better animations */
        .loading-skeleton {
          background: linear-gradient(
            90deg,
            rgba(240, 240, 240, 0.8) 25%,
            rgba(224, 224, 224, 0.8) 50%,
            rgba(240, 240, 240, 0.8) 75%
          );
          background-size: 200% 100%;
          animation: shimmer 1.8s infinite;
        }

        /* Dark mode loading skeleton */
        .dark .loading-skeleton {
          background: linear-gradient(
            90deg,
            rgba(55, 65, 81, 0.8) 25%,
            rgba(75, 85, 99, 0.8) 50%,
            rgba(55, 65, 81, 0.8) 75%
          );
        }

        /* Gradient animations */
        .gradient-animate {
          background-size: 200% 200%;
          animation: gradient-shift 3s ease infinite;
        }

        @keyframes gradient-shift {
          0% {
            background-position: 0% 50%;
          }
          50% {
            background-position: 100% 50%;
          }
          100% {
            background-position: 0% 50%;
          }
        }

        /* Stagger animation for grid items */
        .stagger-item {
          opacity: 0;
          animation: fade-in 0.6s ease-out forwards;
        }

        .stagger-item:nth-child(1) {
          animation-delay: 0.1s;
        }
        .stagger-item:nth-child(2) {
          animation-delay: 0.2s;
        }
        .stagger-item:nth-child(3) {
          animation-delay: 0.3s;
        }
        .stagger-item:nth-child(4) {
          animation-delay: 0.4s;
        }
        .stagger-item:nth-child(5) {
          animation-delay: 0.5s;
        }
        .stagger-item:nth-child(6) {
          animation-delay: 0.6s;
        }

        /* Focus states for accessibility */
        .focus-ring:focus {
          outline: 2px solid #3b82f6;
          outline-offset: 2px;
        }

        /* Reduced motion support */
        @media (prefers-reduced-motion: reduce) {
          .animate-fade-in,
          .animate-slide-up,
          .animate-bounce-in,
          .animate-pulse,
          .animate-shimmer,
          .smooth-transition,
          .touch-feedback {
            animation: none;
            transition: none;
          }
        }
      `}</style>
    </div>
  );
}
