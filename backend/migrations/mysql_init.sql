-- Nyambika MySQL schema DDL
-- Requires MySQL 8.0.13+ (for expression defaults). If UUID() default is not allowed on your server,
-- remove DEFAULT (UUID()) and let the application supply ids.

SET NAMES utf8mb4;
SET time_zone = '+00:00';

CREATE TABLE IF NOT EXISTS users (
  id varchar(36) NOT NULL,
  username text NOT NULL,
  email text NOT NULL,
  password text NOT NULL,
  full_name text NULL,
  full_name_rw text NULL,
  phone text NULL,
  location text NULL,
  role varchar(50) NOT NULL DEFAULT 'customer',
  business_name text NULL,
  business_license text NULL,
  is_verified boolean DEFAULT FALSE,
  measurements text NULL,
  profile_image text NULL,
  created_at timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY ux_users_username (username(191)),
  UNIQUE KEY ux_users_email (email(191))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS companies (
  id varchar(36) NOT NULL,
  producer_id varchar(36) NOT NULL,
  tin text NULL,
  name text NOT NULL,
  email text NOT NULL,
  phone text NOT NULL,
  location text NOT NULL,
  logo_url text NULL,
  website_url text NULL,
  created_at timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY ux_companies_producer_id (producer_id),
  CONSTRAINT fk_companies_producer FOREIGN KEY (producer_id) REFERENCES users(id) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS categories (
  id varchar(36) NOT NULL,
  name text NOT NULL,
  name_rw text NOT NULL,
  description text NULL,
  image_url text NULL,
  created_at timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS products (
  id varchar(36) NOT NULL,
  name text NOT NULL,
  name_rw text NOT NULL,
  description text NOT NULL,
  price decimal(10,2) NOT NULL,
  category_id varchar(36) NULL,
  producer_id varchar(36) NULL,
  image_url text NOT NULL,
  additional_images json NULL,
  sizes json NULL,
  colors json NULL,
  stock_quantity int DEFAULT 0,
  in_stock boolean DEFAULT TRUE,
  is_approved boolean DEFAULT FALSE,
  display_order int NULL,
  created_at timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY ix_products_category_id (category_id),
  KEY ix_products_producer_id (producer_id),
  CONSTRAINT fk_products_category FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT fk_products_producer FOREIGN KEY (producer_id) REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS cart_items (
  id varchar(36) NOT NULL,
  user_id varchar(36) NULL,
  product_id varchar(36) NULL,
  quantity int DEFAULT 1,
  size text NULL,
  color text NULL,
  created_at timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY ix_cart_items_user_id (user_id),
  KEY ix_cart_items_product_id (product_id),
  CONSTRAINT fk_cart_items_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT fk_cart_items_product FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS orders (
  id varchar(36) NOT NULL,
  customer_id varchar(36) NULL,
  producer_id varchar(36) NULL,
  total decimal(10,2) NOT NULL,
  status varchar(32) NOT NULL DEFAULT 'pending',
  validation_status varchar(32) DEFAULT 'pending',
  payment_method text NULL,
  shipping_address text NULL,
  created_at timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  payment_status varchar(32) DEFAULT 'pending',
  tracking_number text NULL,
  notes text NULL,
  size_evidence_images json NULL,
  is_confirmed_by_customer boolean DEFAULT FALSE,
  customer_confirmation_date timestamp NULL,
  PRIMARY KEY (id),
  KEY ix_orders_customer_id (customer_id),
  KEY ix_orders_producer_id (producer_id),
  CONSTRAINT fk_orders_customer FOREIGN KEY (customer_id) REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT fk_orders_producer FOREIGN KEY (producer_id) REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS order_items (
  id varchar(36) NOT NULL,
  order_id varchar(36) NULL,
  product_id varchar(36) NULL,
  quantity int DEFAULT 1,
  price decimal(10,2) NOT NULL,
  size text NULL,
  color text NULL,
  PRIMARY KEY (id),
  KEY ix_order_items_order_id (order_id),
  KEY ix_order_items_product_id (product_id),
  CONSTRAINT fk_order_items_order FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT fk_order_items_product FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS favorites (
  id varchar(36) NOT NULL,
  user_id varchar(36) NULL,
  product_id varchar(36) NULL,
  created_at timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY ix_favorites_user_id (user_id),
  KEY ix_favorites_product_id (product_id),
  CONSTRAINT fk_favorites_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT fk_favorites_product FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS try_on_sessions (
  id varchar(36) NOT NULL,
  user_id varchar(36) NULL,
  customer_image_url text NOT NULL,
  product_id varchar(36) NULL,
  try_on_image_url text NULL,
  fit_recommendation text NULL,
  status varchar(32) NOT NULL DEFAULT 'processing',
  created_at timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY ix_try_on_sessions_user_id (user_id),
  KEY ix_try_on_sessions_product_id (product_id),
  CONSTRAINT fk_try_on_sessions_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT fk_try_on_sessions_product FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS reviews (
  id varchar(36) NOT NULL,
  user_id varchar(36) NULL,
  product_id varchar(36) NULL,
  order_id varchar(36) NULL,
  rating int NOT NULL,
  comment text NULL,
  images json NULL,
  is_verified boolean DEFAULT FALSE,
  created_at timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY ix_reviews_user_id (user_id),
  KEY ix_reviews_product_id (product_id),
  KEY ix_reviews_order_id (order_id),
  CONSTRAINT fk_reviews_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT fk_reviews_product FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT fk_reviews_order FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS subscription_plans (
  id varchar(36) NOT NULL,
  name text NOT NULL,
  name_rw text NOT NULL,
  description text NOT NULL,
  description_rw text NOT NULL,
  monthly_price decimal(10,2) NOT NULL,
  annual_price decimal(10,2) NOT NULL,
  features json NOT NULL,
  features_rw json NOT NULL,
  max_products int DEFAULT 0,
  max_orders int DEFAULT 0,
  has_analytics boolean DEFAULT FALSE,
  has_priority_support boolean DEFAULT FALSE,
  has_custom_branding boolean DEFAULT FALSE,
  is_active boolean DEFAULT TRUE,
  created_at timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS subscriptions (
  id varchar(36) NOT NULL,
  user_id varchar(36) NOT NULL,
  plan_id varchar(36) NOT NULL,
  agent_id varchar(36) NULL,
  status varchar(32) NOT NULL DEFAULT 'active',
  billing_cycle text NOT NULL,
  start_date timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  end_date datetime NULL,
  amount decimal(10,2) NOT NULL,
  payment_method text NULL,
  payment_reference text NULL,
  auto_renew boolean DEFAULT FALSE,
  created_at timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY ix_subscriptions_user_id (user_id),
  KEY ix_subscriptions_plan_id (plan_id),
  KEY ix_subscriptions_agent_id (agent_id),
  CONSTRAINT fk_subscriptions_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_subscriptions_plan FOREIGN KEY (plan_id) REFERENCES subscription_plans(id) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_subscriptions_agent FOREIGN KEY (agent_id) REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS subscription_payments (
  id varchar(36) NOT NULL,
  subscription_id varchar(36) NOT NULL,
  agent_id varchar(36) NULL,
  amount decimal(10,2) NOT NULL,
  agent_commission decimal(10,2) NULL,
  payment_method text NOT NULL,
  payment_reference text NULL,
  status varchar(32) NOT NULL DEFAULT 'pending',
  transaction_id text NULL,
  created_at timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY ix_subscription_payments_subscription_id (subscription_id),
  KEY ix_subscription_payments_agent_id (agent_id),
  CONSTRAINT fk_subscription_payments_subscription FOREIGN KEY (subscription_id) REFERENCES subscriptions(id) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_subscription_payments_agent FOREIGN KEY (agent_id) REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS notifications (
  id varchar(36) NOT NULL,
  user_id varchar(36) NOT NULL,
  title text NOT NULL,
  message text NOT NULL,
  is_read boolean DEFAULT FALSE,
  type varchar(32) NOT NULL,
  reference_id text NULL,
  created_at timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY ix_notifications_user_id (user_id),
  CONSTRAINT fk_notifications_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS user_wallets (
  id varchar(36) NOT NULL,
  user_id varchar(36) NOT NULL,
  balance decimal(12,2) NOT NULL DEFAULT 0,
  status varchar(32) NOT NULL DEFAULT 'active',
  created_at timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY ux_user_wallets_user_id (user_id),
  CONSTRAINT fk_user_wallets_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS wallet_payments (
  id varchar(36) NOT NULL,
  wallet_id varchar(36) NOT NULL,
  user_id varchar(36) NOT NULL,
  type varchar(24) NOT NULL DEFAULT 'topup',
  amount decimal(12,2) NOT NULL,
  currency varchar(8) NOT NULL DEFAULT 'RWF',
  method varchar(32) NOT NULL DEFAULT 'mobile_money',
  provider text NULL,
  phone text NULL,
  status varchar(32) NOT NULL DEFAULT 'pending',
  external_reference text NULL,
  description text NULL,
  created_at timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY ix_wallet_payments_wallet_id (wallet_id),
  KEY ix_wallet_payments_user_id (user_id),
  CONSTRAINT fk_wallet_payments_wallet FOREIGN KEY (wallet_id) REFERENCES user_wallets(id) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_wallet_payments_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS payment_settings (
  id int NOT NULL AUTO_INCREMENT,
  name text NOT NULL,
  description text NULL,
  amount_in_rwf int NOT NULL,
  created_at timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY ux_payment_settings_name (name(191))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Helpful indexes
CREATE INDEX idx_products_display_order ON products (display_order);
