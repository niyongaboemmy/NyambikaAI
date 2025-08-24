import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import TryOnWidget from "@/components/TryOnWidget";
import Footer from "@/components/Footer";
import type { Product, Category } from "@shared/schema";
import { ArrowLeft, ChevronLeft, ChevronRight, Filter } from "lucide-react";
import ProductCard from "@/components/ProductCard";
import { useInfiniteProducts } from "@/hooks/useInfiniteProducts";

export default function TryOnStart() {
  const [selectedProductId, setSelectedProductId] = useState<{
    id: string;
    imageUrl: string;
  } | null>(null);
  const [search, setSearch] = useState("");
  const [categoryId, setCategoryId] = useState<string>("all");
  const [producerId, setProducerId] = useState<string>("all");
  const [minPrice, setMinPrice] = useState<string>("");
  const [maxPrice, setMaxPrice] = useState<string>("");
  const [sortBy, setSortBy] = useState<string>("relevance"); // relevance | price_asc | price_desc | newest
  // infinite scroll
  const loadMoreRef = useRef<HTMLDivElement | null>(null);
  const [favorites, setFavorites] = useState<string[]>([]);

  const toggleFavorite = (productId: string) => {
    setFavorites((prev) =>
      prev.includes(productId)
        ? prev.filter((id) => id !== productId)
        : [...prev, productId]
    );
  };

  // Initialize selected product from URL (?productId=...&productImageUrl=...)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const pid = params.get("productId");
    const pimg = params.get("productImageUrl") || "";
    if (pid)
      setSelectedProductId({
        id: pid,
        imageUrl: pimg,
      });
  }, []);

  // Server-side filtered infinite products (50/page)
  const {
    data: productsPages,
    isLoading: isProductsLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteProducts({
    categoryId,
    producerId: producerId === "all" ? undefined : producerId,
    limit: 50,
  });
  const products = (productsPages?.pages || []).flat();
  const { data: categories } = useQuery<Category[]>({
    queryKey: ["categories"],
    queryFn: async () => {
      const res = await fetch("/api/categories");
      if (!res.ok) throw new Error("Failed to load categories");
      return res.json();
    },
  });
  const { data: producers } = useQuery<any[]>({
    queryKey: ["producers"],
    queryFn: async () => {
      const res = await fetch("/api/producers");
      if (!res.ok) throw new Error("Failed to load producers");
      return res.json();
    },
  });

  // Observe sentinel for infinite load
  useEffect(() => {
    const el = loadMoreRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      { root: null, rootMargin: "600px 0px", threshold: 0 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage, products.length]);

  // Local search across all keys on currently loaded products
  const term = (search || "").trim().toLowerCase();
  const min = minPrice ? parseFloat(minPrice) : null;
  const max = maxPrice ? parseFloat(maxPrice) : null;
  const locallyFilteredProducts = useMemo(() => {
    let list = products.filter((p: any) => {
      // text match
      const textOk = !term
        ? true
        : Object.values(p).some((v) => {
            if (v == null) return false;
            const s =
              typeof v === "string"
                ? v
                : typeof v === "number"
                ? String(v)
                : "";
            return s && s.toLowerCase().includes(term);
          });
      // price
      const priceNum = p?.price != null ? parseFloat(String(p.price)) : NaN;
      const priceOk =
        (min == null || (!Number.isNaN(priceNum) && priceNum >= min)) &&
        (max == null || (!Number.isNaN(priceNum) && priceNum <= max));
      return textOk && priceOk;
    });
    if (sortBy === "price_asc")
      list = [...list].sort(
        (a: any, b: any) => parseFloat(a.price) - parseFloat(b.price)
      );
    if (sortBy === "price_desc")
      list = [...list].sort(
        (a: any, b: any) => parseFloat(b.price) - parseFloat(a.price)
      );
    if (sortBy === "newest")
      list = [...list].sort(
        (a: any, b: any) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    return list;
  }, [products, term, min, max, sortBy]);

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
    search,
    categoryId,
    locallyFilteredProducts.length,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
  ]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 dark:from-background dark:via-slate-900 dark:to-slate-800">
      <main className="pt-24 pb-12 px-4 md:px-6">
        <div className="  space-y-6">
          {/* Header actions */}
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <a
                href="/"
                className="flex items-center gap-2 glassmorphism px-3 py-2 rounded-xl text-sm"
              >
                <ArrowLeft className="h-4 w-4" /> Back Home
              </a>
              <h1 className="text-xl md:text-2xl font-bold gradient-text">
                AI Try-On: Select Product
              </h1>
            </div>
          </div>

          {/* Filters */}
          <Card className="floating-card p-4">
            <CardContent className="p-0">
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                <div className="col-span-1">
                  <label className="text-sm font-semibold block mb-2">
                    Search
                  </label>
                  <div className="relative">
                    <Input
                      placeholder="Search by name..."
                      value={search}
                      onChange={(e) => {
                        setSearch(e.target.value);
                      }}
                      className="rounded-xl"
                    />
                    <Filter className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  </div>
                </div>
                <div className="col-span-1">
                  <label className="text-sm font-semibold block mb-2">
                    Category
                  </label>
                  <select
                    value={categoryId}
                    onChange={(e) => {
                      setCategoryId(e.target.value);
                    }}
                    className="w-full glassmorphism px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700"
                  >
                    <option value="all">All Categories</option>
                    {categories?.map((c) => (
                      <option key={c.id} value={String(c.id)}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="col-span-1">
                  <label className="text-sm font-semibold block mb-2">
                    Company
                  </label>
                  <select
                    value={producerId}
                    onChange={(e) => setProducerId(e.target.value)}
                    className="w-full glassmorphism px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700"
                  >
                    <option value="all">All Companies</option>
                    {producers?.map((p: any) => (
                      <option key={p.id} value={String(p.id)}>
                        {p.businessName || p.name || p.email}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="col-span-1">
                  <label className="text-sm font-semibold block mb-2">
                    Price Range
                  </label>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      placeholder="Min"
                      value={minPrice}
                      onChange={(e) => setMinPrice(e.target.value)}
                      className="rounded-xl"
                    />
                    <span className="text-muted-foreground">-</span>
                    <Input
                      type="number"
                      placeholder="Max"
                      value={maxPrice}
                      onChange={(e) => setMaxPrice(e.target.value)}
                      className="rounded-xl"
                    />
                  </div>
                </div>
                <div className="col-span-1">
                  <label className="text-sm font-semibold block mb-2">
                    Sort
                  </label>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="w-full glassmorphism px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700"
                  >
                    <option value="relevance">Relevance</option>
                    <option value="price_asc">Price: Low to High</option>
                    <option value="price_desc">Price: High to Low</option>
                    <option value="newest">Newest</option>
                  </select>
                </div>
                <div className="col-span-1 flex items-end">
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    {locallyFilteredProducts.length} results shown
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Main content: grid + widget */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Product Grid */}
            <div className="lg:col-span-2 space-y-4">
              <div className="grid grid-cols-8 gap-2">
                {locallyFilteredProducts.map((p) => (
                  <ProductCard
                    key={p.id}
                    product={p as Product}
                    isFavorited={favorites.includes(String(p.id))}
                    onToggleFavorite={toggleFavorite}
                    onViewDetails={() => {}}
                    hideActions
                    onCardClick={() =>
                      setSelectedProductId({
                        id: String(p.id),
                        imageUrl: p.imageUrl,
                      })
                    }
                    selected={String(p.id) === selectedProductId?.id}
                    hideDesc={true}
                  />
                ))}
                {!isProductsLoading && !locallyFilteredProducts.length && (
                  <div className="col-span-full text-sm text-gray-500">
                    No products match your filters.
                  </div>
                )}
                {/* Sentinel */}
                <div ref={loadMoreRef} className="col-span-full h-2" />
                {isFetchingNextPage && (
                  <div className="col-span-full flex justify-center py-4">
                    Loading more...
                  </div>
                )}
              </div>
            </div>

            {/* Try-On widget */}
            <div className="lg:col-span-1 space-y-6 lg:sticky lg:top-24 self-start">
              <Card className="floating-card p-6">
                <CardContent className="p-0">
                  {!selectedProductId ? (
                    <div className="h-[520px] flex items-center justify-center text-center text-gray-600 dark:text-gray-300">
                      <div>
                        <p className="text-lg font-semibold mb-2">
                          Choose a product to begin
                        </p>
                        <p className="text-sm">
                          Select an item from the grid to use AI Try-On
                        </p>
                      </div>
                    </div>
                  ) : (
                    <TryOnWidget
                      productId={selectedProductId.id}
                      productImageUrl={selectedProductId.imageUrl}
                      onUnselectProduct={() => setSelectedProductId(null)}
                    />
                  )}
                </CardContent>
              </Card>
              {selectedProductId && (
                <div>
                  <Button asChild className="w-full gradient-bg text-white">
                    <a href={`/product/${selectedProductId.id}`}>
                      Continue to Product
                    </a>
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
