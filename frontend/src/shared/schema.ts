// Shared types for the frontend application
export type User = {
  id: string;
  username: string;
  email: string;
  fullName?: string | null;
  fullNameRw?: string | null;
  phone?: string | null;
  location?: string | null;
  role: string;
  businessName?: string | null;
  businessLicense?: string | null;
  isVerified?: boolean;
  measurements?: string | null;
  profileImage?: string | null;
  createdAt?: Date | null;
};

export type Company = {
  id: string;
  producerId: string;
  tin?: string | null;
  name: string;
  email: string;
  phone: string;
  location: string;
  logoUrl?: string | null;
  websiteUrl?: string | null;
  createdAt?: Date | null;
};

export type Category = {
  id: string;
  name: string;
  nameRw: string;
  description?: string | null;
  imageUrl?: string | null;
  createdAt?: Date | null;
};

export type Product = {
  id: string;
  name: string;
  nameRw: string;
  description: string;
  price: string | number;
  categoryId?: string | null;
  producerId?: string | null;
  imageUrl: string;
  additionalImages?: string[] | null;
  sizes?: string[] | null;
  colors?: string[] | null;
  stockQuantity?: number | null;
  inStock?: boolean;
  isApproved?: boolean;
  createdAt?: Date | null;
};

export type CartItem = {
  id: string;
  userId?: string | null;
  productId?: string | null;
  quantity?: number;
  size?: string | null;
  color?: string | null;
  createdAt?: Date | null;
};

export type Order = {
  id: string;
  customerId?: string | null;
  producerId?: string | null;
  total: string | number;
  status: string;
  paymentMethod?: string | null;
  paymentStatus?: string | null;
  shippingAddress?: string | null;
  trackingNumber?: string | null;
  notes?: string | null;
  createdAt?: Date | null;
};

export type OrderItem = {
  id: string;
  orderId?: string | null;
  productId?: string | null;
  quantity?: number;
  price: string | number;
  size?: string | null;
  color?: string | null;
};

export type Favorite = {
  id: string;
  userId?: string | null;
  productId?: string | null;
  createdAt?: Date | null;
};

export type TryOnSession = {
  id: string;
  userId?: string | null;
  customerImageUrl: string;
  productId?: string | null;
  tryOnImageUrl?: string | null;
  fitRecommendation?: string | null;
  status: string;
  createdAt?: Date | null;
};

export type Review = {
  id: string;
  userId?: string | null;
  productId?: string | null;
  orderId?: string | null;
  rating: number;
  comment?: string | null;
  images?: string[] | null;
  isVerified?: boolean;
  createdAt?: Date | null;
};

// Insert types (for forms and API calls)
export type InsertUser = Omit<User, 'id' | 'createdAt'>;
export type InsertCompany = Omit<Company, 'id' | 'createdAt'>;
export type InsertCategory = Omit<Category, 'id' | 'createdAt'>;
export type InsertProduct = Omit<Product, 'id' | 'createdAt'>;
export type InsertCartItem = Omit<CartItem, 'id' | 'createdAt'>;
export type InsertOrder = Omit<Order, 'id' | 'createdAt'>;
export type InsertOrderItem = Omit<OrderItem, 'id'>;
export type InsertFavorite = Omit<Favorite, 'id' | 'createdAt'>;
export type InsertTryOnSession = Omit<TryOnSession, 'id' | 'createdAt'>;
export type InsertReview = Omit<Review, 'id' | 'createdAt'>;
