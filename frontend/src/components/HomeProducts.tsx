import { useEffect, useMemo, useRef, useState } from "react";
import { Search, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { Product, Category } from "@/shared/schema";
import ProductCard from "@/components/ProductCard";
import { useInfiniteProducts } from "@/hooks/useInfiniteProducts";
import CompactSearchBar from "@/components/feed/CompactSearchBar";
import CategoryPills from "@/components/feed/CategoryPills";
import SelectedCompanyBar from "@/components/feed/SelectedCompanyBar";
import { useCompanies } from "@/hooks/useCompanies";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { apiClient, handleApiError } from "@/config/api";

// Page-level skeleton shown during initial load
function HomeProductsSkeleton() {
  return (
    <section id="home-products">
      <div className="animate-in fade-in-0 duration-500">
        {/* Header skeleton */}
        <div className="flex items-center justify-between mb-3">
          <div>
            <div className="h-6 w-40 rounded bg-gray-200 dark:bg-gray-700 animate-pulse mb-2" />
            <div className="h-4 w-56 rounded bg-gray-200 dark:bg-gray-700 animate-pulse" />
          </div>
          <div className="h-9 w-9 rounded-full bg-gray-200 dark:bg-gray-700 animate-pulse" />
        </div>

        {/* Stories skeleton */}
        <div className="mb-2 overflow-x-auto">
          <div className="flex items-start gap-3 pb-2 min-w-max px-1 pt-2">
            {Array.from({ length: 7 }).map((_, i) => (
              <div
                key={i}
                className="flex flex-col items-center gap-2 min-w-[80px]"
              >
                <div className="h-[76px] w-[76px] rounded-full bg-gray-200 dark:bg-gray-700 animate-pulse" />
                <div className="h-3 w-14 rounded bg-gray-200 dark:bg-gray-700 animate-pulse" />
              </div>
            ))}
          </div>
        </div>

        {/* Category pills skeleton */}
        <div className="flex gap-2 mb-2 px-1 flex-wrap">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="h-8 w-20 rounded-full bg-gray-200 dark:bg-gray-700 animate-pulse"
            />
          ))}
        </div>

        {/* Products grid skeleton */}
        <div className="grid grid-cols-12 gap-2 md:gap-3 px-1">
          {Array.from({ length: 12 }).map((_, i) => (
            <div
              key={i}
              className="col-span-6 md:col-span-4 lg:col-span-2 aspect-square bg-gray-200 dark:bg-gray-700 animate-pulse rounded-lg"
            />
          ))}
        </div>
      </div>
    </section>
  );
}

