import type { Product as SchemaProduct } from '@/shared/schema';

// Base product type that extends the schema with required fields
export interface Product extends Omit<SchemaProduct, 'createdAt'> {
  id: string;
  name: string;
  nameRw: string;
  description: string;
  price: string | number;
  categoryId: string;
  categoryName?: string | null;
  producerId: string;
  imageUrl: string;
  additionalImages?: string[] | null;
  sizes?: string[] | null;
  colors?: string[] | null;
  stockQuantity?: number | null;
  inStock?: boolean;
  isApproved?: boolean;
  displayOrder?: number | null;
  createdAt: Date;
  updatedAt: Date;
  [key: string]: any; // Allow for additional properties
}

// Type for the API response
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export interface ProductsResponse {
  products: Product[];
  hasMore: boolean;
  page: number;
}

// Type for the API response with pagination
export interface ApiResponse<T> {
  data: T;
  hasMore: boolean;
  page: number;
}

// Type for category
export interface Category {
  id: string;
  name: string;
  nameRw: string;
  imageUrl?: string;
}

// Type for sort options
export type SortOption = "newest" | "oldest" | "price-low" | "price-high";
