import { User, Product, Order, TryOn, SizeRecommendation, InsertUser, InsertProduct, InsertOrder, InsertTryOn, InsertSizeRecommendation } from '../shared/schema';
import { v4 as uuidv4 } from 'uuid';

export interface IStorage {
  // Users
  createUser(user: InsertUser): Promise<User>;
  getUserById(id: string): Promise<User | null>;
  getUserByEmail(email: string): Promise<User | null>;
  updateUser(id: string, updates: Partial<User>): Promise<User | null>;
  deleteUser(id: string): Promise<boolean>;

  // Products
  createProduct(product: InsertProduct): Promise<Product>;
  getProducts(filters?: { category?: string; featured?: boolean; sellerId?: string }): Promise<Product[]>;
  getProductById(id: string): Promise<Product | null>;
  updateProduct(id: string, updates: Partial<Product>): Promise<Product | null>;
  deleteProduct(id: string): Promise<boolean>;

  // Orders
  createOrder(order: InsertOrder): Promise<Order>;
  getOrderById(id: string): Promise<Order | null>;
  getOrdersByUserId(userId: string): Promise<Order[]>;
  updateOrder(id: string, updates: Partial<Order>): Promise<Order | null>;

  // Try-On
  createTryOn(tryOn: InsertTryOn): Promise<TryOn>;
  getTryOnById(id: string): Promise<TryOn | null>;
  getTryOnsByUserId(userId: string): Promise<TryOn[]>;
  updateTryOn(id: string, updates: Partial<TryOn>): Promise<TryOn | null>;

  // Size Recommendations
  createSizeRecommendation(recommendation: InsertSizeRecommendation): Promise<SizeRecommendation>;
  getSizeRecommendationsByUserId(userId: string): Promise<SizeRecommendation[]>;
  getSizeRecommendationByProduct(userId: string, productId: string): Promise<SizeRecommendation | null>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User> = new Map();
  private products: Map<string, Product> = new Map();
  private orders: Map<string, Order> = new Map();
  private tryOns: Map<string, TryOn> = new Map();
  private sizeRecommendations: Map<string, SizeRecommendation> = new Map();

  constructor() {
    this.seedData();
  }

  private seedData() {
    // Sample products
    const products = [
      {
        id: uuidv4(),
        name: "Traditional Rwandan Dress",
        description: "Beautiful handwoven traditional dress with modern styling",
        price: 45000,
        currency: "RWF",
        category: "Traditional",
        subcategory: "Dresses",
        sizes: ["S", "M", "L", "XL"],
        colors: ["Blue", "Red", "Green"],
        images: ["/api/placeholder/400/600"],
        sellerId: "seller1",
        stock: 15,
        tags: ["traditional", "handmade", "cultural"],
        featured: true,
        rating: 4.8,
        reviewCount: 24,
        createdAt: new Date(),
      },
      {
        id: uuidv4(),
        name: "Modern Ankara Blazer",
        description: "Contemporary blazer with authentic Ankara print",
        price: 65000,
        currency: "RWF",
        category: "Modern",
        subcategory: "Blazers",
        sizes: ["S", "M", "L", "XL"],
        colors: ["Orange", "Yellow", "Purple"],
        images: ["/api/placeholder/400/600"],
        sellerId: "seller2",
        stock: 8,
        tags: ["modern", "professional", "ankara"],
        featured: true,
        rating: 4.6,
        reviewCount: 18,
        createdAt: new Date(),
      },
      {
        id: uuidv4(),
        name: "Casual Cotton Shirt",
        description: "Comfortable everyday shirt with African-inspired patterns",
        price: 25000,
        currency: "RWF",
        category: "Casual",
        subcategory: "Shirts",
        sizes: ["S", "M", "L", "XL", "XXL"],
        colors: ["White", "Black", "Navy"],
        images: ["/api/placeholder/400/600"],
        sellerId: "seller1",
        stock: 20,
        tags: ["casual", "cotton", "everyday"],
        featured: false,
        rating: 4.3,
        reviewCount: 32,
        createdAt: new Date(),
      }
    ];

    products.forEach(product => {
      this.products.set(product.id, product);
    });
  }

  // User methods
  async createUser(user: InsertUser): Promise<User> {
    const newUser: User = {
      ...user,
      id: uuidv4(),
      createdAt: new Date(),
    };
    this.users.set(newUser.id, newUser);
    return newUser;
  }

