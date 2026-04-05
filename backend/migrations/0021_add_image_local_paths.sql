-- Add local image path fields to try_on_sessions table
ALTER TABLE try_on_sessions
ADD COLUMN IF NOT EXISTS customer_image_local_path VARCHAR(500),
ADD COLUMN IF NOT EXISTS try_on_image_local_path VARCHAR(500);

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_customer_image_local_path ON try_on_sessions(customer_image_local_path);
CREATE INDEX IF NOT EXISTS idx_tryon_image_local_path ON try_on_sessions(try_on_image_local_path);
