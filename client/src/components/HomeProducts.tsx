import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, Link } from "wouter";
import { Search, Loader2, Plus, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { Product, Category } from "@shared/schema";
import ProductCard from "@/components/ProductCard";
import { useInfiniteProducts } from "@/hooks/useInfiniteProducts";
import CompactSearchBar from "@/components/feed/CompactSearchBar";
import CategoryPills from "@/components/feed/CategoryPills";
import SelectedCompanyBar from "@/components/feed/SelectedCompanyBar";
import { useCompanies } from "@/hooks/useCompanies";
import { useAuth } from "@/contexts/AuthContext";

export default function HomeProducts() {
  const [, setLocation] = useLocation();
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
      const response = await fetch("/api/categories");
      if (!response.ok) throw new Error("Failed to fetch categories");
      return response.json();
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
  } = useInfiniteProducts({
    categoryId: selectedCategoryId || undefined,
    // do not pass search here; search locally first
    producerId: selectedCompany?.producerId || undefined,
    limit: 50,
  });

  const products = (productsPages?.pages || []).flat();

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
      const response = await fetch("/api/favorites", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": "demo-user",
        },
        body: JSON.stringify({ productId }),
      });
      if (!response.ok) throw new Error("Failed to add to favorites");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["favorites"] });
    },
  });

  const removeFromFavoritesMutation = useMutation({
    mutationFn: async (productId: string) => {
      const response = await fetch(`/api/favorites/${productId}`, {
        method: "DELETE",
        headers: { "x-user-id": "demo-user" },
      });
      if (!response.ok) throw new Error("Failed to remove from favorites");
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
    setLocation(`/product/${productId}`);

  // Companies for stories
  const { data: companies = [] } = useCompanies();

  // Handle company selection
  const handleCompanySelect = (company: any | null) => {
    setSelectedCompany(company);
  };

  return (
    <section id="home-products" className="pt-8 md:pt-10 pb-12">
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

        {/* AI Try-On Banner - Enhanced with Modern AI Design & Mobile Optimized */}
        <div className="mb-4 px-2 sm:px-0">
          <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl border border-gray-200/40 dark:border-white/5 bg-gradient-to-br from-white via-blue-50/50 to-purple-50/30 dark:from-gray-950 dark:via-slate-900/40 dark:to-gray-900/60 backdrop-blur-sm">
            {/* Holographic Aurora Background - Optimized for mobile */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
              <div
                className="absolute -top-20 sm:-top-32 -right-16 sm:-right-20 h-60 sm:h-80 w-60 sm:w-80 rounded-full blur-2xl sm:blur-3xl opacity-30 bg-gradient-to-br from-blue-400/60 via-purple-500/40 to-pink-400/50 animate-pulse"
                style={{ animationDuration: "4s" }}
              />
              <div
                className="absolute -bottom-20 sm:-bottom-32 -left-16 sm:-left-24 h-72 sm:h-96 w-72 sm:w-96 rounded-full blur-2xl sm:blur-3xl opacity-20 bg-gradient-to-tr from-cyan-400/50 via-indigo-500/40 to-violet-500/50 animate-pulse"
                style={{ animationDuration: "6s", animationDelay: "1s" }}
              />
              <div
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-48 sm:h-64 w-48 sm:w-64 rounded-full blur-2xl sm:blur-3xl opacity-15 bg-gradient-to-r from-emerald-400/40 to-teal-500/40 animate-pulse"
                style={{ animationDuration: "8s", animationDelay: "2s" }}
              />
            </div>

            {/* Neural Network Grid Pattern - Simplified for mobile */}
            <div
              aria-hidden
              className="absolute inset-0 opacity-[0.12] sm:opacity-[0.15] mix-blend-multiply dark:opacity-8 sm:dark:opacity-10"
              style={{
                backgroundImage: `
                  radial-gradient(circle at 2px 2px, rgba(59,130,246,0.3) 1px, transparent 1px),
                  linear-gradient(90deg, rgba(59,130,246,0.1) 1px, transparent 1px),
                  linear-gradient(rgba(59,130,246,0.1) 1px, transparent 1px)
                `,
                backgroundSize: "20px 20px, 20px 20px, 20px 20px",
              }}
            />

            {/* Animated AI Particles - Reduced for mobile performance */}
            <div className="pointer-events-none absolute inset-0">
              {/* Main floating particles */}
              <span
                className="absolute left-4 sm:left-8 top-4 sm:top-8 h-1 sm:h-1.5 w-1 sm:w-1.5 rounded-full bg-blue-400/90 animate-ping"
                style={{ animationDuration: "2s", animationDelay: "0s" }}
              />
              <span
                className="absolute right-6 sm:right-12 top-6 sm:top-12 h-1 w-1 rounded-full bg-purple-400/90 animate-ping"
                style={{ animationDuration: "3s", animationDelay: "0.5s" }}
              />
              <span
                className="absolute left-1/4 bottom-6 sm:bottom-10 h-1 sm:h-1.5 w-1 sm:w-1.5 rounded-full bg-cyan-400/90 animate-ping"
                style={{ animationDuration: "2.5s", animationDelay: "1s" }}
              />
              <span
                className="absolute right-1/4 bottom-8 sm:bottom-16 h-1 w-1 rounded-full bg-pink-400/90 animate-ping"
                style={{ animationDuration: "3.5s", animationDelay: "1.5s" }}
              />

              {/* Scanning line effect - Hidden on very small screens */}
              <div className="hidden sm:block absolute inset-0 opacity-20">
                <div
                  className="h-0.5 w-full bg-gradient-to-r from-transparent via-blue-400/60 to-transparent animate-pulse"
                  style={{
                    position: "absolute",
                    top: "30%",
                    animationDuration: "4s",
                    transform: "translateY(-50%)",
                  }}
                />
              </div>
            </div>

            {/* Content - Mobile Optimized Layout */}
            <div className="relative flex flex-col gap-4 sm:gap-6 p-4 sm:p-6 md:p-8">
              <div className="flex-1">
                {/* Status Badge - Mobile Optimized */}
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 mb-3 sm:mb-3">
                  <span className="relative inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-medium text-blue-700 dark:text-blue-200 ring-1 ring-blue-200/50 dark:ring-blue-400/20 bg-white/90 dark:bg-white/5 backdrop-blur-sm w-fit">
                    <span className="relative flex h-2.5 w-2.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
                    </span>
                    AI POWERED
                  </span>
                  <div className="flex sm:hidden items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                    <div className="flex gap-0.5">
                      <div
                        className="h-1 w-1 rounded-full bg-blue-400 animate-pulse"
                        style={{ animationDelay: "0s" }}
                      />
                      <div
                        className="h-1 w-1 rounded-full bg-purple-400 animate-pulse"
                        style={{ animationDelay: "0.2s" }}
                      />
                      <div
                        className="h-1 w-1 rounded-full bg-pink-400 animate-pulse"
                        style={{ animationDelay: "0.4s" }}
                      />
                    </div>
                    <span>Neural processing</span>
                  </div>
                  <div className="hidden md:flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                    <div className="flex gap-0.5">
                      <div
                        className="h-1 w-1 rounded-full bg-blue-400 animate-pulse"
                        style={{ animationDelay: "0s" }}
                      />
                      <div
                        className="h-1 w-1 rounded-full bg-purple-400 animate-pulse"
                        style={{ animationDelay: "0.2s" }}
                      />
                      <div
                        className="h-1 w-1 rounded-full bg-pink-400 animate-pulse"
                        style={{ animationDelay: "0.4s" }}
                      />
                    </div>
                    <span>Neural processing active</span>
                  </div>
                </div>

                {/* Main Title with Enhanced AI Icon - Mobile Optimized */}
                <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 mb-3 sm:mb-3">
                  {/* Enhanced AI Icon with Multiple Animations - Smaller on mobile */}
                  <span className="relative inline-flex items-center justify-center shrink-0 self-start sm:self-auto">
                    {/* Outer rotating ring - Smaller on mobile */}
                    <span
                      className="absolute -inset-3 sm:-inset-4 rounded-full bg-gradient-conic from-blue-500 via-purple-500 to-pink-500 opacity-40 blur-sm animate-spin"
                      style={{ animationDuration: "8s" }}
                    />
                    {/* Inner counter-rotating ring - Smaller on mobile */}
                    <span
                      className="absolute -inset-1.5 sm:-inset-2 rounded-full bg-gradient-conic from-cyan-400 via-blue-500 to-purple-500 opacity-30 blur-sm animate-spin"
                      style={{
                        animationDuration: "6s",
                        animationDirection: "reverse",
                      }}
                    />
                    {/* Icon container - Smaller on mobile */}
                    <span className="relative z-10 rounded-full bg-white/95 dark:bg-slate-900/95 text-blue-600 dark:text-blue-400 p-2 sm:p-3 shadow-lg ring-1 ring-blue-200/50 dark:ring-blue-400/20 backdrop-blur-sm">
                      <Sparkles className="h-6 w-6 sm:h-6 sm:w-6 animate-pulse" />
                    </span>
                    {/* Orbiting dots - Hidden on mobile for performance */}
                    <span
                      className="hidden sm:block absolute top-0 left-1/2 h-1.5 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-blue-400 animate-spin"
                      style={{
                        animationDuration: "3s",
                        transformOrigin: "0 20px",
                      }}
                    />
                  </span>
                  <h1 className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
                    <span className="bg-gradient-to-r from-gray-900 via-blue-800 to-purple-800 dark:from-white dark:via-blue-200 dark:to-purple-200 bg-clip-text text-transparent">
                      Try On with AI
                    </span>
                  </h1>
                </div>

                {/* Description - Mobile Optimized */}
                <p className="text-sm sm:text-sm text-gray-600 dark:text-gray-300 max-w-2xl leading-relaxed mb-4">
                  Upload your photo and see how any outfit looks on you in
                  seconds. Our AI analyzes your body shape, skin tone, and style
                  preferences for the perfect fit.
                </p>

                {/* Feature Pills - Mobile Optimized */}
                <div className="flex flex-wrap gap-1.5 sm:gap-2">
                  <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-blue-100/80 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300">
                    <div className="h-1.5 w-1.5 rounded-full bg-blue-500 animate-pulse" />
                    Real-time
                  </span>
                  <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-purple-100/80 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300">
                    <div className="h-1.5 w-1.5 rounded-full bg-purple-500 animate-pulse" />
                    Smart Style
                  </span>
                  <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-pink-100/80 dark:bg-pink-900/30 text-pink-700 dark:text-pink-300">
                    <div className="h-1.5 w-1.5 rounded-full bg-pink-500 animate-pulse" />
                    Perfect Fit
                  </span>
                </div>
              </div>

              {/* CTA Buttons - Mobile Optimized */}
              <div className="flex flex-col md:flex-row gap-3 w-full sm:w-auto sm:shrink-0">
                <div className="relative group">
                  {/* Enhanced glow effect */}
                  <div className="absolute -inset-1 rounded-xl bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 opacity-50 blur-lg transition-all duration-300 group-hover:opacity-75 group-hover:blur-xl animate-pulse" />
                  <Button
                    asChild
                    className="relative rounded-full w-full sm:w-auto bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-semibold px-6 py-6 sm:py-6 text-base sm:text-sm shadow-lg transition-all duration-300 group-hover:scale-105"
                  >
                    <Link
                      href="/try-on"
                      className="flex items-center justify-center gap-2"
                    >
                      <Sparkles className="h-5 w-5 sm:h-4 sm:w-4" />
                      Start AI Try-On
                    </Link>
                  </Button>
                </div>
                <div></div>
                {/* <Button
                  asChild
                  variant="outline"
                  className="hidden md:flex items-center justify-center w-full sm:w-auto border-blue-200/60 dark:border-white/10 text-blue-700 dark:text-blue-300 hover:bg-blue-50/80 dark:hover:bg-white/5 backdrop-blur-sm font-medium px-6 py-6 sm:py-6 rounded-full text-base sm:text-sm transition-all duration-300 hover:scale-105"
                >
                  <Link
                    href="/products"
                    className="flex items-center justify-center gap-2"
                  >
                    Browse Collection
                  </Link>
                </Button> */}
              </div>
            </div>

            {/* Bottom scanning line */}
            <div
              className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-400/50 to-transparent animate-pulse"
              style={{ animationDuration: "3s" }}
            />
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
                onClick={() => setLocation("/companies")}
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
            resultsCount={locallyFilteredProducts.length}
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
        {productsLoading ? (
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
            {locallyFilteredProducts.map((product: Product) => (
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
        {!productsLoading && locallyFilteredProducts.length === 0 && (
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
