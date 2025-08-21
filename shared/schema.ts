import { z } from 'zod';

// User schema
export const userSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  password: z.string().min(6),
  name: z.string().min(2),
  phone: z.string().optional(),
  role: z.enum(['customer', 'seller', 'admin']).default('customer'),
  avatar: z.string().optional(),
  measurements: z.object({
    height: z.number().optional(),
    weight: z.number().optional(),
    chest: z.number().optional(),
    waist: z.number().optional(),
    shoulders: z.number().optional(),
  }).optional(),
  preferences: z.object({
    language: z.enum(['en', 'rw', 'fr']).default('en'),
    currency: z.string().default('RWF'),
  }).optional(),
  createdAt: z.date().default(new Date()),
});

// Product schema
export const productSchema = z.object({
  id: z.string(),
  name: z.string().min(1),
  description: z.string(),
  price: z.number().positive(),
  currency: z.string().default('RWF'),
  category: z.string(),
  subcategory: z.string().optional(),
  sizes: z.array(z.string()).default(['S', 'M', 'L', 'XL']),
  colors: z.array(z.string()).default([]),
  images: z.array(z.string()).default([]),
  sellerId: z.string(),
  stock: z.number().default(0),
  tags: z.array(z.string()).default([]),
  featured: z.boolean().default(false),
  rating: z.number().min(0).max(5).default(0),
  reviewCount: z.number().default(0),
  createdAt: z.date().default(new Date()),
});

// Order schema
export const orderSchema = z.object({
  id: z.string(),
  userId: z.string(),
  items: z.array(z.object({
    productId: z.string(),
    quantity: z.number().positive(),
    size: z.string(),
    color: z.string().optional(),
    price: z.number().positive(),
  })),
  total: z.number().positive(),
  currency: z.string().default('RWF'),
  status: z.enum(['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled']).default('pending'),
  shippingAddress: z.object({
    name: z.string(),
    phone: z.string(),
    address: z.string(),
    city: z.string(),
    district: z.string(),
  }),
  paymentMethod: z.enum(['mtn_money', 'airtel_money', 'card', 'cash']),
  paymentStatus: z.enum(['pending', 'paid', 'failed', 'refunded']).default('pending'),
  createdAt: z.date().default(new Date()),
});

// Virtual Try-On schema
export const tryOnSchema = z.object({
  id: z.string(),
  userId: z.string(),
  productId: z.string(),
  userImage: z.string(), // Base64 or URL
  resultImage: z.string().optional(), // Generated try-on result
  confidence: z.number().min(0).max(1).optional(),
  createdAt: z.date().default(new Date()),
});

// Size Recommendation schema
export const sizeRecommendationSchema = z.object({
  id: z.string(),
  userId: z.string(),
  productId: z.string(),
  recommendedSize: z.string(),
  confidence: z.number().min(0).max(1),
  measurements: z.object({
    height: z.number(),
    weight: z.number(),
    chest: z.number().optional(),
    waist: z.number().optional(),
    shoulders: z.number().optional(),
  }),
  createdAt: z.date().default(new Date()),
});

// Insert schemas
export const insertUserSchema = userSchema.omit({ id: true, createdAt: true });
export const insertProductSchema = productSchema.omit({ id: true, createdAt: true, rating: true, reviewCount: true });
export const insertOrderSchema = orderSchema.omit({ id: true, createdAt: true });
export const insertTryOnSchema = tryOnSchema.omit({ id: true, createdAt: true, resultImage: true, confidence: true });
export const insertSizeRecommendationSchema = sizeRecommendationSchema.omit({ id: true, createdAt: true });

// Types
export type User = z.infer<typeof userSchema>;
export type Product = z.infer<typeof productSchema>;
export type Order = z.infer<typeof orderSchema>;
export type TryOn = z.infer<typeof tryOnSchema>;
export type SizeRecommendation = z.infer<typeof sizeRecommendationSchema>;

export type InsertUser = z.infer<typeof insertUserSchema>;
export type InsertProduct = z.infer<typeof insertProductSchema>;
export type InsertOrder = z.infer<typeof insertOrderSchema>;
export type InsertTryOn = z.infer<typeof insertTryOnSchema>;
export type InsertSizeRecommendation = z.infer<typeof insertSizeRecommendationSchema>;