-- Step 1: Create a temporary table to hold the existing data
CREATE TABLE IF NOT EXISTS temp_payment_settings AS TABLE payment_settings;

-- Step 2: Drop the original table and its dependencies
DROP TABLE IF EXISTS payment_settings CASCADE;

-- Step 3: Recreate the table with the correct ID type
CREATE TABLE payment_settings (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    amount_in_rwf INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 4: Insert the default payment settings if they don't exist
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

-- Step 5: Copy data back from the temporary table if it exists
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'temp_payment_settings') THEN
        -- Update existing records
        UPDATE payment_settings ps
        SET 
            description = tps.description,
            amount_in_rwf = tps.amount_in_rwf,
            created_at = tps.created_at,
            updated_at = tps.updated_at
        FROM temp_payment_settings tps
        WHERE ps.name = tps.name;
        
        -- Drop the temporary table
        DROP TABLE temp_payment_settings;
    END IF;
END $$;

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
