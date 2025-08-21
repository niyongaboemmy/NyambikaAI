import type { Express } from "express";
import { createServer, type Server } from "http";
import { z } from "zod";
import Stripe from "stripe";
import { storage } from "./storage";
import { generateVirtualTryOn, analyzeFashionImage, generateSizeRecommendation } from "./openai";

// Initialize Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-07-30.basil",
});
import {
  insertUserSchema,
  insertProductSchema,
  insertCategorySchema,
  insertCartItemSchema,
  insertOrderSchema,
  insertOrderItemSchema,
  insertFavoriteSchema,
  insertTryOnSessionSchema,
  insertReviewSchema
} from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  
  // Auth middleware (simplified for now)
  interface AuthenticatedRequest extends Express.Request {
    userId: string;
  }

  const requireAuth = (req: any, res: any, next: any) => {
    const userId = req.headers['x-user-id']; // Simplified auth
    if (!userId) {
      return res.status(401).json({ message: 'Authentication required' });
    }
    req.userId = userId;
    next();
  };

  // Categories routes
  app.get('/api/categories', async (req, res) => {
    try {
      const categories = await storage.getCategories();
      res.json(categories);
    } catch (error) {
      console.error('Error fetching categories:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  app.get('/api/categories/:id', async (req, res) => {
    try {
      const category = await storage.getCategory(req.params.id);
      if (!category) {
        return res.status(404).json({ message: 'Category not found' });
      }
      res.json(category);
    } catch (error) {
      console.error('Error fetching category:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  app.post('/api/categories', async (req, res) => {
    try {
      const validatedData = insertCategorySchema.parse(req.body);
      const category = await storage.createCategory(validatedData);
      res.status(201).json(category);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'Validation error', errors: error.errors });
      }
      console.error('Error creating category:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  // Products routes
  app.get('/api/products', async (req, res) => {
    try {
      const { categoryId, search, limit, offset } = req.query;
      const options = {
        categoryId: categoryId as string,
        search: search as string,
        limit: limit ? parseInt(limit as string) : undefined,
        offset: offset ? parseInt(offset as string) : undefined,
      };
      
      const products = await storage.getProducts(options);
      res.json(products);
    } catch (error) {
      console.error('Error fetching products:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  app.get('/api/products/:id', async (req, res) => {
    try {
      const product = await storage.getProduct(req.params.id);
      if (!product) {
        return res.status(404).json({ message: 'Product not found' });
      }
      res.json(product);
    } catch (error) {
      console.error('Error fetching product:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  app.post('/api/products', async (req, res) => {
    try {
      const validatedData = insertProductSchema.parse(req.body);
      const product = await storage.createProduct(validatedData);
      res.status(201).json(product);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'Validation error', errors: error.errors });
      }
      console.error('Error creating product:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  // User routes
  app.get('/api/users/:id', async (req, res) => {
    try {
      const user = await storage.getUser(req.params.id);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
      // Remove password from response
      const { password, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error) {
      console.error('Error fetching user:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  app.post('/api/users', async (req, res) => {
    try {
      const validatedData = insertUserSchema.parse(req.body);
      const user = await storage.createUser(validatedData);
      // Remove password from response
      const { password, ...userWithoutPassword } = user;
      res.status(201).json(userWithoutPassword);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'Validation error', errors: error.errors });
      }
      console.error('Error creating user:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  app.put('/api/users/:id', requireAuth, async (req, res) => {
    try {
      const validatedData = insertUserSchema.partial().parse(req.body);
      const user = await storage.updateUser(req.params.id, validatedData);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
      // Remove password from response
      const { password, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'Validation error', errors: error.errors });
      }
      console.error('Error updating user:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  // Cart routes
  app.get('/api/cart', requireAuth, async (req: any, res) => {
    try {
      const cartItems = await storage.getCartItems(req.userId);
      res.json(cartItems);
    } catch (error) {
      console.error('Error fetching cart:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  app.post('/api/cart', requireAuth, async (req: any, res) => {
    try {
      const validatedData = insertCartItemSchema.parse({
        ...req.body,
        userId: req.userId
      });
      const cartItem = await storage.addToCart(validatedData);
      res.status(201).json(cartItem);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'Validation error', errors: error.errors });
      }
      console.error('Error adding to cart:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  app.put('/api/cart/:id', requireAuth, async (req: any, res) => {
    try {
      const validatedData = insertCartItemSchema.partial().parse(req.body);
      const cartItem = await storage.updateCartItem(req.params.id, validatedData);
      if (!cartItem) {
        return res.status(404).json({ message: 'Cart item not found' });
      }
      res.json(cartItem);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'Validation error', errors: error.errors });
      }
      console.error('Error updating cart item:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  app.delete('/api/cart/:id', requireAuth, async (req: any, res) => {
    try {
      await storage.removeFromCart(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error('Error removing from cart:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  app.delete('/api/cart', requireAuth, async (req: any, res) => {
    try {
      await storage.clearCart(req.userId);
      res.status(204).send();
    } catch (error) {
      console.error('Error clearing cart:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  // Payment routes (Stripe)
  app.post('/api/create-payment-intent', requireAuth, async (req: any, res) => {
    try {
      const { amount, currency = 'rwf' } = req.body;
      
      // Create payment intent
      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(amount * 100), // Convert to cents
        currency: currency.toLowerCase(),
        payment_method_types: ['card'],
        metadata: {
          userId: req.userId
        }
      });

      res.json({
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id
      });
    } catch (error: any) {
      console.error('Error creating payment intent:', error);
      res.status(500).json({ 
        message: 'Error creating payment intent',
        error: error.message 
      });
    }
  });

  // Orders routes
  app.get('/api/orders', requireAuth, async (req: any, res) => {
    try {
      const orders = await storage.getOrders(req.userId);
      res.json(orders);
    } catch (error) {
      console.error('Error fetching orders:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  app.get('/api/orders/:id', requireAuth, async (req, res) => {
    try {
      const order = await storage.getOrder(req.params.id);
      if (!order) {
        return res.status(404).json({ message: 'Order not found' });
      }
      res.json(order);
    } catch (error) {
      console.error('Error fetching order:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  app.post('/api/orders', requireAuth, async (req: any, res) => {
    try {
      const { items, ...orderData } = req.body;
      const validatedOrderData = insertOrderSchema.parse({
        ...orderData,
        userId: req.userId
      });
      const validatedItems = z.array(insertOrderItemSchema).parse(items);
      
      const order = await storage.createOrder(validatedOrderData, validatedItems);
      
      // Clear cart after successful order
      await storage.clearCart(req.userId);
      
      res.status(201).json(order);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'Validation error', errors: error.errors });
      }
      console.error('Error creating order:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  app.put('/api/orders/:id/status', async (req, res) => {
    try {
      const { status } = req.body;
      if (!status) {
        return res.status(400).json({ message: 'Status is required' });
      }
      
      const order = await storage.updateOrderStatus(req.params.id, status);
      if (!order) {
        return res.status(404).json({ message: 'Order not found' });
      }
      res.json(order);
    } catch (error) {
      console.error('Error updating order status:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  // Favorites routes
  app.get('/api/favorites', requireAuth, async (req: any, res) => {
    try {
      const favorites = await storage.getFavorites(req.userId);
      res.json(favorites);
    } catch (error) {
      console.error('Error fetching favorites:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  app.post('/api/favorites', requireAuth, async (req: any, res) => {
    try {
      const validatedData = insertFavoriteSchema.parse({
        ...req.body,
        userId: req.userId
      });
      const favorite = await storage.addToFavorites(validatedData);
      res.status(201).json(favorite);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'Validation error', errors: error.errors });
      }
      console.error('Error adding to favorites:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  app.delete('/api/favorites/:productId', requireAuth, async (req: any, res) => {
    try {
      await storage.removeFromFavorites(req.userId, req.params.productId);
      res.status(204).send();
    } catch (error) {
      console.error('Error removing from favorites:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  app.get('/api/favorites/:productId/check', requireAuth, async (req: any, res) => {
    try {
      const isFavorite = await storage.isFavorite(req.userId, req.params.productId);
      res.json({ isFavorite });
    } catch (error) {
      console.error('Error checking favorite status:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  // Try-on sessions routes
  app.get('/api/try-on-sessions', requireAuth, async (req: any, res) => {
    try {
      const sessions = await storage.getTryOnSessions(req.userId);
      res.json(sessions);
    } catch (error) {
      console.error('Error fetching try-on sessions:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  app.get('/api/try-on-sessions/:id', requireAuth, async (req, res) => {
    try {
      const session = await storage.getTryOnSession(req.params.id);
      if (!session) {
        return res.status(404).json({ message: 'Try-on session not found' });
      }
      res.json(session);
    } catch (error) {
      console.error('Error fetching try-on session:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  app.post('/api/try-on-sessions', requireAuth, async (req: any, res) => {
    try {
      const validatedData = insertTryOnSessionSchema.parse({
        ...req.body,
        userId: req.userId
      });
      const session = await storage.createTryOnSession(validatedData);
      res.status(201).json(session);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'Validation error', errors: error.errors });
      }
      console.error('Error creating try-on session:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  app.put('/api/try-on-sessions/:id', requireAuth, async (req: any, res) => {
    try {
      const validatedData = insertTryOnSessionSchema.partial().parse(req.body);
      const session = await storage.updateTryOnSession(req.params.id, validatedData);
      if (!session) {
        return res.status(404).json({ message: 'Try-on session not found' });
      }
      res.json(session);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'Validation error', errors: error.errors });
      }
      console.error('Error updating try-on session:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  // AI Try-on processing endpoint
  app.post('/api/try-on-sessions/:id/process', requireAuth, async (req: any, res) => {
    try {
      const session = await storage.getTryOnSession(req.params.id);
      if (!session) {
        return res.status(404).json({ message: 'Try-on session not found' });
      }

      const product = await storage.getProduct(session.productId!);
      if (!product) {
        return res.status(404).json({ message: 'Product not found' });
      }

      // Update status to processing
      await storage.updateTryOnSession(req.params.id, { status: 'processing' });

      // Get customer measurements if available
      const user = await storage.getUser(session.userId!);
      const measurements = user?.measurements ? JSON.parse(user.measurements) : undefined;

      // Process with AI
      const result = await generateVirtualTryOn(
        session.customerImageUrl,
        product.imageUrl,
        product.name,
        measurements
      );

      if (result.success) {
        await storage.updateTryOnSession(req.params.id, {
          status: 'completed',
          tryOnImageUrl: result.tryOnImageUrl,
          fitRecommendation: JSON.stringify(result.recommendations)
        });
        res.json({ 
          message: 'Try-on completed successfully',
          tryOnImageUrl: result.tryOnImageUrl,
          recommendations: result.recommendations
        });
      } else {
        await storage.updateTryOnSession(req.params.id, { status: 'failed' });
        res.status(500).json({ message: result.error || 'Try-on processing failed' });
      }
    } catch (error) {
      console.error('Error processing try-on session:', error);
      await storage.updateTryOnSession(req.params.id, { status: 'failed' });
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  // AI Fashion analysis endpoint
  app.post('/api/ai/analyze-fashion', async (req, res) => {
    try {
      const { imageBase64 } = req.body;
      if (!imageBase64) {
        return res.status(400).json({ message: 'Image data is required' });
      }

      const analysis = await analyzeFashionImage(imageBase64);
      res.json(analysis);
    } catch (error) {
      console.error('Error analyzing fashion image:', error);
      res.status(500).json({ message: 'Failed to analyze image' });
    }
  });

  // AI Size recommendation endpoint
  app.post('/api/ai/size-recommendation', requireAuth, async (req: any, res) => {
    try {
      const { measurements, productType, productSizes } = req.body;
      if (!measurements || !productType || !productSizes) {
        return res.status(400).json({ message: 'Measurements, product type, and available sizes are required' });
      }

      const recommendation = await generateSizeRecommendation(measurements, productType, productSizes);
      res.json(recommendation);
    } catch (error) {
      console.error('Error generating size recommendation:', error);
      res.status(500).json({ message: 'Failed to generate size recommendation' });
    }
  });

  // Search endpoint
  app.get('/api/search', async (req, res) => {
    try {
      const { q, category, limit } = req.query;
      
      if (!q) {
        return res.status(400).json({ message: 'Search query is required' });
      }

      const options = {
        search: q as string,
        categoryId: category as string,
        limit: limit ? parseInt(limit as string) : 20,
      };

      const products = await storage.getProducts(options);
      res.json({ query: q, results: products });
    } catch (error) {
      console.error('Error performing search:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  // Health check endpoint
  app.get('/api/health', (req, res) => {
    res.json({ 
      status: 'ok', 
      timestamp: new Date().toISOString(),
      service: 'Nyambika AI Fashion Platform API'
    });
  });

  const httpServer = createServer(app);

  return httpServer;
}
