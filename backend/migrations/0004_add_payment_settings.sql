-- First, drop the table if it exists with the old schema
DROP TABLE IF EXISTS payment_settings CASCADE;

-- Create payment_settings table with auto-incrementing integer ID
CREATE TABLE payment_settings (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    amount_in_rwf INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default payment settings
INSERT INTO payment_settings (name, description, amount_in_rwf) VALUES 
    ('try_on_fee', 'Fee for using the AI Try-On feature', 500),
    ('product_boost', 'Boost product visibility to first page', 100),
    ('product_ads', 'Ads on first page per product', 5000),
    ('company_boost', 'Boost company visibility to first page', 10000)
ON CONFLICT (name) DO NOTHING;

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_payment_settings_modtime
BEFORE UPDATE ON payment_settings
FOR EACH ROW
EXECUTE FUNCTION update_modified_column();
