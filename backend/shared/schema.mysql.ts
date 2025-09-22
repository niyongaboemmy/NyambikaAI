import {
  mysqlTable as table,
  varchar,
  text,
  int,
  decimal,
  timestamp,
  boolean,
  json,
} from "drizzle-orm/mysql-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Note: MySQL uses UUID() for default id generation

export const users = table("users", {
  id: varchar("id", { length: 36 }).primaryKey(),
  username: text("username").notNull().unique(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  fullName: text("full_name"),
  fullNameRw: text("full_name_rw"),
  phone: text("phone"),
  location: text("location"),
  role: text("role").notNull().default("customer"),
  businessName: text("business_name"),
  businessLicense: text("business_license"),
  isVerified: boolean("is_verified").default(false),
  measurements: text("measurements"),
  profileImage: text("profile_image"),
  // Agent terms & conditions acceptance
  termsAccepted: boolean("terms_accepted").default(false),
  termsAcceptedAt: timestamp("terms_accepted_at"),
  // Referral network fields (for agents)
  referralCode: text("referral_code"),
  referredBy: varchar("referred_by", { length: 36 }),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

export const companies = table("companies", {
  id: varchar("id", { length: 36 }).primaryKey(),
  producerId: varchar("producer_id", { length: 36 }).notNull().references(() => users.id),
  tin: text("tin"),
  name: text("name").notNull(),
  email: text("email").notNull(),
  phone: text("phone").notNull(),
  location: text("location").notNull(),
  logoUrl: text("logo_url"),
  websiteUrl: text("website_url"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const categories = table("categories", {
  id: varchar("id", { length: 36 }).primaryKey(),
  name: text("name").notNull(),
  nameRw: text("name_rw").notNull(),
  description: text("description"),
  imageUrl: text("image_url"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const products = table("products", {
  id: varchar("id", { length: 36 }).primaryKey(),
  name: text("name").notNull(),
  nameRw: text("name_rw").notNull(),
  description: text("description").notNull(),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  categoryId: varchar("category_id", { length: 36 }).references(() => categories.id),
  producerId: varchar("producer_id", { length: 36 }).references(() => users.id),
  imageUrl: text("image_url").notNull(),
  additionalImages: json("additional_images"),
  sizes: json("sizes"),
  colors: json("colors"),
  stockQuantity: int("stock_quantity").default(0),
  inStock: boolean("in_stock").default(true),
  isApproved: boolean("is_approved").default(false),
  displayOrder: int("display_order"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const cartItems = table("cart_items", {
  id: varchar("id", { length: 36 }).primaryKey(),
  userId: varchar("user_id", { length: 36 }).references(() => users.id),
  productId: varchar("product_id", { length: 36 }).references(() => products.id),
  quantity: int("quantity").default(1),
  size: text("size"),
  color: text("color"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const orders = table("orders", {
  id: varchar("id", { length: 36 }).primaryKey(),
  customerId: varchar("customer_id", { length: 36 }).references(() => users.id),
  producerId: varchar("producer_id", { length: 36 }).references(() => users.id),
  total: decimal("total", { precision: 10, scale: 2 }).notNull(),
  status: text("status").notNull().default("pending"),
  validationStatus: text("validation_status").default("pending"),
  paymentMethod: text("payment_method"),
  shippingAddress: text("shipping_address"),
  createdAt: timestamp("created_at").defaultNow(),
  paymentStatus: text("payment_status").default("pending"),
  trackingNumber: text("tracking_number"),
  notes: text("notes"),
  sizeEvidenceImages: json("size_evidence_images"),
  isConfirmedByCustomer: boolean("is_confirmed_by_customer").default(false),
  customerConfirmationDate: timestamp("customer_confirmation_date"),
});

export const orderItems = table("order_items", {
  id: varchar("id", { length: 36 }).primaryKey(),
  orderId: varchar("order_id", { length: 36 }).references(() => orders.id),
  productId: varchar("product_id", { length: 36 }).references(() => products.id),
  quantity: int("quantity").default(1),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  size: text("size"),
  color: text("color"),
});

export const favorites = table("favorites", {
  id: varchar("id", { length: 36 }).primaryKey(),
  userId: varchar("user_id", { length: 36 }).references(() => users.id),
  productId: varchar("product_id", { length: 36 }).references(() => products.id),
  createdAt: timestamp("created_at").defaultNow(),
});

export const tryOnSessions = table("try_on_sessions", {
  id: varchar("id", { length: 36 }).primaryKey(),
  userId: varchar("user_id", { length: 36 }).references(() => users.id),
  customerImageUrl: text("customer_image_url").notNull(),
  productId: varchar("product_id", { length: 36 }).references(() => products.id),
  tryOnImageUrl: text("try_on_image_url"),
  fitRecommendation: text("fit_recommendation"),
  status: text("status").notNull().default("processing"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const reviews = table("reviews", {
  id: varchar("id", { length: 36 }).primaryKey(),
  userId: varchar("user_id", { length: 36 }).references(() => users.id),
  productId: varchar("product_id", { length: 36 }).references(() => products.id),
  orderId: varchar("order_id", { length: 36 }).references(() => orders.id),
  rating: int("rating").notNull(),
  comment: text("comment"),
  images: json("images"),
  isVerified: boolean("is_verified").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const subscriptionPlans = table("subscription_plans", {
  id: varchar("id", { length: 36 }).primaryKey(),
  name: text("name").notNull(),
  nameRw: text("name_rw").notNull(),
  description: text("description").notNull(),
  descriptionRw: text("description_rw").notNull(),
  monthlyPrice: decimal("monthly_price", { precision: 10, scale: 2 }).notNull(),
  annualPrice: decimal("annual_price", { precision: 10, scale: 2 }).notNull(),
  features: json("features").notNull(),
  featuresRw: json("features_rw").notNull(),
  maxProducts: int("max_products").default(0),
  maxOrders: int("max_orders").default(0),
  hasAnalytics: boolean("has_analytics").default(false),
  hasPrioritySupport: boolean("has_priority_support").default(false),
  hasCustomBranding: boolean("has_custom_branding").default(false),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

export const subscriptions = table("subscriptions", {
  id: varchar("id", { length: 36 }).primaryKey(),
  userId: varchar("user_id", { length: 36 }).references(() => users.id).notNull(),
  planId: varchar("plan_id", { length: 36 }).references(() => subscriptionPlans.id).notNull(),
  agentId: varchar("agent_id", { length: 36 }).references(() => users.id),
  status: text("status").notNull().default("active"),
  billingCycle: text("billing_cycle").notNull(),
  startDate: timestamp("start_date").defaultNow(),
  endDate: timestamp("end_date").notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  paymentMethod: text("payment_method"),
  paymentReference: text("payment_reference"),
  autoRenew: boolean("auto_renew").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const subscriptionPayments = table("subscription_payments", {
  id: varchar("id", { length: 36 }).primaryKey(),
  subscriptionId: varchar("subscription_id", { length: 36 }).references(() => subscriptions.id).notNull(),
  agentId: varchar("agent_id", { length: 36 }).references(() => users.id),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  agentCommission: decimal("agent_commission", { precision: 10, scale: 2 }),
  paymentMethod: text("payment_method").notNull(),
  paymentReference: text("payment_reference"),
  status: text("status").notNull().default("pending"),
  transactionId: text("transaction_id"),
  // Agent payout confirmation fields
  agentPayoutStatus: text("agent_payout_status").default("pending"),
  agentPayoutDate: timestamp("agent_payout_date"),
  agentPayoutReference: text("agent_payout_reference"),
  agentPayoutNotes: text("agent_payout_notes"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Agent referral commissions (level 1 and 2 passive earnings)
export const agentCommissions = table("agent_commissions", {
  id: varchar("id", { length: 36 }).primaryKey(),
  agentId: varchar("agent_id", { length: 36 }).notNull().references(() => users.id),
  sourceAgentId: varchar("source_agent_id", { length: 36 }).notNull().references(() => users.id),
  subscriptionPaymentId: varchar("subscription_payment_id", { length: 36 }).notNull().references(() => subscriptionPayments.id),
  level: int("level").notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  status: text("status").notNull().default("pending"), // pending, approved, paid, cancelled
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const notifications = table("notifications", {
  id: varchar("id", { length: 36 }).primaryKey(),
  userId: varchar("user_id", { length: 36 }).references(() => users.id).notNull(),
  title: text("title").notNull(),
  message: text("message").notNull(),
  isRead: boolean("is_read").default(false),
  type: text("type").notNull(),
  referenceId: text("reference_id"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const userWallets = table("user_wallets", {
  id: varchar("id", { length: 36 }).primaryKey(),
  userId: varchar("user_id", { length: 36 }).notNull().unique().references(() => users.id),
  balance: decimal("balance", { precision: 12, scale: 2 }).notNull().default("0"),
  status: text("status").notNull().default("active"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const walletPayments = table("wallet_payments", {
  id: varchar("id", { length: 36 }).primaryKey(),
  walletId: varchar("wallet_id", { length: 36 }).notNull().references(() => userWallets.id),
  userId: varchar("user_id", { length: 36 }).notNull().references(() => users.id),
  type: text("type").notNull().default("topup"),
  amount: decimal("amount", { precision: 12, scale: 2 }).notNull(),
  currency: text("currency").notNull().default("RWF"),
  method: text("method").notNull().default("mobile_money"),
  provider: text("provider").default("mtn"),
  phone: text("phone"),
  status: text("status").notNull().default("pending"),
  externalReference: text("external_reference"),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const paymentSettings = table("payment_settings", {
  id: int("id").primaryKey().autoincrement(),
  name: text("name").notNull().unique(),
  description: text("description"),
  amountInRwf: int("amount_in_rwf").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Newsletter email subscriptions
export const emailSubscriptions = table("email_subscriptions", {
  id: varchar("id", { length: 36 }).primaryKey(),
  email: text("email").notNull().unique(),
  source: text("source"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({ createdAt: true });
export const insertCompanySchema = createInsertSchema(companies).omit({ createdAt: true });
export const insertCategorySchema = createInsertSchema(categories).omit({ createdAt: true });
export const insertProductSchema = createInsertSchema(products).omit({ createdAt: true });
export const insertCartItemSchema = createInsertSchema(cartItems).omit({ createdAt: true });
export const insertOrderSchema = createInsertSchema(orders).omit({ createdAt: true });
export const insertOrderItemSchema = createInsertSchema(orderItems);
export const insertFavoriteSchema = createInsertSchema(favorites).omit({ createdAt: true });
export const insertTryOnSessionSchema = createInsertSchema(tryOnSessions).omit({ createdAt: true });
export const insertReviewSchema = createInsertSchema(reviews).omit({ createdAt: true });
export const insertSubscriptionPlanSchema = createInsertSchema(subscriptionPlans).omit({ createdAt: true });
export const insertSubscriptionSchema = createInsertSchema(subscriptions).omit({ createdAt: true });
export const insertSubscriptionPaymentSchema = createInsertSchema(subscriptionPayments).omit({ createdAt: true });
export const insertAgentCommissionSchema = createInsertSchema(agentCommissions).omit({ createdAt: true });
export const insertNotificationSchema = createInsertSchema(notifications).omit({ createdAt: true });
export const insertUserWalletSchema = createInsertSchema(userWallets).omit({ createdAt: true, updatedAt: true });
export const insertWalletPaymentSchema = createInsertSchema(walletPayments).omit({ createdAt: true });
export const insertPaymentSettingSchema = createInsertSchema(paymentSettings).omit({ id: true, createdAt: true });
export const insertEmailSubscriptionSchema = createInsertSchema(emailSubscriptions).omit({ createdAt: true });

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
export type Review = typeof reviews.$inferSelect;
export type InsertReview = z.infer<typeof insertReviewSchema>;
export type SubscriptionPlan = typeof subscriptionPlans.$inferSelect;
export type InsertSubscriptionPlan = z.infer<typeof insertSubscriptionPlanSchema>;
export type Subscription = typeof subscriptions.$inferSelect;
export type InsertSubscription = z.infer<typeof insertSubscriptionSchema>;
export type SubscriptionPayment = typeof subscriptionPayments.$inferSelect;
export type InsertSubscriptionPayment = z.infer<typeof insertSubscriptionPaymentSchema>;
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
export type InsertEmailSubscription = z.infer<typeof insertEmailSubscriptionSchema>;
