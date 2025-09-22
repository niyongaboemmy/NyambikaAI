-- 1) Extend users with referral fields
ALTER TABLE `users`
  ADD COLUMN `referral_code` TEXT NULL,
  ADD COLUMN `referred_by` VARCHAR(36) NULL,
  ADD COLUMN `is_active` BOOLEAN DEFAULT TRUE;

-- Unique index for referral_code (allow nulls)
CREATE UNIQUE INDEX `users_referral_code_unique` ON `users` (`referral_code`(191));

-- Index for referred_by
CREATE INDEX `idx_users_referred_by` ON `users` (`referred_by`);

-- Optional FK: keep simple to avoid circular migration issues; set null on delete
ALTER TABLE `users`
  ADD CONSTRAINT `users_referred_by_fk`
  FOREIGN KEY (`referred_by`) REFERENCES `users`(`id`) ON DELETE SET NULL;

-- 2) agent_commissions table
CREATE TABLE IF NOT EXISTS `agent_commissions` (
  `id` VARCHAR(36) PRIMARY KEY,
  `agent_id` VARCHAR(36) NOT NULL,
  `source_agent_id` VARCHAR(36) NOT NULL,
  `subscription_payment_id` VARCHAR(36) NOT NULL,
  `level` INT NOT NULL,
  `amount` DECIMAL(10,2) NOT NULL,
  `status` VARCHAR(50) NOT NULL DEFAULT 'pending',
  `notes` TEXT,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT `agent_commissions_agent_fk`
    FOREIGN KEY (`agent_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  CONSTRAINT `agent_commissions_source_fk`
    FOREIGN KEY (`source_agent_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  CONSTRAINT `agent_commissions_payment_fk`
    FOREIGN KEY (`subscription_payment_id`) REFERENCES `subscription_payments`(`id`) ON DELETE CASCADE
);

-- Indexes
CREATE INDEX `idx_agent_commissions_agent` ON `agent_commissions` (`agent_id`);
CREATE INDEX `idx_agent_commissions_source` ON `agent_commissions` (`source_agent_id`);
CREATE INDEX `idx_agent_commissions_payment` ON `agent_commissions` (`subscription_payment_id`);
CREATE INDEX `idx_agent_commissions_level` ON `agent_commissions` (`level`);
CREATE INDEX `idx_agent_commissions_status` ON `agent_commissions` (`status`);
