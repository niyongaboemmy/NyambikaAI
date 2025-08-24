import { useQuery } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { useLocation, useParams } from "wouter";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Loader2 } from "lucide-react";
import Footer from "@/components/Footer";
import type { Product } from "@shared/schema";
import ProductCard from "@/components/ProductCard";
import { useInfiniteProducts } from "@/hooks/useInfiniteProducts";

type Producer = {
  id: string;
  fullName?: string;
  fullNameRw?: string;
  businessName?: string;
  profileImage?: string;
  location?: string;
  phone?: string;
};

export default function ProducerDetail() {
  const { id } = useParams();
  const [, setLocation] = useLocation();
  const [favorites, setFavorites] = useState<string[]>([]);

  const toggleFavorite = (productId: string) => {
    setFavorites((prev) =>
      prev.includes(productId)
        ? prev.filter((pid) => pid !== productId)
        : [...prev, productId]
    );
  };

  const {
    data: producer,
    isLoading: isProducerLoading,
    isError: isProducerError,
  } = useQuery<Producer>({
    queryKey: ["producer", id],
    enabled: !!id,
    queryFn: async () => {
      const res = await fetch(`/api/producers/${id}`);
      if (!res.ok) throw new Error("Failed to fetch producer");
      return res.json();
    },
  });

  // Infinite products for this producer (50/page)
  const {
    data: productsPages,
    isLoading: areProductsLoading,
    isError: areProductsError,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteProducts({ producerId: id || null, limit: 50 });
  const products = (productsPages?.pages || []).flat();

  // Sentinel
  const moreRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    const el = moreRef.current;
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

  // If producer changes or initial load yields no items, auto fetch next page
  useEffect(() => {
    if (products.length === 0 && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [id, products.length, hasNextPage, isFetchingNextPage, fetchNextPage]);

  return (
    <div className="min-h-screen bg-background">
      <main className="pt-24 pb-12 px-4 md:px-6  ">
        {isProducerLoading ? (
          <div className="flex items-center gap-6 mb-8">
            <Skeleton className="w-20 h-20 rounded-full" />
            <div className="space-y-2 w-full max-w-md">
              <Skeleton className="h-7 w-2/3" />
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-4 w-1/3" />
            </div>
          </div>
        ) : isProducerError ? (
          <div className="mb-8 rounded-md border border-destructive/30 bg-destructive/10 p-4 text-destructive">
            <p className="text-sm font-medium">
              Failed to load producer details.
            </p>
          </div>
        ) : (
          producer && (
            <div className="flex items-center gap-6 mb-8">
              <img
                src={producer.profileImage || "/placeholder-avatar.png"}
                alt={producer.businessName || producer.fullName || "Producer"}
                className="w-20 h-20 rounded-full object-cover"
              />
              <div>
                <h1 className="text-2xl md:text-3xl font-bold">
                  {producer.businessName || producer.fullName}
                </h1>
                {producer.fullNameRw && (
                  <p className="text-muted-foreground">{producer.fullNameRw}</p>
                )}
                {producer.location && (
                  <p className="text-muted-foreground">{producer.location}</p>
                )}
              </div>
            </div>
          )
        )}

        <h2 className="text-2xl font-semibold mb-4">Products</h2>
        {areProductsLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {Array.from({ length: 8 }).map((_, i) => (
              <Card key={i} className="p-4">
                <Skeleton className="w-full h-40 rounded-lg mb-3" />
                <Skeleton className="h-5 w-3/4" />
              </Card>
            ))}
          </div>
        ) : areProductsError ? (
          <div className="rounded-md border border-destructive/30 bg-destructive/10 p-4 text-destructive">
            <p className="text-sm font-medium">Failed to load products.</p>
          </div>
        ) : products && products.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {products.map((prod) => (
              <ProductCard
                key={prod.id}
                product={prod as Product}
                isFavorited={favorites.includes(prod.id)}
                onToggleFavorite={toggleFavorite}
                onViewDetails={(pid) => setLocation(`/product/${pid}`)}
              />
            ))}
            {/* Sentinel and loader */}
            <div ref={moreRef} className="col-span-full h-2" />
            {isFetchingNextPage && (
              <div className="col-span-full flex justify-center py-6">
                <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
              </div>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-2 text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span className="text-sm">
              No products found for this producer.
            </span>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
