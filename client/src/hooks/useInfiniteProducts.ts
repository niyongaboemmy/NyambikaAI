import { useInfiniteQuery } from "@tanstack/react-query";
import type { Product } from "@shared/schema";

export type ProductsFilters = {
  categoryId?: string | null;
  search?: string | null;
  producerId?: string | null;
  limit?: number; // default 50
};

export function useInfiniteProducts({ categoryId, search, producerId, limit = 50 }: ProductsFilters) {
  return useInfiniteQuery<Product[], Error>({
    queryKey: [
      "products-infinite",
      { categoryId: categoryId || "all", search: search || "", producerId: producerId || "" },
      limit,
    ],
    initialPageParam: 0,
    queryFn: async ({ pageParam }) => {
      const params = new URLSearchParams();
      params.set("limit", String(limit));
      params.set("offset", String(pageParam || 0));
      if (categoryId && categoryId !== "all") params.set("categoryId", categoryId);
      if (search) params.set("search", search);
      if (producerId) params.set("producerId", producerId);

      const res = await fetch(`/api/products?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to fetch products");
      return res.json();
    },
    getNextPageParam: (lastPage, allPages) => {
      const loaded = allPages.reduce((acc, page) => acc + (page?.length || 0), 0);
      return lastPage && lastPage.length === limit ? loaded : undefined;
    },
  });
}
