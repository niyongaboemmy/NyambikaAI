import { useInfiniteQuery } from "@tanstack/react-query";
import { apiClient, handleApiError, API_ENDPOINTS } from "@/config/api";

export const useInfiniteProducts = (
  categoryId?: string,
  producerId?: string,
  search?: string
) => {
  return useInfiniteQuery({
    queryKey: ["infinite-products", categoryId, producerId, search],
    queryFn: async ({ pageParam = 0 }) => {
      try {
        const params: Record<string, string> = {
          limit: "50",
          offset: pageParam.toString(),
        };

        if (categoryId && categoryId !== "all") {
          params.categoryId = categoryId;
        }
        if (producerId) {
          params.producerId = producerId;
        }
        if (search) {
          params.search = search;
        }

        const response = await apiClient.get(API_ENDPOINTS.PRODUCTS, {
          params,
        });
        return response.data;
      } catch (error) {
        throw new Error(handleApiError(error));
      }
    },
    getNextPageParam: (lastPage, pages) => {
      if (lastPage.length < 50) return undefined;
      return pages.length * 50;
    },
    initialPageParam: 0,
  });
};

