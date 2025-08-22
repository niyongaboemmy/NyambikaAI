import type { Express } from "express";
import { createServer, type Server } from "http";
import { z } from "zod";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import Stripe from "stripe";
import { storage } from "./storage";
import { analyzeFashionImage, generateSizeRecommendation } from "./openai";
import { generateVirtualTryOn } from "./tryon";

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
  
  // Auth middleware with JWT
  interface AuthenticatedRequest extends Express.Request {
    userId: string;
    userRole: string;
  }

  const requireAuth = async (req: any, res: any, next: any) => {
    const authHeader = req.headers.authorization;
    const legacyUserId = req.headers['x-user-id'] as string | undefined; // Keep for backward compatibility
    
    // If legacy header is present, map it to a real DB user (create if missing)
    if (legacyUserId && !authHeader) {
      try {
        const username = String(legacyUserId);
        const email = `${username}@demo.local`;
        let user = await storage.getUserByUsername(username);
        if (!user) {
          // Fallback by email just in case
          user = await storage.getUserByEmail(email);
        }
        if (!user) {
          const hashed = await bcrypt.hash('password', 10);
          user = await storage.createUser({
            username,
            email,
            password: hashed,
            fullName: 'Demo User',
            role: 'customer'
          });
        }
        req.userId = user.id;
        req.userRole = user.role || 'customer';
        return next();
      } catch (e) {
        console.error('Demo auth provisioning failed:', e);
        return res.status(500).json({ message: 'Authentication setup failed' });
      }
    }
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Authentication required' });
    }
    
    const token = authHeader.substring(7);
    
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret') as any;
      req.userId = decoded.userId;
      req.userRole = decoded.role;
      next();
    } catch (error) {
      return res.status(401).json({ message: 'Invalid token' });
    }
  };

  const requireRole = (roles: string[]) => {
    return (req: any, res: any, next: any) => {
      if (!roles.includes(req.userRole)) {
        return res.status(403).json({ message: 'Insufficient permissions' });
      }
      next();
    };
  };

  // Authentication routes
  app.post('/api/auth/register', async (req, res) => {
    try {
      const { email, password, name, role, phone } = req.body;
      
      // Validate input
      if (!email || !password || !name || !role) {
        return res.status(400).json({ message: 'Missing required fields' });
      }
      
      if (!['customer', 'producer'].includes(role)) {
        return res.status(400).json({ message: 'Invalid role' });
      }
      
      // Check if user already exists
      const existingUser = await storage.getUserByEmail(email);
      if (existingUser) {
        return res.status(400).json({ message: 'User already exists' });
      }
      
      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);
      
      // Create user
      const userData = {
        username: email, // Use email as username for now
        email,
        password: hashedPassword,
        fullName: name,
        role,
        phone: phone || null
      };
      
      const user = await storage.createUser(userData);
      
      // Generate JWT token
      const token = jwt.sign(
        { userId: user.id, role: user.role },
        process.env.JWT_SECRET || 'fallback-secret',
        { expiresIn: '7d' }
      );
      
      // Return user without password and map fullName to name
      const { password: _, fullName, ...userWithoutPassword } = user;
      const mappedUser = {
        ...userWithoutPassword,
        name: fullName || user.email.split('@')[0]
      };
      
      res.status(201).json({
        user: mappedUser,
        token
      });
    } catch (error) {
      console.error('Registration error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });
  
  app.post('/api/auth/login', async (req, res) => {
    try {
      const { email, password } = req.body;
      
      if (!email || !password) {
        return res.status(400).json({ message: 'Email and password are required' });
      }
      
      // Find user by email
      const user = await storage.getUserByEmail(email);
      if (!user) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }
      
      // Check password
      const isValidPassword = await bcrypt.compare(password, user.password);
      if (!isValidPassword) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }
      
      // Generate JWT token
      const token = jwt.sign(
        { userId: user.id, role: user.role },
        process.env.JWT_SECRET || 'fallback-secret',
        { expiresIn: '7d' }
      );
      
      // Return user without password and map fullName to name
      const { password: _, fullName, ...userWithoutPassword } = user;
      const mappedUser = {
        ...userWithoutPassword,
        name: fullName || user.email.split('@')[0]
      };
      
      res.json({
        user: mappedUser,
        token
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });
  
  app.get('/api/auth/me', requireAuth, async (req: any, res) => {
    try {
      const user = await storage.getUserById(req.userId);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
      
      const { password: _, fullName, ...userWithoutPassword } = user;
      const mappedUser = {
        ...userWithoutPassword,
        name: fullName || user.email.split('@')[0]
      };
      res.json(mappedUser);
    } catch (error) {
      console.error('Get user error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  // Update product (admin only)
  app.put('/api/products/:id', requireAuth, requireRole(['admin']), async (req: any, res) => {
    try {
      const updates = insertProductSchema.partial().parse(req.body);
      const product = await storage.updateProduct(req.params.id, updates);
      if (!product) return res.status(404).json({ message: 'Product not found' });
      res.json(product);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'Validation error', errors: error.errors });
      }
      console.error('Error updating product:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  // Delete product (admin only)
  app.delete('/api/products/:id', requireAuth, requireRole(['admin']), async (req, res) => {
    try {
      await storage.deleteProduct(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error('Error deleting product:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  app.put('/api/auth/profile', requireAuth, async (req: any, res) => {
    try {
      const { fullName, fullNameRw, phone, location, businessName, profileImage } = req.body;
      
      const updateData: any = {};
      if (fullName !== undefined) updateData.fullName = fullName;
      if (fullNameRw !== undefined) updateData.fullNameRw = fullNameRw;
      if (phone !== undefined) updateData.phone = phone;
      if (location !== undefined) updateData.location = location;
      if (businessName !== undefined) updateData.businessName = businessName;
      if (profileImage !== undefined) updateData.profileImage = profileImage;
      
      const user = await storage.updateUser(req.userId, updateData);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
      
      // Return user without password and map fullName to name
      const { password: _, fullName: userFullName, ...userWithoutPassword } = user;
      const mappedUser = {
        ...userWithoutPassword,
        name: userFullName || user.email.split('@')[0]
      };
      
      res.json(mappedUser);
    } catch (error) {
      console.error('Update profile error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  // Demo users seeding route (for development)
  app.post('/api/seed-demo-users', async (req, res) => {
    try {
      const demoUsers = [
        {
          username: 'customer@demo.com',
          email: 'customer@demo.com',
          password: await bcrypt.hash('password', 10),
          fullName: 'Demo Customer',
          role: 'customer',
          phone: '+250781234567'
        },
        {
          username: 'producer@demo.com',
          email: 'producer@demo.com',
          password: await bcrypt.hash('password', 10),
          fullName: 'Demo Producer',
          role: 'producer',
          phone: '+250781234568',
          businessName: 'Fashion House Rwanda'
        },
        {
          username: 'admin@demo.com',
          email: 'admin@demo.com',
          password: await bcrypt.hash('password', 10),
          fullName: 'Demo Admin',
          role: 'admin',
          phone: '+250781234569'
        }
      ];

      const createdUsers = [];
      for (const userData of demoUsers) {
        try {
          const existingUser = await storage.getUserByEmail(userData.email);
          if (!existingUser) {
            const user = await storage.createUser(userData);
            const { password: _, ...userWithoutPassword } = user;
            createdUsers.push(userWithoutPassword);
          }
        } catch (error) {
          console.log(`User ${userData.email} might already exist`);
        }
      }

      res.json({ 
        message: 'Demo users seeded successfully',
        users: createdUsers
      });
    } catch (error) {
      console.error('Error seeding demo users:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

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

  app.post('/api/categories', requireAuth, requireRole(['admin']), async (req, res) => {
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

  app.put('/api/categories/:id', requireAuth, requireRole(['admin']), async (req, res) => {
    try {
      const validatedData = insertCategorySchema.partial().parse(req.body);
      const category = await storage.updateCategory(req.params.id, validatedData);
      if (!category) {
        return res.status(404).json({ message: 'Category not found' });
      }
      res.json(category);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'Validation error', errors: error.errors });
      }
      console.error('Error updating category:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  app.delete('/api/categories/:id', requireAuth, requireRole(['admin']), async (req, res) => {
    try {
      await storage.deleteCategory(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error('Error deleting category:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  // Products routes
  app.post('/api/products', requireAuth, requireRole(['producer', 'admin']), async (req: any, res) => {
    try {
      const { name, nameRw, description, price, categoryId, imageUrl, sizes, colors, stockQuantity } = req.body;
      
      if (!name || !nameRw || !description || !price || !categoryId || !imageUrl) {
        return res.status(400).json({ message: 'Missing required fields' });
      }
      
      const productData = {
        name,
        nameRw,
        description,
        price: price.toString(),
        categoryId,
        producerId: req.userId,
        imageUrl,
        sizes: sizes || [],
        colors: colors || [],
        stockQuantity: stockQuantity || 0,
        inStock: (stockQuantity || 0) > 0,
        isApproved: req.userRole === 'admin' // Auto-approve for admins
      };
      
      const product = await storage.createProduct(productData);
      res.status(201).json(product);
    } catch (error) {
      console.error('Error creating product:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  app.get('/api/products', async (req, res) => {
    try {
      const { categoryId, search, limit, offset, producerId } = req.query;
      const options = {
        categoryId: categoryId as string,
        search: search as string,
        limit: limit ? parseInt(limit as string) : undefined,
        offset: offset ? parseInt(offset as string) : undefined,
        producerId: producerId as string,
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

  // Producers routes
  app.get('/api/producers', async (req, res) => {
    try {
      const { limit } = req.query as any;
      const producers = await storage.getProducers(limit ? parseInt(limit as string) : undefined);
      const safe = producers.map((u: any) => {
        const { password, ...rest } = u;
        return rest;
      });
      res.json(safe);
    } catch (error) {
      console.error('Error fetching producers:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  app.get('/api/producers/:id', async (req, res) => {
    try {
      const user = await storage.getUser(req.params.id);
      if (!user || user.role !== 'producer') return res.status(404).json({ message: 'Producer not found' });
      const { password, ...safe } = user as any;
      res.json(safe);
    } catch (error) {
      console.error('Error fetching producer:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  app.get('/api/producers/:id/products', async (req, res) => {
    try {
      const products = await storage.getProducts({ producerId: req.params.id });
      res.json(products);
    } catch (error) {
      console.error('Error fetching producer products:', error);
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
      // If productId provided but doesn't exist, drop it to avoid FK violation
      let body = { ...req.body } as any;
      if (body.productId) {
        const product = await storage.getProduct(body.productId);
        if (!product) {
          delete body.productId;
        }
      }

      const validatedData = insertTryOnSessionSchema.parse({
        ...body,
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

      // Process with AI (allow overriding product image via request body)
      const overrideImageUrl = req.body?.productImageUrl as string | undefined;
      const productImageToUse = overrideImageUrl && typeof overrideImageUrl === 'string' && overrideImageUrl.length > 0
        ? overrideImageUrl
        : product.imageUrl;

      const result = await generateVirtualTryOn(
        session.customerImageUrl,
        productImageToUse,
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
