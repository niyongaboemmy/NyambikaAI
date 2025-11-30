-- Add local image path fields to try_on_sessions table
ALTER TABLE try_on_sessions 
ADD COLUMN customer_image_local_path VARCHAR(500),
ADD COLUMN try_on_image_local_path VARCHAR(500);

-- Add indexes for better query performance (with prefix length for VARCHAR)
CREATE INDEX idx_customer_image_local_path ON try_on_sessions(customer_image_local_path(255));
CREATE INDEX idx_tryon_image_local_path ON try_on_sessions(try_on_image_local_path(255));
