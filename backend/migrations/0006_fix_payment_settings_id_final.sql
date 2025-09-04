-- Create a new table with the correct schema
CREATE TABLE payment_settings_new (
    id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    amount_in_rwf INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Copy data from the old table to the new one
INSERT INTO payment_settings_new (name, description, amount_in_rwf, created_at, updated_at)
SELECT name, description, amount_in_rwf, created_at, updated_at
FROM payment_settings;

-- Drop the old table
DROP TABLE payment_settings;

-- Rename the new table to the original name
ALTER TABLE payment_settings_new RENAME TO payment_settings;

-- Recreate the trigger for updated_at
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Recreate the trigger
CREATE TRIGGER update_payment_settings_modtime
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
