import {
  users,
  products,
  categories,
  cartItems,
  orders,
  orderItems,
  favorites,
  tryOnSessions,
  reviews,
  companies,
  type User,
  type InsertUser,
  type Company,
  type InsertCompany,
  type Product,
  type InsertProduct,
  type Category,
  type InsertCategory,
  type CartItem,
  type InsertCartItem,
  type Order,
  type InsertOrder,
  type OrderItem,
  type InsertOrderItem,
  type Favorite,
  type InsertFavorite,
  type TryOnSession,
  type InsertTryOnSession,
  type Review,
  type InsertReview,
} from "@shared/schema";
import { db } from "./db";
import { eq, like, and, desc, asc } from "drizzle-orm";

export interface IStorage {
  // User operations
  getUser(id: string): Promise<User | undefined>;
  getUserById(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(
    id: string,
    updates: Partial<InsertUser>
  ): Promise<User | undefined>;

  // Category operations
  getCategories(): Promise<Category[]>;
  getCategory(id: string): Promise<Category | undefined>;
  createCategory(category: InsertCategory): Promise<Category>;
  updateCategory(
    id: string,
    updates: Partial<InsertCategory>
  ): Promise<Category | undefined>;
  deleteCategory(id: string): Promise<void>;

  // Product operations
  getProducts(options?: {
    categoryId?: string;
    search?: string;
    limit?: number;
    offset?: number;
    producerId?: string;
  }): Promise<Product[]>;
  getProduct(id: string): Promise<Product | undefined>;
  createProduct(product: InsertProduct): Promise<Product>;
  updateProduct(
    id: string,
    updates: Partial<InsertProduct>
  ): Promise<Product | undefined>;
  deleteProduct(id: string): Promise<void>;

  // Cart operations
  getCartItems(userId: string): Promise<(CartItem & { product: Product })[]>;
  addToCart(cartItem: InsertCartItem): Promise<CartItem>;
  updateCartItem(
    id: string,
    updates: Partial<InsertCartItem>
  ): Promise<CartItem | undefined>;
  removeFromCart(id: string): Promise<void>;
  clearCart(userId: string): Promise<void>;

  // Order operations
  getOrders(userId: string): Promise<Order[]>;
  getOrder(
    id: string
  ): Promise<
    (Order & { items: (OrderItem & { product: Product })[] }) | undefined
  >;
  createOrder(order: InsertOrder, items: InsertOrderItem[]): Promise<Order>;
  updateOrderStatus(id: string, status: string): Promise<Order | undefined>;

  // Favorites operations
  getFavorites(userId: string): Promise<(Favorite & { product: Product })[]>;
  addToFavorites(favorite: InsertFavorite): Promise<Favorite>;
  removeFromFavorites(userId: string, productId: string): Promise<void>;
  isFavorite(userId: string, productId: string): Promise<boolean>;

  // Try-on session operations
  getTryOnSessions(userId: string): Promise<TryOnSession[]>;
  getTryOnSession(id: string): Promise<TryOnSession | undefined>;
  createTryOnSession(session: InsertTryOnSession): Promise<TryOnSession>;
  updateTryOnSession(
    id: string,
    updates: Partial<InsertTryOnSession>
  ): Promise<TryOnSession | undefined>;

  // Reviews operations
  getReviews(productId?: string): Promise<Review[]>;
  createReview(review: InsertReview): Promise<Review>;

  // Producers
  getProducers(limit?: number): Promise<User[]>;

  // Companies
  getCompanyByProducerId(producerId: string): Promise<Company | undefined>;
  getCompanies(): Promise<Company[]>;
  createCompany(company: InsertCompany): Promise<Company>;
  updateCompany(
    producerId: string,
    updates: Partial<InsertCompany>
  ): Promise<Company | undefined>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserById(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.username, username));
    return user || undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || undefined;
  }

  async createUser(user: InsertUser): Promise<User> {
    const [newUser] = await db.insert(users).values(user).returning();
    return newUser;
  }

  async updateUser(
    id: string,
    updates: Partial<InsertUser>
  ): Promise<User | undefined> {
    const [user] = await db
      .update(users)
      .set(updates)
      .where(eq(users.id, id))
      .returning();
    return user || undefined;
  }

  // Category operations
  async getCategories(): Promise<Category[]> {
    return await db.select().from(categories).orderBy(asc(categories.name));
  }

  async getCategory(id: string): Promise<Category | undefined> {
    const [category] = await db
      .select()
      .from(categories)
      .where(eq(categories.id, id));
    return category || undefined;
  }

  async createCategory(category: InsertCategory): Promise<Category> {
    const [newCategory] = await db
      .insert(categories)
      .values(category)
      .returning();
    return newCategory;
  }

  async updateCategory(
    id: string,
    updates: Partial<InsertCategory>
  ): Promise<Category | undefined> {
    const [category] = await db
      .update(categories)
      .set(updates)
      .where(eq(categories.id, id))
      .returning();
    return category || undefined;
  }

  async deleteCategory(id: string): Promise<void> {
    await db.delete(categories).where(eq(categories.id, id));
  }

  // Product operations
  async getProducts(options?: {
    categoryId?: string;
    search?: string;
    limit?: number;
    offset?: number;
    producerId?: string;
  }): Promise<Product[]> {
    // Build conditions array
    const conditions = [];
    if (options?.categoryId) {
      conditions.push(eq(products.categoryId, options.categoryId));
    }
    if (options?.search) {
      conditions.push(like(products.name, `%${options.search}%`));
    }
    if (options?.producerId) {
      conditions.push(eq(products.producerId, options.producerId));
    }

    // Build query with all conditions
    let query: any = db.select().from(products);

    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    query = query.orderBy(desc(products.createdAt));

    if (options?.limit) {
      query = query.limit(options.limit);
    }
    if (options?.offset) {
      query = query.offset(options.offset);
    }

    return await query;
  }

  async getProduct(id: string): Promise<Product | undefined> {
    const [product] = await db
      .select()
      .from(products)
      .where(eq(products.id, id));
    return product || undefined;
  }

  async createProduct(product: InsertProduct): Promise<Product> {
    const [newProduct] = await db.insert(products).values(product).returning();
    return newProduct;
  }

  async updateProduct(
    id: string,
    updates: Partial<InsertProduct>
  ): Promise<Product | undefined> {
    const [product] = await db
      .update(products)
      .set(updates)
      .where(eq(products.id, id))
      .returning();
    return product || undefined;
  }

  async deleteProduct(id: string): Promise<void> {
    await db.delete(products).where(eq(products.id, id));
  }

  // Cart operations
  async getCartItems(
    userId: string
  ): Promise<(CartItem & { product: Product })[]> {
    const results = await db
      .select({
        id: cartItems.id,
        userId: cartItems.userId,
        productId: cartItems.productId,
        quantity: cartItems.quantity,
        size: cartItems.size,
        color: cartItems.color,
        createdAt: cartItems.createdAt,
        product: products,
      })
      .from(cartItems)
      .innerJoin(products, eq(cartItems.productId, products.id))
      .where(eq(cartItems.userId, userId))
      .orderBy(desc(cartItems.createdAt));

    return results as (CartItem & { product: Product })[];
  }

  async addToCart(cartItem: InsertCartItem): Promise<CartItem> {
    // Check if item already exists in cart
    const [existingItem] = await db
      .select()
      .from(cartItems)
      .where(
        and(
          eq(cartItems.userId, cartItem.userId!),
          eq(cartItems.productId, cartItem.productId!),
          eq(cartItems.size, cartItem.size || ""),
          eq(cartItems.color, cartItem.color || "")
        )
      );

    if (existingItem) {
      // Update quantity
      const [updatedItem] = await db
        .update(cartItems)
        .set({ quantity: existingItem.quantity! + (cartItem.quantity || 1) })
        .where(eq(cartItems.id, existingItem.id))
        .returning();
      return updatedItem;
    } else {
      // Insert new item
      const [newItem] = await db.insert(cartItems).values(cartItem).returning();
      return newItem;
    }
  }

  async updateCartItem(
    id: string,
    updates: Partial<InsertCartItem>
  ): Promise<CartItem | undefined> {
    const [item] = await db
      .update(cartItems)
      .set(updates)
      .where(eq(cartItems.id, id))
      .returning();
    return item || undefined;
  }

  async removeFromCart(id: string): Promise<void> {
    await db.delete(cartItems).where(eq(cartItems.id, id));
  }

  async clearCart(userId: string): Promise<void> {
    await db.delete(cartItems).where(eq(cartItems.userId, userId));
  }

  // Order operations
  async getOrders(userId: string): Promise<Order[]> {
    return await db
      .select()
      .from(orders)
      .where(eq(orders.customerId, userId))
      .orderBy(desc(orders.createdAt));
  }

  async getOrder(
    id: string
  ): Promise<
    (Order & { items: (OrderItem & { product: Product })[] }) | undefined
  > {
    const [order] = await db.select().from(orders).where(eq(orders.id, id));
    if (!order) return undefined;

    const items = await db
      .select({
        id: orderItems.id,
        orderId: orderItems.orderId,
        productId: orderItems.productId,
        quantity: orderItems.quantity,
        price: orderItems.price,
        size: orderItems.size,
        color: orderItems.color,
        product: products,
      })
      .from(orderItems)
      .innerJoin(products, eq(orderItems.productId, products.id))
      .where(eq(orderItems.orderId, id));

    return { ...order, items: items as (OrderItem & { product: Product })[] };
  }

  async createOrder(
    order: InsertOrder,
    items: InsertOrderItem[]
  ): Promise<Order> {
    const [newOrder] = await db.insert(orders).values(order).returning();

    const orderItemsWithOrderId = items.map((item) => ({
      ...item,
      orderId: newOrder.id,
    }));

    await db.insert(orderItems).values(orderItemsWithOrderId);

    return newOrder;
  }

  async updateOrderStatus(
    id: string,
    status: string
  ): Promise<Order | undefined> {
    const [order] = await db
      .update(orders)
      .set({ status })
      .where(eq(orders.id, id))
      .returning();
    return order || undefined;
  }

  // Favorites operations
  async getFavorites(
    userId: string
  ): Promise<(Favorite & { product: Product })[]> {
    const results = await db
      .select({
        id: favorites.id,
        userId: favorites.userId,
        productId: favorites.productId,
        createdAt: favorites.createdAt,
        product: products,
      })
      .from(favorites)
      .innerJoin(products, eq(favorites.productId, products.id))
      .where(eq(favorites.userId, userId))
      .orderBy(desc(favorites.createdAt));

    return results as (Favorite & { product: Product })[];
  }

  async addToFavorites(favorite: InsertFavorite): Promise<Favorite> {
    const [newFavorite] = await db
      .insert(favorites)
      .values(favorite)
      .returning();
    return newFavorite;
  }

  async removeFromFavorites(userId: string, productId: string): Promise<void> {
    await db
      .delete(favorites)
      .where(
        and(eq(favorites.userId, userId), eq(favorites.productId, productId))
      );
  }

  async isFavorite(userId: string, productId: string): Promise<boolean> {
    const [favorite] = await db
      .select()
      .from(favorites)
      .where(
        and(eq(favorites.userId, userId), eq(favorites.productId, productId))
      );
    return !!favorite;
  }

  // Try-on session operations
  async getTryOnSessions(userId: string): Promise<TryOnSession[]> {
    return await db
      .select()
      .from(tryOnSessions)
      .where(eq(tryOnSessions.userId, userId))
      .orderBy(desc(tryOnSessions.createdAt));
  }

  async getTryOnSession(id: string): Promise<TryOnSession | undefined> {
    const [session] = await db
      .select()
      .from(tryOnSessions)
      .where(eq(tryOnSessions.id, id));
    return session || undefined;
  }

  async createTryOnSession(session: InsertTryOnSession): Promise<TryOnSession> {
    const [newSession] = await db
      .insert(tryOnSessions)
      .values(session)
      .returning();
    return newSession;
  }

  async updateTryOnSession(
    id: string,
    updates: Partial<InsertTryOnSession>
  ): Promise<TryOnSession | undefined> {
    const [session] = await db
      .update(tryOnSessions)
      .set(updates)
      .where(eq(tryOnSessions.id, id))
      .returning();
    return session || undefined;
  }

  // Reviews operations
  async getReviews(productId?: string): Promise<Review[]> {
    if (productId) {
      return await db
        .select()
        .from(reviews)
        .where(eq(reviews.productId, productId))
        .orderBy(desc(reviews.createdAt));
    }
    return await db.select().from(reviews).orderBy(desc(reviews.createdAt));
  }

  async createReview(review: InsertReview): Promise<Review> {
    const [newReview] = await db.insert(reviews).values(review).returning();
    return newReview;
  }

  // Producers
  async getProducers(limit?: number): Promise<User[]> {
    let q: any = db
      .select()
      .from(users)
      .where(eq(users.role, 'producer'))
      .orderBy(asc(users.fullName));
    if (limit && limit > 0) {
      q = q.limit(limit);
    }
    return await q;
  }

  // Companies
  async getCompanyByProducerId(producerId: string): Promise<Company | undefined> {
    const [company] = await db
      .select()
      .from(companies)
      .where(eq(companies.producerId, producerId));
    return company || undefined;
  }

  async getCompanies(): Promise<Company[]> {
    return await db.select().from(companies).orderBy(asc(companies.name));
  }

  async createCompany(company: InsertCompany): Promise<Company> {
    const [newCompany] = await db.insert(companies).values(company).returning();
    return newCompany;
  }

  async updateCompany(
    producerId: string,
    updates: Partial<InsertCompany>
  ): Promise<Company | undefined> {
    const [updated] = await db
      .update(companies)
      .set(updates)
      .where(eq(companies.producerId, producerId))
      .returning();
    return updated || undefined;
  }
}

export const storage = new DatabaseStorage();
