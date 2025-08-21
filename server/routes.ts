import express from 'express';
import { storage } from './storage';
import { insertProductSchema, insertUserSchema, insertOrderSchema, insertTryOnSchema } from '../shared/schema';
import multer from 'multer';

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

// Products
router.get('/api/products', async (req, res) => {
  try {
    const { category, featured, sellerId } = req.query;
    const filters: any = {};
    
    if (category) filters.category = category as string;
    if (featured) filters.featured = featured === 'true';
    if (sellerId) filters.sellerId = sellerId as string;
    
    const products = await storage.getProducts(filters);
    res.json(products);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch products' });
  }
});

router.get('/api/products/:id', async (req, res) => {
  try {
    const product = await storage.getProductById(req.params.id);
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }
    res.json(product);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch product' });
  }
});

router.post('/api/products', async (req, res) => {
  try {
    const productData = insertProductSchema.parse(req.body);
    const product = await storage.createProduct(productData);
    res.status(201).json(product);
  } catch (error) {
    res.status(400).json({ error: 'Invalid product data' });
  }
});

// Users
router.post('/api/auth/register', async (req, res) => {
  try {
    const userData = insertUserSchema.parse(req.body);
    
    // Check if user already exists
    const existingUser = await storage.getUserByEmail(userData.email);
    if (existingUser) {
      return res.status(409).json({ error: 'User already exists' });
    }
    
    const user = await storage.createUser(userData);
    res.status(201).json({ ...user, password: undefined });
  } catch (error) {
    res.status(400).json({ error: 'Invalid user data' });
  }
});

router.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await storage.getUserByEmail(email);
    
    if (!user || user.password !== password) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    res.json({ ...user, password: undefined });
  } catch (error) {
    res.status(500).json({ error: 'Login failed' });
  }
});

router.get('/api/user/:id', async (req, res) => {
  try {
    const user = await storage.getUserById(req.params.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json({ ...user, password: undefined });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

// Orders
router.post('/api/orders', async (req, res) => {
  try {
    const orderData = insertOrderSchema.parse(req.body);
    const order = await storage.createOrder(orderData);
    res.status(201).json(order);
  } catch (error) {
    res.status(400).json({ error: 'Invalid order data' });
  }
});

router.get('/api/orders/:userId', async (req, res) => {
  try {
    const orders = await storage.getOrdersByUserId(req.params.userId);
    res.json(orders);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
});

// AI Try-On
router.post('/api/ai/tryon', upload.single('image'), async (req, res) => {
  try {
    const { productId, userId } = req.body;
    
    if (!req.file) {
      return res.status(400).json({ error: 'No image uploaded' });
    }
    
    // Convert uploaded image to base64
    const userImage = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;
    
    const tryOnData = insertTryOnSchema.parse({
      userId,
      productId,
      userImage,
    });
    
    const tryOn = await storage.createTryOn(tryOnData);
    
    // Simulate AI processing
    setTimeout(async () => {
      // In a real implementation, this would call the AI service
      const resultImage = `/api/placeholder/400/600?tryon=${tryOn.id}`;
      await storage.updateTryOn(tryOn.id, {
        resultImage,
        confidence: 0.85,
      });
    }, 2000);
    
    res.status(201).json(tryOn);
  } catch (error) {
    res.status(400).json({ error: 'Try-on failed' });
  }
});

router.get('/api/ai/tryon/:id', async (req, res) => {
  try {
    const tryOn = await storage.getTryOnById(req.params.id);
    if (!tryOn) {
      return res.status(404).json({ error: 'Try-on not found' });
    }
    res.json(tryOn);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch try-on' });
  }
});

router.get('/api/ai/tryon/user/:userId', async (req, res) => {
  try {
    const tryOns = await storage.getTryOnsByUserId(req.params.userId);
    res.json(tryOns);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch try-ons' });
  }
});

// Size Recommendations
router.post('/api/ai/size-suggest', async (req, res) => {
  try {
    const { userId, productId, measurements } = req.body;
    
    // Simple size recommendation logic
    let recommendedSize = 'M';
    let confidence = 0.7;
    
    if (measurements.height && measurements.weight) {
      const bmi = measurements.weight / Math.pow(measurements.height / 100, 2);
      
      if (bmi < 18.5) {
        recommendedSize = 'S';
        confidence = 0.8;
      } else if (bmi > 25) {
        recommendedSize = 'L';
        confidence = 0.8;
      } else {
        recommendedSize = 'M';
        confidence = 0.85;
      }
    }
    
    const recommendation = await storage.createSizeRecommendation({
      userId,
      productId,
      recommendedSize,
      confidence,
      measurements,
    });
    
    res.json(recommendation);
  } catch (error) {
    res.status(400).json({ error: 'Size recommendation failed' });
  }
});

// Placeholder image endpoint
router.get('/api/placeholder/:width/:height', (req, res) => {
  const { width, height } = req.params;
  const color = req.query.color || 'cccccc';
  const text = req.query.text || `${width}x${height}`;
  
  // Return SVG placeholder
  const svg = `
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <rect width="100%" height="100%" fill="#${color}"/>
      <text x="50%" y="50%" text-anchor="middle" dy=".3em" fill="#666" 
            font-family="Arial, sans-serif" font-size="16">${text}</text>
    </svg>
  `;
  
  res.setHeader('Content-Type', 'image/svg+xml');
  res.send(svg);
});

export default router;