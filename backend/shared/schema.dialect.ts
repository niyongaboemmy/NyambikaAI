// Dialect-aware re-exports with ESM named exports
// Supported dialects: 'postgres' (default) and 'mysql'

const dialect = (process.env.DB_DIALECT || 'postgres').toLowerCase();

import * as pgSchema from './schema';
import * as mysqlSchema from './schema.mysql';

const s: any = dialect === 'mysql' ? (mysqlSchema as any) : (pgSchema as any);

// Tables
export const users = s.users;
export const companies = s.companies;
export const categories = s.categories;
export const products = s.products;
export const cartItems = s.cartItems;
export const orders = s.orders;
export const orderItems = s.orderItems;
export const favorites = s.favorites;
export const tryOnSessions = s.tryOnSessions;
export const outfitCollections = s.outfitCollections;
export const outfitItems = s.outfitItems;
export const userStyleProfiles = s.userStyleProfiles;
export const reviews = s.reviews;
export const subscriptionPlans = s.subscriptionPlans;
export const subscriptions = s.subscriptions;
export const subscriptionPayments = s.subscriptionPayments;
export const agentCommissions = s.agentCommissions;
export const notifications = s.notifications;
export const userWallets = s.userWallets;
export const walletPayments = s.walletPayments;
export const paymentSettings = s.paymentSettings;
export const emailSubscriptions = s.emailSubscriptions;

// Insert schemas
export const insertUserSchema = s.insertUserSchema;
export const insertCompanySchema = s.insertCompanySchema;
export const insertCategorySchema = s.insertCategorySchema;
export const insertProductSchema = s.insertProductSchema;
export const insertCartItemSchema = s.insertCartItemSchema;
export const insertOrderSchema = s.insertOrderSchema;
export const insertOrderItemSchema = s.insertOrderItemSchema;
export const insertFavoriteSchema = s.insertFavoriteSchema;
export const insertTryOnSessionSchema = s.insertTryOnSessionSchema;
export const insertOutfitCollectionSchema = s.insertOutfitCollectionSchema;
export const insertOutfitItemSchema = s.insertOutfitItemSchema;
export const insertUserStyleProfileSchema = s.insertUserStyleProfileSchema;
export const insertReviewSchema = s.insertReviewSchema;
export const insertSubscriptionPlanSchema = s.insertSubscriptionPlanSchema;
export const insertSubscriptionSchema = s.insertSubscriptionSchema;
export const insertSubscriptionPaymentSchema = s.insertSubscriptionPaymentSchema;
export const insertAgentCommissionSchema = s.insertAgentCommissionSchema;
export const insertNotificationSchema = s.insertNotificationSchema;
export const insertUserWalletSchema = s.insertUserWalletSchema;
export const insertWalletPaymentSchema = s.insertWalletPaymentSchema;
export const insertPaymentSettingSchema = s.insertPaymentSettingSchema;
export const insertEmailSubscriptionSchema = s.insertEmailSubscriptionSchema;

// Types: re-export from Postgres schema for compile-time convenience
export type {
  User,
  InsertUser,
  Company,
  InsertCompany,
  Category,
  InsertCategory,
  Product,
  InsertProduct,
  CartItem,
  InsertCartItem,
  Order,
  InsertOrder,
  OrderItem,
  InsertOrderItem,
  Favorite,
  InsertFavorite,
  TryOnSession,
  InsertTryOnSession,
  OutfitCollection,
  InsertOutfitCollection,
  OutfitItem,
  InsertOutfitItem,
  UserStyleProfile,
  InsertUserStyleProfile,
  Review,
  InsertReview,
  SubscriptionPlan,
  InsertSubscriptionPlan,
  Subscription,
  InsertSubscription,
  SubscriptionPayment,
  InsertSubscriptionPayment,
  AgentCommission,
  InsertAgentCommission,
  Notification,
  InsertNotification,
  UserWallet,
  InsertUserWallet,
  WalletPayment,
  InsertWalletPayment,
  PaymentSetting,
  InsertPaymentSetting,
  EmailSubscription,
  InsertEmailSubscription,
} from './schema';
