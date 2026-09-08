#!/bin/bash
# Seed script - runs inside the backend container
# Usage: docker exec catalog_backend sh seed.sh
#
# Can also be run locally with:
#   psql $DATABASE_URL -f seed-data.sql

set -e

DATABASE_URL="${DATABASE_URL:-postgresql://devuser:dev20141201@postgres:5432/catalogdb}"

echo "Seeding database..."

psql "$DATABASE_URL" <<'EOF'
BEGIN;

-- Limpiar datos existentes
TRUNCATE TABLE
  "RefreshToken",
  "SaleItem",
  "Sale",
  "StockMovement",
  "Stock",
  "WhatsappOrder",
  "Variant",
  "Product",
  "User",
  "Branch",
  "Tenant"
CASCADE;

-- Tenant
INSERT INTO "Tenant" (id, name) VALUES
  ('tenant-demo', 'Demo Tenant');

-- Sucursales
INSERT INTO "Branch" (id, name, type, address, hours, "tenantId") VALUES
  ('branch-central', 'Sucursal Central', 'physical', 'Av. Rivadavia 1234, CABA', 'Lun-Vie 9:00-18:00', 'tenant-demo'),
  ('branch-web', 'Tienda Online', 'virtual', null, null, 'tenant-demo');

-- Usuarios (password: 123456)
INSERT INTO "User" (id, name, email, password, role, "branchId", "tenantId", "updatedAt") VALUES
  ('user-admin', 'Admin Demo', 'admin@demo.com', '$2b$10$4EugrtvDPexe0g4OSYo77exqwxrQU.mLgSWQSQVmo3j4j6SZvkpZC', 'SUPER_ADMIN', null, 'tenant-demo', NOW()),
  ('user-manager', 'Gerente Central', 'manager@demo.com', '$2b$10$4EugrtvDPexe0g4OSYo77exqwxrQU.mLgSWQSQVmo3j4j6SZvkpZC', 'BRANCH_MANAGER', 'branch-central', 'tenant-demo', NOW()),
  ('user-seller', 'Vendedor Tienda', 'seller@demo.com', '$2b$10$4EugrtvDPexe0g4OSYo77exqwxrQU.mLgSWQSQVmo3j4j6SZvkpZC', 'SELLER', 'branch-central', 'tenant-demo', NOW());

-- Productos
INSERT INTO "Product" (id, name, "imageUrl", batch, "expirationDate", "baseAttributes", active, "tenantId", "updatedAt") VALUES
  ('prod-1', 'Remera Oversize', null, 'LOTE-2025-01', null, '{"color": "negro", "material": "algodon"}', true, 'tenant-demo', NOW()),
  ('prod-2', 'Pantalón Jean Slim', null, 'LOTE-2025-02', null, '{"color": "azul oscuro", "talle": "42"}', true, 'tenant-demo', NOW()),
  ('prod-3', 'Zapatillas Urban Run', null, 'LOTE-2025-03', null, '{"color": "blanco", "talle": "41"}', true, 'tenant-demo', NOW());

-- Variantes
INSERT INTO "Variant" (id, "productId", sku, price, cost, attributes, "tenantId", "updatedAt") VALUES
  ('var-1', 'prod-1', 'REM-NEG-S', 8500, 5000, '{"talle": "S"}', 'tenant-demo', NOW()),
  ('var-2', 'prod-1', 'REM-NEG-M', 8500, 5000, '{"talle": "M"}', 'tenant-demo', NOW()),
  ('var-3', 'prod-1', 'REM-NEG-L', 9000, 5200, '{"talle": "L"}', 'tenant-demo', NOW()),
  ('var-4', 'prod-2', 'JEAN-SLIM-38', 18000, 11000, '{"talle": "38"}', 'tenant-demo', NOW()),
  ('var-5', 'prod-2', 'JEAN-SLIM-42', 18500, 11500, '{"talle": "42"}', 'tenant-demo', NOW()),
  ('var-6', 'prod-3', 'ZAP-URBAN-40', 35000, 25000, '{"talle": "40"}', 'tenant-demo', NOW()),
  ('var-7', 'prod-3', 'ZAP-URBAN-41', 35000, 25000, '{"talle": "41"}', 'tenant-demo', NOW()),
  ('var-8', 'prod-3', 'ZAP-URBAN-42', 36000, 26000, '{"talle": "42"}', 'tenant-demo', NOW());

-- Stock
INSERT INTO "Stock" (id, "variantId", "branchId", quantity, "tenantId") VALUES
  ('stock-1', 'var-1', 'branch-central', 25, 'tenant-demo'),
  ('stock-2', 'var-2', 'branch-central', 30, 'tenant-demo'),
  ('stock-3', 'var-3', 'branch-central', 20, 'tenant-demo'),
  ('stock-4', 'var-4', 'branch-central', 15, 'tenant-demo'),
  ('stock-5', 'var-5', 'branch-central', 12, 'tenant-demo'),
  ('stock-6', 'var-6', 'branch-central', 8, 'tenant-demo'),
  ('stock-7', 'var-7', 'branch-central', 10, 'tenant-demo'),
  ('stock-8', 'var-8', 'branch-central', 5, 'tenant-demo'),
  ('stock-9', 'var-1', 'branch-web', 100, 'tenant-demo'),
  ('stock-10', 'var-2', 'branch-web', 100, 'tenant-demo'),
  ('stock-11', 'var-3', 'branch-web', 80, 'tenant-demo'),
  ('stock-12', 'var-4', 'branch-web', 50, 'tenant-demo'),
  ('stock-13', 'var-5', 'branch-web', 40, 'tenant-demo'),
  ('stock-14', 'var-6', 'branch-web', 20, 'tenant-demo'),
  ('stock-15', 'var-7', 'branch-web', 25, 'tenant-demo'),
  ('stock-16', 'var-8', 'branch-web', 15, 'tenant-demo');