  async getUserById(id: string): Promise<User | null> {
    return this.users.get(id) || null;
  }

  async getUserByEmail(email: string): Promise<User | null> {
    for (const user of this.users.values()) {
      if (user.email === email) {
        return user;
      }
    }
    return null;
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User | null> {
    const user = this.users.get(id);
    if (!user) return null;
    
    const updatedUser = { ...user, ...updates };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  async deleteUser(id: string): Promise<boolean> {
    return this.users.delete(id);
  }

  // Product methods
  async createProduct(product: InsertProduct): Promise<Product> {
    const newProduct: Product = {
      ...product,
      id: uuidv4(),
      rating: 0,
      reviewCount: 0,
      createdAt: new Date(),
    };
    this.products.set(newProduct.id, newProduct);
    return newProduct;
  }

  async getProducts(filters?: { category?: string; featured?: boolean; sellerId?: string }): Promise<Product[]> {
    let products = Array.from(this.products.values());
    
    if (filters?.category) {
      products = products.filter(p => p.category === filters.category);
    }
    if (filters?.featured !== undefined) {
      products = products.filter(p => p.featured === filters.featured);
    }
    if (filters?.sellerId) {
      products = products.filter(p => p.sellerId === filters.sellerId);
    }
    
    return products.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async getProductById(id: string): Promise<Product | null> {
    return this.products.get(id) || null;
  }

  async updateProduct(id: string, updates: Partial<Product>): Promise<Product | null> {
    const product = this.products.get(id);
    if (!product) return null;
    
    const updatedProduct = { ...product, ...updates };
    this.products.set(id, updatedProduct);
    return updatedProduct;
  }

  async deleteProduct(id: string): Promise<boolean> {
    return this.products.delete(id);
  }

  // Order methods
  async createOrder(order: InsertOrder): Promise<Order> {
    const newOrder: Order = {
      ...order,
      id: uuidv4(),
      createdAt: new Date(),
    };
    this.orders.set(newOrder.id, newOrder);
    return newOrder;
  }

  async getOrderById(id: string): Promise<Order | null> {
    return this.orders.get(id) || null;
  }

  async getOrdersByUserId(userId: string): Promise<Order[]> {
    return Array.from(this.orders.values())
      .filter(order => order.userId === userId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async updateOrder(id: string, updates: Partial<Order>): Promise<Order | null> {
    const order = this.orders.get(id);
    if (!order) return null;
    
    const updatedOrder = { ...order, ...updates };
    this.orders.set(id, updatedOrder);
    return updatedOrder;
  }

  // Try-On methods
  async createTryOn(tryOn: InsertTryOn): Promise<TryOn> {
    const newTryOn: TryOn = {
      ...tryOn,
      id: uuidv4(),
      createdAt: new Date(),
    };
    this.tryOns.set(newTryOn.id, newTryOn);
    return newTryOn;
  }

  async getTryOnById(id: string): Promise<TryOn | null> {
    return this.tryOns.get(id) || null;
  }

  async getTryOnsByUserId(userId: string): Promise<TryOn[]> {
    return Array.from(this.tryOns.values())
      .filter(tryOn => tryOn.userId === userId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async updateTryOn(id: string, updates: Partial<TryOn>): Promise<TryOn | null> {
    const tryOn = this.tryOns.get(id);
    if (!tryOn) return null;
    
    const updatedTryOn = { ...tryOn, ...updates };
    this.tryOns.set(id, updatedTryOn);
    return updatedTryOn;
  }

  // Size Recommendation methods
  async createSizeRecommendation(recommendation: InsertSizeRecommendation): Promise<SizeRecommendation> {
    const newRecommendation: SizeRecommendation = {
      ...recommendation,
      id: uuidv4(),
      createdAt: new Date(),
    };
    this.sizeRecommendations.set(newRecommendation.id, newRecommendation);
    return newRecommendation;
  }

  async getSizeRecommendationsByUserId(userId: string): Promise<SizeRecommendation[]> {
    return Array.from(this.sizeRecommendations.values())
      .filter(rec => rec.userId === userId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async getSizeRecommendationByProduct(userId: string, productId: string): Promise<SizeRecommendation | null> {
    for (const rec of this.sizeRecommendations.values()) {
      if (rec.userId === userId && rec.productId === productId) {
        return rec;
      }
    }
    return null;
  }
}

export const storage = new MemStorage();