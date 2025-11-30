-- Alter subscription dates from timestamp to datetime for MySQL compatibility
-- This prevents timezone conversion issues with timestamp columns

ALTER TABLE subscriptions
MODIFY COLUMN start_date DATETIME NULL,
MODIFY COLUMN end_date DATETIME NOT NULL;