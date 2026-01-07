-- ===============================
-- LIMPIEZA (DEV ONLY)
-- ===============================
TRUNCATE TABLE
  "RefreshToken",
  "SaleItem",
  "Sale",
  "StockMovement",
  "Stock",
  "WhatsappOrder",
  "Product",
  "User",
  "Branch",
  "Tenant"
CASCADE;

-- ===============================
-- TENANTS
-- ===============================
INSERT INTO "Tenant" (id, name)
VALUES
  ('tenant-demo', 'Demo Store'),
  ('tenant-fashion', 'Fashion Corp');

-- ===============================
-- SUCURSALES
-- ===============================
INSERT INTO "Branch" (id, name, type, "tenantId")
VALUES
  ('branch-demo-central', 'Sucursal Central', 'physical', 'tenant-demo'),
  ('branch-demo-web', 'Tienda Online', 'virtual', 'tenant-demo'),
  ('branch-fashion-central', 'Casa Central', 'physical', 'tenant-fashion');

-- ===============================
-- USUARIOS
-- password = 123456
-- ===============================
INSERT INTO "User"
(id, name, email, password, role, "branchId", "tenantId")
VALUES
(
  'user-demo-admin',
  'Admin Demo',
  'admin@demo.com',
  '$2a$10$4m5yC2cYv7v8tFQH5ZfB1O6Qw9A8xE2Q8M0E6MZQ6B5hH8E9nZ2aG',
  'SUPER_ADMIN',
  NULL,
  'tenant-demo'
),
(
  'user-demo-seller',
  'Vendedor Demo',
  'seller@demo.com',
  '$2a$10$4m5yC2cYv7v8tFQH5ZfB1O6Qw9A8xE2Q8M0E6MZQ6B5hH8E9nZ2aG',
  'SELLER',
  'branch-demo-central',
  'tenant-demo'
),
(
  'user-fashion-admin',
  'Admin Fashion',
  'admin@fashion.com',
  '$2a$10$4m5yC2cYv7v8tFQH5ZfB1O6Qw9A8xE2Q8M0E6MZQ6B5hH8E9nZ2aG',
  'SUPER_ADMIN',
  NULL,
  'tenant-fashion'
);

-- ===============================
-- PRODUCTOS
-- ===============================
INSERT INTO "Product"
(id, sku, name, price, cost, active, "tenantId")
VALUES
  ('prod-demo-1', 'SKU-D-001', 'Remera Negra', 10000, 6000, true, 'tenant-demo'),
  ('prod-demo-2', 'SKU-D-002', 'Jean Azul', 18000, 11000, true, 'tenant-demo'),
  ('prod-fashion-1', 'SKU-F-001', 'Campera Cuero', 60000, 42000, true, 'tenant-fashion');

-- ===============================
-- STOCK
-- ===============================
INSERT INTO "Stock"
(id, "productId", "branchId", quantity, "tenantId")
VALUES
  ('stock-demo-1', 'prod-demo-1', 'branch-demo-central', 50, 'tenant-demo'),
  ('stock-demo-2', 'prod-demo-2', 'branch-demo-central', 30, 'tenant-demo'),
  ('stock-demo-3', 'prod-demo-1', 'branch-demo-web', 100, 'tenant-demo'),
  ('stock-fashion-1', 'prod-fashion-1', 'branch-fashion-central', 20, 'tenant-fashion');

-- ===============================
-- MOVIMIENTOS DE STOCK
-- ===============================
INSERT INTO "StockMovement"
(id, "productId", "toBranchId", quantity, type, "tenantId")
VALUES
  ('mov-demo-1', 'prod-demo-1', 'branch-demo-central', 50, 'ADJUST', 'tenant-demo'),
  ('mov-demo-2', 'prod-demo-2', 'branch-demo-central', 30, 'ADJUST', 'tenant-demo'),
  ('mov-fashion-1', 'prod-fashion-1', 'branch-fashion-central', 20, 'ADJUST', 'tenant-fashion');

-- ===============================
-- VENTAS
-- ===============================
INSERT INTO "Sale"
(id, "branchId", "userId", total, "tenantId", "createdAt")
VALUES
  ('sale-demo-1', 'branch-demo-central', 'user-demo-seller', 28000, 'tenant-demo', NOW());

INSERT INTO "SaleItem"
(id, "saleId", "productId", quantity, price, "tenantId")
VALUES
  ('item-demo-1', 'sale-demo-1', 'prod-demo-1', 1, 10000, 'tenant-demo'),
  ('item-demo-2', 'sale-demo-1', 'prod-demo-2', 1, 18000, 'tenant-demo');

-- ===============================
-- WHATSAPP ORDERS
-- ===============================
INSERT INTO "WhatsappOrder"
(id, "customerName", "customerPhone", message, status, total, "tenantId")
VALUES
(
  'wa-demo-1',
  'Juan Pérez',
  '+5491112345678',
  'Hola, quiero una remera y un jean',
  'pending',
  28000,
  'tenant-demo'
);

-- ===============================
-- REFRESH TOKENS
-- ===============================
INSERT INTO "RefreshToken"
(id, token, "userId", "expiresAt", "tenantId")
VALUES
(
  'rt-demo-1',
  'mock-refresh-token-demo',
  'user-demo-admin',
  NOW() + INTERVAL '7 days',
  'tenant-demo'
);
