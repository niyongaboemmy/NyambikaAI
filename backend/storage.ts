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
  subscriptions,
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
} from "./shared/schema.dialect";
import { db } from "./db";
import { eq, like, and, desc, asc, inArray, gt, sql } from "drizzle-orm";
import crypto from "crypto";

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
  getProducerOrders(producerId: string): Promise<Order[]>;
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
  getCompanyById(id: string): Promise<Company | undefined>;
  getCompanies(): Promise<Company[]>;
  getProductsByCompanyId(companyId: string): Promise<any[]>;
  createCompany(company: InsertCompany): Promise<Company>;
  updateCompany(
    producerId: string,
    updates: Partial<InsertCompany>
  ): Promise<Company | undefined>;
}

export class DatabaseStorage implements IStorage {
  private readonly isMySQL =
    String(process.env.DB_DIALECT || "mysql").toLowerCase() === "mysql";
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
    // For MySQL with UUID, we need to generate the ID first
    const userId = crypto.randomUUID();
    const newUser = { ...user, id: userId };

    // Insert the user with the generated UUID
    await db.insert(users).values(newUser);

    // Fetch the newly created user to get all fields
    const [createdUser] = await db
      .select()
      .from(users)
      .where(eq(users.id, userId));
    if (!createdUser) throw new Error("Failed to create user");

