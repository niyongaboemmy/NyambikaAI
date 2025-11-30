import { sql } from "drizzle-orm";
import {
  pgTable,
  text,
  varchar,
  integer,
  decimal,
  timestamp,
  boolean,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  fullName: text("full_name"),
  fullNameRw: text("full_name_rw"),
  phone: text("phone"),
  location: text("location"),
  role: text("role").notNull().default("customer"), // customer, producer, admin, agent
  businessName: text("business_name"), // for producers
  businessLicense: text("business_license"), // for producers
  isVerified: boolean("is_verified").default(false),
  measurements: text("measurements"), // JSON string for body measurements
  profileImage: text("profile_image"),
  // Agent terms & conditions acceptance
  termsAccepted: boolean("terms_accepted").default(false),
  termsAcceptedAt: timestamp("terms_accepted_at"),
  // Referral network fields (for agents)
  referralCode: text("referral_code").unique(), // unique, shareable code
  referredBy: varchar("referred_by"), // parent agent id (nullable) - self-referential FK omitted to avoid TS circular ref
  isActive: boolean("is_active").default(true), // used to block commissions for inactive/banned accounts
  createdAt: timestamp("created_at").defaultNow(),
});

// Companies table for producer business details
export const companies = pgTable("companies", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  producerId: varchar("producer_id")
    .references(() => users.id)
    .notNull()
    .unique(),
  tin: text("tin"),
  name: text("name").notNull(),
  email: text("email").notNull(),
  phone: text("phone").notNull(),
  location: text("location").notNull(),
  logoUrl: text("logo_url"),
  websiteUrl: text("website_url"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const categories = pgTable("categories", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  nameRw: text("name_rw").notNull(),
  description: text("description"),
  imageUrl: text("image_url"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const products = pgTable("products", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  nameRw: text("name_rw").notNull(),
  description: text("description").notNull(),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  categoryId: varchar("category_id").references(() => categories.id),
  producerId: varchar("producer_id").references(() => users.id), // seller/producer
  imageUrl: text("image_url").notNull(),
  additionalImages: text("additional_images").array(),
  sizes: text("sizes").array(),
  colors: text("colors").array(),
  stockQuantity: integer("stock_quantity").default(0),
  inStock: boolean("in_stock").default(true),
  isApproved: boolean("is_approved").default(false), // admin approval
  // Lower values appear first. NULL means not prioritized; treated as large number in ordering.
  displayOrder: integer("display_order"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const cartItems = pgTable("cart_items", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id),
  productId: varchar("product_id").references(() => products.id),
  quantity: integer("quantity").default(1),
  size: text("size"),
  color: text("color"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const orders = pgTable("orders", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  customerId: varchar("customer_id").references(() => users.id),
  producerId: varchar("producer_id").references(() => users.id),
  total: decimal("total", { precision: 10, scale: 2 }).notNull(),
  status: text("status").notNull().default("pending"), // pending, confirmed, processing, shipped, delivered, cancelled, handled
  validationStatus: text("validation_status").default("pending"), // pending, in_progress, done, confirmed_by_customer
  paymentMethod: text("payment_method"),
  shippingAddress: text("shipping_address"),
  createdAt: timestamp("created_at").defaultNow(),
  paymentStatus: text("payment_status").default("pending"),
  trackingNumber: text("tracking_number"),
  notes: text("notes"),
  sizeEvidenceImages: text("size_evidence_images").array(), // customer uploaded size evidence photos
  isConfirmedByCustomer: boolean("is_confirmed_by_customer").default(false), // customer confirmation of receipt
  customerConfirmationDate: timestamp("customer_confirmation_date"),
});

export const orderItems = pgTable("order_items", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  orderId: varchar("order_id").references(() => orders.id),
  productId: varchar("product_id").references(() => products.id),
  quantity: integer("quantity").default(1),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  size: text("size"),
  color: text("color"),
});

export const favorites = pgTable("favorites", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id),
  productId: varchar("product_id").references(() => products.id),
  createdAt: timestamp("created_at").defaultNow(),
});

export const tryOnSessions = pgTable("try_on_sessions", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id),
  customerImageUrl: text("customer_image_url").notNull(),
  productId: varchar("product_id").references(() => products.id),
  tryOnImageUrl: text("try_on_image_url"),
  fitRecommendation: text("fit_recommendation"), // JSON string
  status: text("status").notNull().default("processing"), // processing, completed, failed
  isHidden: boolean("is_hidden").default(false), // soft delete - hide instead of delete
  isFavorite: boolean("is_favorite").default(false), // user can favorite try-ons
  notes: text("notes"), // user notes about this try-on
  rating: integer("rating"), // 1-5 rating for the try-on result
  likes: integer("likes").default(0), // total likes count
  views: integer("views").default(0), // total views count
  createdAt: timestamp("created_at").defaultNow(),
});

// Outfit Collections - Group try-ons into styled looks
export const outfitCollections = pgTable("outfit_collections", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  userId: varchar("user_id")
    .references(() => users.id)
    .notNull(),
  name: text("name").notNull(),
  description: text("description"),
  occasion: text("occasion"), // casual, formal, party, work, etc.
  season: text("season"), // spring, summer, fall, winter, all-season
  coverImageUrl: text("cover_image_url"), // main image for the collection
  isPublic: boolean("is_public").default(false), // share with community
  likes: integer("likes").default(0),
  views: integer("views").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Items in outfit collections
export const outfitItems = pgTable("outfit_items", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  outfitId: varchar("outfit_id")
    .references(() => outfitCollections.id)
    .notNull(),
  tryOnSessionId: varchar("try_on_session_id").references(
    () => tryOnSessions.id
  ),
  productId: varchar("product_id").references(() => products.id),
  position: integer("position").default(0), // ordering within outfit
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Session Likes - Track who liked which try-on session
export const sessionLikes = pgTable("session_likes", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  sessionId: varchar("session_id")
    .references(() => tryOnSessions.id)
    .notNull(),
  userId: varchar("user_id")
    .references(() => users.id)
    .notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Session Views - Track views for analytics
export const sessionViews = pgTable("session_views", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  sessionId: varchar("session_id")
    .references(() => tryOnSessions.id)
    .notNull(),
  userId: varchar("user_id").references(() => users.id), // nullable for anonymous views
  viewedAt: timestamp("viewed_at").defaultNow(),
});

// Session Comments - Comments on try-on sessions
export const sessionComments = pgTable("session_comments", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  sessionId: varchar("session_id")
    .references(() => tryOnSessions.id)
    .notNull(),
  userId: varchar("user_id")
    .references(() => users.id)
    .notNull(),
  text: text("text").notNull(),
  isDeleted: boolean("is_deleted").default(false), // soft delete for comments
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Session Saves - Track which users saved which sessions
export const sessionSaves = pgTable("session_saves", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  sessionId: varchar("session_id")
    .references(() => tryOnSessions.id)
    .notNull(),
  userId: varchar("user_id")
    .references(() => users.id)
    .notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// User Style Profiles - Track preferences and history
export const userStyleProfiles = pgTable("user_style_profiles", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  userId: varchar("user_id")
    .references(() => users.id)
    .notNull()
    .unique(),
  favoriteColors: text("favorite_colors").array(), // tracked from try-on history
  favoriteCategories: text("favorite_categories").array(),
  preferredBrands: text("preferred_brands").array(),
  stylePreferences: text("style_preferences"), // JSON: {casual: 0.8, formal: 0.3, etc}
  bodyType: text("body_type"),
  skinTone: text("skin_tone"),
  aiInsights: text("ai_insights"), // JSON with AI-generated style insights
  lastAnalyzedAt: timestamp("last_analyzed_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const reviews = pgTable("reviews", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id),
  productId: varchar("product_id").references(() => products.id),
  orderId: varchar("order_id").references(() => orders.id),
  rating: integer("rating").notNull(), // 1-5 stars
  comment: text("comment"),
  images: text("images").array(), // review images
  isVerified: boolean("is_verified").default(false), // verified purchase
  createdAt: timestamp("created_at").defaultNow(),
});

// Subscription plans table
export const subscriptionPlans = pgTable("subscription_plans", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  nameRw: text("name_rw").notNull(),
  description: text("description").notNull(),
  descriptionRw: text("description_rw").notNull(),
  monthlyPrice: decimal("monthly_price", { precision: 10, scale: 2 }).notNull(),
  annualPrice: decimal("annual_price", { precision: 10, scale: 2 }).notNull(),
  features: text("features").array().notNull(), // JSON array of features
  featuresRw: text("features_rw").array().notNull(), // Kinyarwanda features
  maxProducts: integer("max_products").default(0), // 0 = unlimited
  maxOrders: integer("max_orders").default(0), // 0 = unlimited
  hasAnalytics: boolean("has_analytics").default(false),
  hasPrioritySupport: boolean("has_priority_support").default(false),
  hasCustomBranding: boolean("has_custom_branding").default(false),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// User subscriptions table
export const subscriptions = pgTable("subscriptions", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  userId: varchar("user_id")
    .references(() => users.id)
    .notNull(),
  planId: varchar("plan_id")
    .references(() => subscriptionPlans.id)
    .notNull(),
  agentId: varchar("agent_id").references(() => users.id), // agent who paid for this subscription
  status: text("status").notNull().default("active"), // active, cancelled, expired, pending
  billingCycle: text("billing_cycle").notNull(), // monthly, annual
  startDate: timestamp("start_date").defaultNow(),
  endDate: timestamp("end_date").notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  paymentMethod: text("payment_method"), // mobile_money, airtel_money, bank_transfer
  paymentReference: text("payment_reference"),
  autoRenew: boolean("auto_renew").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

// Subscription payments table
export const subscriptionPayments = pgTable("subscription_payments", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  subscriptionId: varchar("subscription_id")
    .references(() => subscriptions.id)
    .notNull(),
  agentId: varchar("agent_id").references(() => users.id), // agent who made the payment
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  agentCommission: decimal("agent_commission", { precision: 10, scale: 2 }), // 40% commission
  paymentMethod: text("payment_method").notNull(),
  paymentReference: text("payment_reference"),
  status: text("status").notNull().default("pending"), // pending, completed, failed
  transactionId: text("transaction_id"),
  // Agent payout confirmation fields (admin marks when agent has received their commission)
  agentPayoutStatus: text("agent_payout_status").default("pending"), // pending, paid
  agentPayoutDate: timestamp("agent_payout_date"),
  agentPayoutReference: text("agent_payout_reference"),
  agentPayoutNotes: text("agent_payout_notes"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Agent referral commissions (level 1 and 2 passive earnings)
export const agentCommissions = pgTable("agent_commissions", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  // The agent who receives this referral commission
  agentId: varchar("agent_id")
    .references(() => users.id)
    .notNull(),
  // The direct agent whose action triggered this commission (the managed agent)
  sourceAgentId: varchar("source_agent_id")
    .references(() => users.id)
    .notNull(),
  // The subscription payment that generated this event
  subscriptionPaymentId: varchar("subscription_payment_id")
    .references(() => subscriptionPayments.id)
    .notNull(),
  // Level: 1 (parent of source) or 2 (grandparent of source)
  level: integer("level").notNull(),
  // Commission amount and status
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  status: text("status").notNull().default("pending"), // pending, approved, paid, cancelled
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Notifications table
export const notifications = pgTable("notifications", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  userId: varchar("user_id")
    .references(() => users.id)
    .notNull(),
  title: text("title").notNull(),
  message: text("message").notNull(),
  isRead: boolean("is_read").default(false),
  type: text("type").notNull(), // 'order', 'subscription', 'system', etc.
  referenceId: text("reference_id"), // ID of the related entity
  createdAt: timestamp("created_at").defaultNow(),
});

// User wallets table
export const userWallets = pgTable("user_wallets", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  userId: varchar("user_id")
    .references(() => users.id)
    .notNull()
    .unique(),
  balance: decimal("balance", { precision: 12, scale: 2 })
    .notNull()
    .default("0"),
  status: text("status").notNull().default("active"), // active, frozen
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Wallet payments table (top-ups and debits)
export const walletPayments = pgTable("wallet_payments", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  walletId: varchar("wallet_id")
    .references(() => userWallets.id)
    .notNull(),
  userId: varchar("user_id")
    .references(() => users.id)
    .notNull(),
  type: text("type").notNull().default("topup"), // topup | debit
  amount: decimal("amount", { precision: 12, scale: 2 }).notNull(),
  currency: text("currency").notNull().default("RWF"),
  method: text("method").notNull().default("mobile_money"), // mobile_money
  provider: text("provider").default("mtn"), // mtn | airtel
  phone: text("phone"),
  status: text("status").notNull().default("pending"), // pending, completed, failed
  externalReference: text("external_reference"),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const paymentSettings = pgTable("payment_settings", {
  id: integer("id")
    .primaryKey()
    .notNull()
    .default(sql`nextval('payment_settings_id_seq'::regclass)`),
  name: text("name").notNull().unique(),
  description: text("description"),
  amountInRwf: integer("amount_in_rwf").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Newsletter email subscriptions
export const emailSubscriptions = pgTable("email_subscriptions", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  email: text("email").notNull().unique(),
  source: text("source"), // e.g., 'footer', 'landing', etc.
  createdAt: timestamp("created_at").defaultNow(),
});

// Insert schemas (allow app-provided UUIDs; only paymentSettings keeps id omitted)
export const insertUserSchema = createInsertSchema(users).omit({
  createdAt: true,
});

export const insertCompanySchema = createInsertSchema(companies).omit({
  createdAt: true,
});

export const insertCategorySchema = createInsertSchema(categories).omit({
  createdAt: true,
});

export const insertProductSchema = createInsertSchema(products).omit({
  createdAt: true,
});

export const insertCartItemSchema = createInsertSchema(cartItems).omit({
  createdAt: true,
});

export const insertOrderSchema = createInsertSchema(orders).omit({
  createdAt: true,
});

export const insertOrderItemSchema = createInsertSchema(orderItems);

export const insertFavoriteSchema = createInsertSchema(favorites).omit({
  createdAt: true,
});

export const insertTryOnSessionSchema = createInsertSchema(tryOnSessions).omit({
  createdAt: true,
});

export const insertOutfitCollectionSchema = createInsertSchema(
  outfitCollections
).omit({ createdAt: true, updatedAt: true });

export const insertOutfitItemSchema = createInsertSchema(outfitItems).omit({
  createdAt: true,
});

export const insertSessionLikeSchema = createInsertSchema(sessionLikes).omit({
  createdAt: true,
});

export const insertSessionViewSchema = createInsertSchema(sessionViews).omit({
  viewedAt: true,
});

export const insertSessionCommentSchema = createInsertSchema(
  sessionComments
).omit({
  createdAt: true,
  updatedAt: true,
});

export const insertSessionSaveSchema = createInsertSchema(sessionSaves).omit({
  createdAt: true,
});

export const insertUserStyleProfileSchema = createInsertSchema(
  userStyleProfiles
).omit({ createdAt: true, updatedAt: true });

export const insertReviewSchema = createInsertSchema(reviews).omit({
  createdAt: true,
});

export const insertSubscriptionPlanSchema = createInsertSchema(
  subscriptionPlans
).omit({ createdAt: true });

export const insertSubscriptionSchema = createInsertSchema(subscriptions).omit({
  createdAt: true,
});

export const insertSubscriptionPaymentSchema = createInsertSchema(
  subscriptionPayments
).omit({ createdAt: true });
export const insertAgentCommissionSchema = createInsertSchema(
  agentCommissions
).omit({ createdAt: true });

export const insertNotificationSchema = createInsertSchema(notifications).omit({
  createdAt: true,
});

export const insertUserWalletSchema = createInsertSchema(userWallets).omit({
  createdAt: true,
  updatedAt: true,
});

export const insertWalletPaymentSchema = createInsertSchema(
  walletPayments
).omit({ createdAt: true });

export const insertPaymentSettingSchema = createInsertSchema(
  paymentSettings
).omit({ id: true, createdAt: true });
export const insertEmailSubscriptionSchema = createInsertSchema(
  emailSubscriptions
).omit({ createdAt: true });

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Company = typeof companies.$inferSelect;
export type InsertCompany = z.infer<typeof insertCompanySchema>;

export type Category = typeof categories.$inferSelect;
export type InsertCategory = z.infer<typeof insertCategorySchema>;

export type Product = typeof products.$inferSelect;
export type InsertProduct = z.infer<typeof insertProductSchema>;

export type CartItem = typeof cartItems.$inferSelect;
export type InsertCartItem = z.infer<typeof insertCartItemSchema>;

export type Order = typeof orders.$inferSelect;
export type InsertOrder = z.infer<typeof insertOrderSchema>;

export type OrderItem = typeof orderItems.$inferSelect;
export type InsertOrderItem = z.infer<typeof insertOrderItemSchema>;

export type Favorite = typeof favorites.$inferSelect;
export type InsertFavorite = z.infer<typeof insertFavoriteSchema>;

export type TryOnSession = typeof tryOnSessions.$inferSelect;
export type InsertTryOnSession = z.infer<typeof insertTryOnSessionSchema>;

export type OutfitCollection = typeof outfitCollections.$inferSelect;
export type InsertOutfitCollection = z.infer<
  typeof insertOutfitCollectionSchema
>;

export type OutfitItem = typeof outfitItems.$inferSelect;
export type InsertOutfitItem = z.infer<typeof insertOutfitItemSchema>;

export type SessionLike = typeof sessionLikes.$inferSelect;
export type InsertSessionLike = z.infer<typeof insertSessionLikeSchema>;

export type SessionView = typeof sessionViews.$inferSelect;
export type InsertSessionView = z.infer<typeof insertSessionViewSchema>;

export type SessionComment = typeof sessionComments.$inferSelect;
export type InsertSessionComment = z.infer<typeof insertSessionCommentSchema>;

export type SessionSave = typeof sessionSaves.$inferSelect;
export type InsertSessionSave = z.infer<typeof insertSessionSaveSchema>;

export type UserStyleProfile = typeof userStyleProfiles.$inferSelect;
export type InsertUserStyleProfile = z.infer<
  typeof insertUserStyleProfileSchema
>;

export type Review = typeof reviews.$inferSelect;
export type InsertReview = z.infer<typeof insertReviewSchema>;

export type SubscriptionPlan = typeof subscriptionPlans.$inferSelect;
export type InsertSubscriptionPlan = z.infer<
  typeof insertSubscriptionPlanSchema
>;

export type Subscription = typeof subscriptions.$inferSelect;
export type InsertSubscription = z.infer<typeof insertSubscriptionSchema>;

export type SubscriptionPayment = typeof subscriptionPayments.$inferSelect;
export type InsertSubscriptionPayment = z.infer<
  typeof insertSubscriptionPaymentSchema
>;

export type AgentCommission = typeof agentCommissions.$inferSelect;
export type InsertAgentCommission = z.infer<typeof insertAgentCommissionSchema>;

export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = z.infer<typeof insertNotificationSchema>;

export type UserWallet = typeof userWallets.$inferSelect;
export type InsertUserWallet = z.infer<typeof insertUserWalletSchema>;

export type WalletPayment = typeof walletPayments.$inferSelect;
export type InsertWalletPayment = z.infer<typeof insertWalletPaymentSchema>;

export type PaymentSetting = typeof paymentSettings.$inferSelect;
export type InsertPaymentSetting = z.infer<typeof insertPaymentSettingSchema>;
export type EmailSubscription = typeof emailSubscriptions.$inferSelect;
export type InsertEmailSubscription = z.infer<
  typeof insertEmailSubscriptionSchema
>;
