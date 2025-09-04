export interface ProductImage {
  id: string;
  url: string;
  alt?: string;
  isPrimary?: boolean;
}

export interface Product {
  id: string;
  name: string;
  description?: string;
  price: number;
  category?: string;
  images: ProductImage[];
  createdAt: string;
  updatedAt: string;
  // Add other product properties as needed
}
