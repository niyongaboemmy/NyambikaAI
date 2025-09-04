-- Create payment_settings table with auto-incrementing integer ID
CREATE TABLE IF NOT EXISTS payment_settings (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    amount_in_rwf INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create or replace the update_modified_column function
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create the trigger for updated_at
CREATE OR REPLACE TRIGGER update_payment_settings_modtime
BEFORE UPDATE ON payment_settings
FOR EACH ROW
EXECUTE FUNCTION update_modified_column();

-- Insert default payment settings if they don't exist
INSERT INTO payment_settings (name, description, amount_in_rwf)
SELECT 'try_on_fee', 'Fee for using the AI Try-On feature', 500
WHERE NOT EXISTS (SELECT 1 FROM payment_settings WHERE name = 'try_on_fee');

INSERT INTO payment_settings (name, description, amount_in_rwf)
SELECT 'product_boost', 'Boost product visibility to first page', 100
WHERE NOT EXISTS (SELECT 1 FROM payment_settings WHERE name = 'product_boost');

INSERT INTO payment_settings (name, description, amount_in_rwf)
SELECT 'product_ads', 'Ads on first page per product', 5000
WHERE NOT EXISTS (SELECT 1 FROM payment_settings WHERE name = 'product_ads');

INSERT INTO payment_settings (name, description, amount_in_rwf)
SELECT 'company_boost', 'Boost company visibility to first page', 10000
WHERE NOT EXISTS (SELECT 1 FROM payment_settings WHERE name = 'company_boost');