    return createdUser;
  }

  async updateUser(
    id: string,
    updates: Partial<InsertUser>
  ): Promise<User | undefined> {
    if (this.isMySQL) {
      await db.update(users).set(updates).where(eq(users.id, id)).execute();
      const [row] = await db.select().from(users).where(eq(users.id, id));
      return row || undefined;
    } else {
      const [user] = await db
        .update(users)
        .set(updates)
        .where(eq(users.id, id))
        .returning();
      return user || undefined;
    }
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
    const id = crypto.randomUUID();
    await db.insert(categories).values({ id, ...category });
    const [created] = await db
      .select()
      .from(categories)
      .where(eq(categories.id, id));
    if (!created) throw new Error("Failed to create category");
    return created;
  }

  async updateCategory(
    id: string,
    updates: Partial<InsertCategory>
  ): Promise<Category | undefined> {
    if (this.isMySQL) {
      await db
        .update(categories)
        .set(updates)
        .where(eq(categories.id, id))
        .execute();
      const [row] = await db
        .select()
        .from(categories)
        .where(eq(categories.id, id));
      return row || undefined;
    } else {
      const [category] = await db
        .update(categories)
        .set(updates)
        .where(eq(categories.id, id))
        .returning();
      return category || undefined;
    }
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
    const conditions = [] as any[];
    if (options?.categoryId) {
      conditions.push(eq(products.categoryId, options.categoryId));
    }
    if (options?.search) {
      conditions.push(like(products.name, `%${options.search}%`));
    }
    if (options?.producerId) {
      conditions.push(eq(products.producerId, options.producerId));
    }

    // Server-side enforcement: only include products from producers who are
    // verified and have an active, non-expired subscription.
    // 1) Find producer IDs with active subscriptions
    const now = new Date();
    const producersWithActiveSubs = await db
      .select({ id: users.id })
      .from(users)
      .innerJoin(subscriptions, eq(subscriptions.userId, users.id))
      .where(
        and(
          eq(users.role, "producer"),
          eq(users.isVerified, true),
          eq(subscriptions.status, "active"),
          gt(subscriptions.endDate, now)
        )
      );

    const allowedProducerIds = producersWithActiveSubs.map((r: any) => r.id);

    // If none, short-circuit with empty results
    if (allowedProducerIds.length === 0) {
      return [];
    }

    conditions.push(inArray(products.producerId, allowedProducerIds));

    // Build query with all conditions
    let query: any = db.select().from(products);

    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    // Order by display_order (non-null first, ascending), then newest
    query = query.orderBy(
      sql`CASE WHEN ${products.displayOrder} IS NULL THEN 1 ELSE 0 END`,
      sql`${products.displayOrder} ASC`,
      desc(products.createdAt)
    );

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
    const id = crypto.randomUUID();
    await db.insert(products).values({ id, ...product });
    const [created] = await db
      .select()
      .from(products)
      .where(eq(products.id, id));
    if (!created) throw new Error("Failed to create product");
    return created;
  }

  async updateProduct(
    id: string,
    updates: Partial<InsertProduct>
  ): Promise<Product | undefined> {
    if (this.isMySQL) {
      await db
        .update(products)
        .set(updates)
        .where(eq(products.id, id))
        .execute();
      const [row] = await db.select().from(products).where(eq(products.id, id));
      return row || undefined;
    } else {
      const [product] = await db
        .update(products)
        .set(updates)
        .where(eq(products.id, id))
        .returning();
      return product || undefined;
    }
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
      if (this.isMySQL) {
        await db
          .update(cartItems)
          .set({ quantity: existingItem.quantity! + (cartItem.quantity || 1) })
          .where(eq(cartItems.id, existingItem.id))
          .execute();
        const [row] = await db
          .select()
          .from(cartItems)
          .where(eq(cartItems.id, existingItem.id));
        return row as any;
      } else {
        const [updatedItem] = await db
          .update(cartItems)
          .set({ quantity: existingItem.quantity! + (cartItem.quantity || 1) })
          .where(eq(cartItems.id, existingItem.id))
          .returning();
        return updatedItem;
      }
    } else {
      // Insert new item with explicit UUID
      const id = crypto.randomUUID();
      await db.insert(cartItems).values({ id, ...cartItem });
      const [created] = await db
        .select()
        .from(cartItems)
        .where(eq(cartItems.id, id));
      if (!created) throw new Error("Failed to add to cart");
      return created;
    }
  }

  async updateCartItem(
    id: string,
    updates: Partial<InsertCartItem>
  ): Promise<CartItem | undefined> {
    if (this.isMySQL) {
      await db
        .update(cartItems)
        .set(updates)
        .where(eq(cartItems.id, id))
        .execute();
      const [row] = await db
        .select()
        .from(cartItems)
        .where(eq(cartItems.id, id));
      return row || undefined;
    } else {
      const [item] = await db
        .update(cartItems)
        .set(updates)
        .where(eq(cartItems.id, id))
        .returning();
      return item || undefined;
    }
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

  async getProducerOrders(
    producerId: string,
    status?: string
  ): Promise<Order[]> {
    // First, get all order IDs that have products from this producer
    const orderIdsQuery = db
      .selectDistinct({ id: orders.id })
      .from(orders)
      .innerJoin(orderItems, eq(orders.id, orderItems.orderId))
      .innerJoin(products, eq(orderItems.productId, products.id))
      .where(eq(products.producerId, producerId));

    // Get the full order details for those orders
    const orderIdsList = (await orderIdsQuery).map((o: any) => o.id);

    if (orderIdsList.length === 0) {
      return [];
    }

    // Build the query with status filter if provided
    const conditions = [inArray(orders.id, orderIdsList)];
    if (status && status !== "all") {
      conditions.push(eq(orders.status, status));
    }

    const result = await db
      .select()
      .from(orders)
      .where(and(...conditions))
      .orderBy(desc(orders.createdAt));

    // Get all order items for these orders with product details,
    // but only include items from this producer
    const orderItemsWithProducts = await db
      .select({
        orderId: orderItems.orderId,
        id: orderItems.id,
        productId: orderItems.productId,
        quantity: orderItems.quantity,
        price: orderItems.price,
        size: orderItems.size,
        color: orderItems.color,
        product: {
          id: products.id,
          name: products.name,
          imageUrl: products.imageUrl,
          producerId: products.producerId,
        },
      })
      .from(orderItems)
      .innerJoin(products, eq(orderItems.productId, products.id))
      .where(
        and(
          inArray(orderItems.orderId, orderIdsList),
          eq(products.producerId, producerId) // Only include products from this producer
        )
      );

    // Group order items by order ID
    const itemsByOrderId = orderItemsWithProducts.reduce(
      (acc: Record<string, any[]>, item: any) => {
        const orderId = item.orderId || ""; // Ensure we have a string key
        if (!acc[orderId]) {
          acc[orderId] = [];
        }
        acc[orderId].push({
          id: item.id,
          productId: item.productId,
          quantity: item.quantity,
          price: item.price,
          size: item.size,
          color: item.color,
          product: item.product,
        });
        return acc;
      },
      {} as Record<string, any[]>
    );

    // Combine orders with their items
    return result.map((order: any) => ({
      ...order,
      items: itemsByOrderId[order.id] || [],
    }));
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
    const id = crypto.randomUUID();
    await db.insert(orders).values({ id, ...order });

    const orderItemsWithOrderId = items.map((item) => ({
      id: crypto.randomUUID(),
      ...item,
      orderId: id,
    }));

    await db.insert(orderItems).values(orderItemsWithOrderId);
    const [created] = await db.select().from(orders).where(eq(orders.id, id));
    if (!created) throw new Error("Failed to create order");
    return created;
  }

  async updateOrderStatus(
    id: string,
    status: string
  ): Promise<Order | undefined> {
    if (this.isMySQL) {
      await db
        .update(orders)
        .set({ status })
        .where(eq(orders.id, id))
        .execute();
      const [row] = await db.select().from(orders).where(eq(orders.id, id));
      return row || undefined;
    } else {
      const [order] = await db
        .update(orders)
        .set({ status })
        .where(eq(orders.id, id))
        .returning();
      return order || undefined;
    }
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
    const id = crypto.randomUUID();
    await db.insert(favorites).values({ id, ...favorite });
    const [created] = await db
      .select()
      .from(favorites)
      .where(eq(favorites.id, id));
    if (!created) throw new Error("Failed to add favorite");
    return created;
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
    try {
      return await db
        .select()
        .from(tryOnSessions)
        .where(eq(tryOnSessions.userId, userId))
        .orderBy(desc(tryOnSessions.createdAt))
        .limit(50); // Limit results to prevent large queries
    } catch (error) {
      console.error("Database error in getTryOnSessions:", error);
      return []; // Return empty array on error
    }
  }

  async getTryOnSession(id: string): Promise<TryOnSession | undefined> {
    const [session] = await db
      .select()
      .from(tryOnSessions)
      .where(eq(tryOnSessions.id, id));
    return session || undefined;
  }

  async createTryOnSession(session: InsertTryOnSession): Promise<TryOnSession> {
    const id = crypto.randomUUID();
    await db.insert(tryOnSessions).values({ id, ...session });
    const [created] = await db
      .select()
      .from(tryOnSessions)
      .where(eq(tryOnSessions.id, id));
    if (!created) throw new Error("Failed to create try-on session");
    return created;
  }

  async updateTryOnSession(
    id: string,
    updates: Partial<InsertTryOnSession>
  ): Promise<TryOnSession | undefined> {
    if (this.isMySQL) {
      await db
        .update(tryOnSessions)
        .set(updates)
        .where(eq(tryOnSessions.id, id))
        .execute();
      const [row] = await db
        .select()
        .from(tryOnSessions)
        .where(eq(tryOnSessions.id, id));
      return row || undefined;
    } else {
      const [session] = await db
        .update(tryOnSessions)
        .set(updates)
        .where(eq(tryOnSessions.id, id))
        .returning();
      return session || undefined;
    }
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
    const id = crypto.randomUUID();
    await db.insert(reviews).values({ id, ...review });
    const [created] = await db.select().from(reviews).where(eq(reviews.id, id));
    if (!created) throw new Error("Failed to create review");
    return created;
  }

  // Producers
  async getProducers(limit?: number): Promise<User[]> {
    let q: any = db
      .select()
      .from(users)
      .where(eq(users.role, "producer"))
      .orderBy(asc(users.fullName));
    if (limit && limit > 0) {
      q = q.limit(limit);
    }
    return await q;
  }

  // Companies
  async getCompanyByProducerId(
    producerId: string
  ): Promise<Company | undefined> {
    try {
      const [company] = await db
        .select()
        .from(companies)
        .where(eq(companies.producerId, producerId));
      return company || undefined;
    } catch (error) {
      console.error("Database error in getCompanyByProducerId:", error);
      return undefined;
    }
  }

  async getCompanies(): Promise<Company[]> {
    try {
      return await db.select().from(companies).orderBy(asc(companies.name));
    } catch (error) {
      console.error("Database error in getCompanies:", error);
      return [];
    }
  }

  async createCompany(company: InsertCompany): Promise<Company> {
    const id = crypto.randomUUID();
    await db.insert(companies).values({ id, ...company });
    const [created] = await db
      .select()
      .from(companies)
      .where(eq(companies.id, id));
    if (!created) throw new Error("Failed to create company");
    return created;
  }

  async updateCompany(
    producerId: string,
    updates: Partial<InsertCompany>
  ): Promise<Company | undefined> {
    if (this.isMySQL) {
      await db
        .update(companies)
        .set(updates)
        .where(eq(companies.producerId, producerId))
        .execute();
      const [row] = await db
        .select()
        .from(companies)
        .where(eq(companies.producerId, producerId));
      return row || undefined;
    } else {
      const [updated] = await db
        .update(companies)
        .set(updates)
        .where(eq(companies.producerId, producerId))
        .returning();
      return updated || undefined;
    }
  }

  async getCompanyById(id: string): Promise<Company | undefined> {
    try {
      const [company] = await db
        .select()
        .from(companies)
        .where(eq(companies.id, id));
      return company || undefined;
    } catch (error) {
      console.error("Database error in getCompanyById:", error);
      return undefined;
    }
  }

  async getProductsByCompanyId(companyId: string): Promise<any[]> {
    try {
      const now = new Date();
      const companyProducts = await db
        .select({
          id: products.id,
          name: products.name,
          nameRw: products.nameRw,
          description: products.description,
          price: products.price,
          imageUrl: products.imageUrl,
          categoryId: products.categoryId,
          categoryName: categories.name,
          inStock: products.inStock,
          sizes: products.sizes,
          colors: products.colors,
        })
        .from(products)
        .leftJoin(categories, eq(products.categoryId, categories.id))
        .leftJoin(companies, eq(products.producerId, companies.producerId))
        .innerJoin(users, eq(products.producerId, users.id))
        .innerJoin(subscriptions, eq(subscriptions.userId, users.id))
        .where(
          and(
            eq(companies.id, companyId),
            eq(users.role, "producer"),
            eq(users.isVerified, true),
            eq(subscriptions.status, "active"),
            gt(subscriptions.endDate, now)
          )
        )
        .orderBy(
          sql`CASE WHEN ${products.displayOrder} IS NULL THEN 1 ELSE 0 END`,
          sql`${products.displayOrder} ASC`,
          desc(products.createdAt)
        );

      return companyProducts;
    } catch (error) {
      console.error("Database error in getProductsByCompanyId:", error);
      return [];
    }
  }
}

export const storage = new DatabaseStorage();