export default function HomeProducts() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [searchExpanded, setSearchExpanded] = useState(false);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>("all");
  const [selectedCompany, setSelectedCompany] = useState<any>(null);
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  const isProducer = user?.role === "producer";

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
        const response = await apiClient.get('/api/categories');
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

  const products = (productsPages?.pages || []).flat();

  // Build unique producer ids present in current products
  const producerIds = useMemo(() => {
    const ids = new Set<string>();
    for (const p of products as any[]) {
      if (p?.producerId) ids.add(String(p.producerId));
    }
    return Array.from(ids);
  }, [products]);

  // Fetch verification status for those producers (status lives on producer)
  const { data: verifiedMap = {}, isLoading: verifyingProducers } = useQuery<{ [id: string]: boolean }>({
    queryKey: ["producers-verified-map", producerIds],
    queryFn: async () => {
      const entries: Array<[string, boolean]> = await Promise.all(
        producerIds.map(async (id) => {
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
    enabled: producerIds.length > 0,
    staleTime: 60_000,
  });

  // Local search across all keys
  const term = (debouncedSearch || "").trim().toLowerCase();
  const locallyFilteredProducts = useMemo(() => {
    return products.filter((p: any) => {
      if (!term) return true;
      return Object.values(p).some((v) => {
        if (v == null) return false;
        const s =
          typeof v === "string" ? v : typeof v === "number" ? String(v) : "";
        return s && s.toLowerCase().includes(term);
      });
    });
  }, [products, term]);

  // Apply active-producer filter
  const activeProducerProducts = useMemo(() => {
    if (!producerIds.length) return locallyFilteredProducts;
    return locallyFilteredProducts.filter((p: any) => {
      const pid = p?.producerId ? String(p.producerId) : undefined;
      if (!pid) return true; // keep if no producerId info
      const v = (verifiedMap as any)[pid];
      // Only show when verified === true
      return v === true;
    });
  }, [locallyFilteredProducts, producerIds.length, verifiedMap]);

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
      { root: null, rootMargin: "600px 0px", threshold: 0 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage, products.length]);

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
        const response = await apiClient.post('/api/favorites', 
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
          headers: { "x-user-id": "demo-user" }
        });
      } catch (error) {
        throw new Error(handleApiError(error));
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["favorites"] });
    },
  });

  const toggleFavorite = (productId: string) => {
    if (favorites.includes(productId)) {
      removeFromFavoritesMutation.mutate(productId);
      setFavorites((prev) => prev.filter((id) => id !== productId));
    } else {
      addToFavoritesMutation.mutate(productId);
      setFavorites((prev) => [...prev, productId]);
    }
  };

  const onViewDetails = (productId: string) =>
    router.push(`/product/${productId}`);

  // Companies for stories
  const { data: companies = [] } = useCompanies();

  // Handle company selection
  const handleCompanySelect = (company: any | null) => {
    setSelectedCompany(company);
  };

  // Show page-level skeleton as early as possible (before first page is present)
  const noFirstPageYet =
    !productsPages || !(productsPages.pages && productsPages.pages.length > 0);
  const initialLoading = categoriesLoading || productsLoading || noFirstPageYet;
  if (initialLoading) {
    return <HomeProductsSkeleton />;
  }

  return (
    <section id="home-products" className="">
      <div className=" ">
        {/* Header with Search toggle and Add Product if admin/producer */}
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="text-2xl font-bold">
              {selectedCompany ? selectedCompany.name : "Discover"}
            </h2>
            <p className="text-sm text-muted-foreground">
              {selectedCompany
                ? selectedCompany.location || "Fashion Brand"
                : "Explore fashion from all brands"}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                setSearchExpanded((v) => !v);
                if (!searchExpanded) {
                  setTimeout(() => {
                    const input = document.querySelector(
                      'input[type="text"]'
                    ) as HTMLInputElement | null;
                    input?.focus();
                  }, 80);
                } else {
                  setSearchQuery("");
                }
              }}
              className={`p-2 rounded-full transition-all duration-200 ${
                searchExpanded
                  ? "bg-foreground text-background"
                  : "hover:bg-muted"
              }`}
              aria-label="Toggle search"
            >
              <Search className="h-6 w-6" />
            </button>
          </div>
        </div>

        {/* Instagram Stories - Companies selector */}
        <div className="mb-1.5">
          <div className="overflow-x-auto scrollbar-hide">
            <div className="flex items-start gap-3 pb-2 min-w-max px-1 pt-2">
              {/* All Brands */}
              <button
                onClick={() => handleCompanySelect(null)}
                className="flex flex-col items-center gap-2 group min-w-[80px]"
                aria-label="Show all brands"
              >
                <div
                  className={`relative transition-all duration-300 ${
                    !selectedCompany
                      ? "bg-gradient-to-tr from-purple-500 via-pink-500 to-red-500 shadow-lg scale-110"
                      : "bg-gray-300 dark:bg-gray-600 group-hover:bg-gray-400 dark:group-hover:bg-gray-500"
                  } p-[3px] rounded-full group-hover:scale-105`}
                >
                  <div className="bg-white dark:bg-slate-900 rounded-full p-[2px]">
                    <div className="h-[72px] w-[72px] rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center relative overflow-hidden">
                      <span className="text-white font-bold text-xl z-10">
                        All
                      </span>
                      <div className="absolute inset-0 bg-gradient-to-br from-transparent via-white/10 to-transparent"></div>
                    </div>
                  </div>
                </div>
                <span className="text-xs font-medium text-gray-700 dark:text-gray-300 text-center leading-tight">
                  All Brands
                </span>
              </button>

              {/* Company Stories */}
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
                    onClick={() => handleCompanySelect(company)}
                    className="flex flex-col items-center gap-2 group min-w-[80px]"
                    aria-pressed={isSelected}
                    title={label}
                  >
                    <div
                      className={`relative transition-all duration-300 ${
                        isSelected
                          ? "bg-gradient-to-tr from-purple-500 via-pink-500 to-red-500 shadow-lg scale-110"
                          : "bg-gray-300 dark:bg-gray-600 group-hover:bg-gradient-to-tr group-hover:from-purple-400 group-hover:via-pink-400 group-hover:to-red-400"
                      } p-[3px] rounded-full group-hover:scale-105`}
                    >
                      <div className="bg-white dark:bg-slate-900 rounded-full p-[2px]">
                        <div className="h-[72px] w-[72px] rounded-full overflow-hidden bg-gray-100 dark:bg-gray-800 flex items-center justify-center relative">
                          {logo ? (
                            <img
                              src={logo}
                              alt={label}
                              className="h-full w-full object-cover"
                              loading="lazy"
                            />
                          ) : (
                            <span className="text-xl font-bold text-gray-600 dark:text-gray-300">
                              {initials}
                            </span>
                          )}
                          <div className="absolute inset-0 bg-gradient-to-br from-transparent via-white/5 to-transparent"></div>
                        </div>
                      </div>
                      {isSelected && (
                        <div className="absolute -bottom-1 -right-1 h-6 w-6 bg-green-500 border-2 border-white dark:border-slate-900 rounded-full flex items-center justify-center">
                          <div className="h-2 w-2 bg-white rounded-full"></div>
                        </div>
                      )}
                    </div>
                    <span className="text-xs font-medium text-gray-700 dark:text-gray-300 text-center leading-tight max-w-[75px] truncate">
                      {label}
                    </span>
                  </button>
                );
              })}

              {/* View All Companies */}
              <button
                onClick={() => router.push("/companies")}
                className="flex flex-col items-center gap-2 group min-w-[80px]"
                aria-label="View all companies"
                title="View all companies"
              >
                <div className="relative bg-gray-200 dark:bg-gray-700 p-[3px] rounded-full group-hover:bg-gradient-to-tr group-hover:from-blue-400 group-hover:via-purple-400 group-hover:to-pink-400 transition-all duration-300 group-hover:scale-105">
                  <div className="bg-white dark:bg-slate-900 rounded-full p-[2px]">
                    <div className="h-[72px] w-[72px] rounded-full bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700 flex items-center justify-center relative border-2 border-dashed border-gray-300 dark:border-gray-600">
                      <div className="flex flex-col items-center">
                        <span className="text-2xl font-bold text-gray-400 dark:text-gray-500">
                          +
                        </span>
                        <span className="text-[10px] font-medium text-gray-400 dark:text-gray-500">
                          More
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
                <span className="text-xs font-medium text-gray-500 dark:text-gray-400 text-center leading-tight">
                  View All
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* Category filter bar */}
        <CategoryPills
          categories={[
            { id: "all", name: "All", nameRw: "Byose" } as any,
            ...categories,
          ]}
          selectedId={selectedCategoryId}
          onSelect={setSelectedCategoryId}
          loading={categoriesLoading}
        />

        {/* Compact Search Bar */}
        {searchExpanded && (
          <CompactSearchBar
            value={searchQuery}
            onChange={setSearchQuery}
            onCancel={() => {
              setSearchExpanded(false);
              setSearchQuery("");
            }}
            placeholder={
              selectedCompany
                ? `Search ${selectedCompany.name}...`
                : "Search products..."
            }
            resultsCount={activeProducerProducts.length}
            stickyTopClass="top-20"
          />
        )}

        {/* Selected Company Bar */}
        {selectedCompany && (
          <SelectedCompanyBar
            company={selectedCompany}
            onClear={() => handleCompanySelect(null)}
          />
        )}

        {/* Products Grid - Instagram Style */}
        {productsLoading || verifyingProducers ? (
          <div className="grid grid-cols-12 gap-2 md:gap-3 px-4 lg:px-0">
            {Array.from({ length: 12 }).map((_, i) => (
              <div
                key={i}
                className="col-span-6 md:col-span-4 lg:col-span-2 aspect-square bg-gray-200 dark:bg-gray-700 animate-pulse rounded-lg"
              />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-12 gap-2 md:gap-3">
            {activeProducerProducts.map((product: Product) => (
              <ProductCard
                key={product.id}
                product={product}
                isFavorited={favorites.includes(product.id)}
                onToggleFavorite={toggleFavorite}
                onViewDetails={onViewDetails}
                hideDesc={true}
              />
            ))}
            {/* Sentinel */}
            <div ref={loadMoreRef} className="col-span-full h-2" />
            {isFetchingNextPage && (
              <div className="col-span-full flex justify-center py-4">
                <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
              </div>
            )}
          </div>
        )}

        {/* Empty State */}
        {!productsLoading && !verifyingProducers && activeProducerProducts.length === 0 && (
          <div className="text-center py-16">
            <div className="rounded-3xl p-12 max-w-md mx-auto border">
              <Search className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-2xl font-bold mb-2">No Products Found</h3>
              <p className="text-muted-foreground">
                Try different keywords or choose another category
              </p>
              <Button
                variant="outline"
                onClick={() => setSearchQuery("")}
                className="mt-4"
              >
                Clear Search
              </Button>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