-- Stock Movements
INSERT INTO "StockMovement" (id, "variantId", "fromBranchId", "toBranchId", quantity, type, "userId", "tenantId") VALUES
  ('mov-1', 'var-1', null, 'branch-central', 25, 'ADJUST', 'user-admin', 'tenant-demo'),
  ('mov-2', 'var-2', null, 'branch-central', 30, 'ADJUST', 'user-admin', 'tenant-demo'),
  ('mov-3', 'var-3', null, 'branch-central', 20, 'ADJUST', 'user-admin', 'tenant-demo'),
  ('mov-4', 'var-4', null, 'branch-central', 15, 'ADJUST', 'user-admin', 'tenant-demo'),
  ('mov-5', 'var-5', null, 'branch-central', 12, 'ADJUST', 'user-admin', 'tenant-demo'),
  ('mov-6', 'var-6', null, 'branch-central', 8, 'ADJUST', 'user-admin', 'tenant-demo'),
  ('mov-7', 'var-7', null, 'branch-central', 10, 'ADJUST', 'user-admin', 'tenant-demo'),
  ('mov-8', 'var-8', null, 'branch-central', 5, 'ADJUST', 'user-admin', 'tenant-demo'),
  ('mov-9', 'var-1', null, 'branch-web', 100, 'ADJUST', 'user-admin', 'tenant-demo'),
  ('mov-10', 'var-2', null, 'branch-web', 100, 'ADJUST', 'user-admin', 'tenant-demo'),
  ('mov-11', 'var-3', null, 'branch-web', 80, 'ADJUST', 'user-admin', 'tenant-demo'),
  ('mov-12', 'var-4', null, 'branch-web', 50, 'ADJUST', 'user-admin', 'tenant-demo'),
  ('mov-13', 'var-5', null, 'branch-web', 40, 'ADJUST', 'user-admin', 'tenant-demo'),
  ('mov-14', 'var-6', null, 'branch-web', 20, 'ADJUST', 'user-admin', 'tenant-demo'),
  ('mov-15', 'var-7', null, 'branch-web', 25, 'ADJUST', 'user-admin', 'tenant-demo'),
  ('mov-16', 'var-8', null, 'branch-web', 15, 'ADJUST', 'user-admin', 'tenant-demo');

-- Ventas
INSERT INTO "Sale" (id, "branchId", "userId", total, "tenantId", "createdAt") VALUES
  ('sale-1', 'branch-central', 'user-seller', 23500, 'tenant-demo', NOW() - INTERVAL '5 days'),
  ('sale-2', 'branch-central', 'user-seller', 8500, 'tenant-demo', NOW() - INTERVAL '3 days'),
  ('sale-3', 'branch-central', 'user-seller', 51500, 'tenant-demo', NOW() - INTERVAL '1 day');

INSERT INTO "SaleItem" (id, "saleId", "variantId", quantity, price, "tenantId") VALUES
  ('item-1', 'sale-1', 'var-1', 1, 8500, 'tenant-demo'),
  ('item-2', 'sale-1', 'var-4', 1, 15000, 'tenant-demo'),
  ('item-3', 'sale-2', 'var-2', 1, 8500, 'tenant-demo'),
  ('item-4', 'sale-3', 'var-6', 1, 35000, 'tenant-demo'),
  ('item-5', 'sale-3', 'var-3', 1, 9000, 'tenant-demo'),
  ('item-6', 'sale-3', 'var-5', 1, 7500, 'tenant-demo');

-- WhatsApp Orders
INSERT INTO "WhatsappOrder" (id, "customerName", "customerPhone", message, status, total, "tenantId") VALUES
  ('wa-1', 'Juan Pérez', '+5491112345678', 'Hola! Quiero comprar 2 Remeras Talle M y 1 Jean Talle 38. ¿Tienen stock?', 'pending', 23500, 'tenant-demo'),
  ('wa-2', 'María García', '+5491165432100', 'Buenas tardes. Necesito 1 par de Zapatillas Urban talle 41. ¿Cuál es el precio?', 'contacted', 35000, 'tenant-demo');

-- Refresh Tokens
INSERT INTO "RefreshToken" (id, token, "userId", "expiresAt", "tenantId") VALUES
  ('rt-1', 'mock-refresh-token', 'user-admin', NOW() + INTERVAL '7 days', 'tenant-demo');

COMMIT;
EOF

echo "Seed completed successfully"
