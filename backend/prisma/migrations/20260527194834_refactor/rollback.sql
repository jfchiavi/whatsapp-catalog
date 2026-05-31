-- Drop all triggers first
DROP TRIGGER IF EXISTS update_user_updated_at ON "User";
DROP TRIGGER IF EXISTS update_product_updated_at ON "Product";
DROP TRIGGER IF EXISTS update_variant_updated_at ON "Variant";
DROP TRIGGER IF EXISTS update_stock_updated_at ON "Stock";
DROP TRIGGER IF EXISTS update_sale_updated_at ON "Sale";
DROP TRIGGER IF EXISTS update_saleitem_updated_at ON "SaleItem";

-- Drop the trigger function
DROP FUNCTION IF EXISTS update_updated_at_column();

-- Drop all tables in reverse order (due to foreign key constraints)
DROP TABLE IF EXISTS "SaleItem";
DROP TABLE IF EXISTS "Sale";
DROP TABLE IF EXISTS "StockMovement";
DROP TABLE IF EXISTS "Stock";
DROP TABLE IF EXISTS "Variant";
DROP TABLE IF EXISTS "Product";
DROP TABLE IF EXISTS "Branch";
DROP TABLE IF EXISTS "RefreshToken";
DROP TABLE IF EXISTS "User";
DROP TABLE IF EXISTS "WhatsappOrder";
DROP TABLE IF EXISTS "Tenant";

-- Drop the enum type
DROP TYPE IF EXISTS "Role";