import { useInfiniteQuery } from "@tanstack/react-query";
import { apiClient, handleApiError, API_ENDPOINTS } from "@/config/api";
import type { Product } from "@/shared/types/product";

interface ProductsResponse {
  products: Product[];
  hasMore: boolean;
  page: number;
}

export const useInfiniteProducts = (
  categoryId?: string,
  producerId?: string,
  search?: string
) => {
  return useInfiniteQuery<ProductsResponse>({
    queryKey: ["infinite-products", categoryId, producerId, search],
    queryFn: async ({ pageParam = 0 }) => {
      try {
        const params: Record<string, string> = {
          limit: "24",
          offset: String(pageParam),
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

        console.log('Fetching products with params:', params);
        const response = await apiClient.get<any>(API_ENDPOINTS.PRODUCTS, {
          params,
        });
        
        console.log('Products API response:', response.data);
        
        // Helper function to transform product data to match our Product type
        const transformProduct = (product: any): Product => ({
          ...product,
          id: product.id || '',
          name: product.name || 'Unnamed Product',
          nameRw: product.nameRw || product.name || 'Igicuruzwa',
          description: product.description || '',
          price: product.price?.toString() || '0',
          categoryId: product.categoryId || '',
          producerId: product.producerId || '',
          imageUrl: product.imageUrl || product.images?.[0] || '',
          additionalImages: product.additionalImages || product.images?.slice(1) || [],
          createdAt: product.createdAt ? new Date(product.createdAt) : new Date(),
          updatedAt: product.updatedAt ? new Date(product.updatedAt) : new Date(),
          isApproved: product.isApproved ?? true,
          inStock: product.inStock ?? true,
          stockQuantity: product.stockQuantity || 0,
          sizes: product.sizes || [],
          colors: product.colors || []
        });

        // Handle case where response.data is directly an array
        if (Array.isArray(response.data)) {
          console.log('API returned array directly, transforming products');
          const products = response.data.map(transformProduct);
          return {
            products,
            hasMore: products.length === 24, // Assume more if we got a full page
            page: 0
          };
        }
        
        // Handle case where response.data is an object with products array
        if (response.data && Array.isArray(response.data.products)) {
          const products = response.data.products.map(transformProduct);
          return {
            products,
            hasMore: response.data.hasMore !== undefined 
              ? response.data.hasMore 
              : products.length === 24,
            page: response.data.page || 0
          };
        }
        
        console.error('Unexpected API response format:', response.data);
        return {
          products: [],
          hasMore: false,
          page: 0
        };
      } catch (error) {
        console.error('Error fetching products:', error);
        throw new Error(handleApiError(error));
      }
    },
    getNextPageParam: (lastPage, allPages) => {
      if (!lastPage.hasMore) return undefined;
      return allPages.length * 24;
    },
    initialPageParam: 0,
  });
};

