-- ===============================
-- LIMPIEZA (solo DEV)
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
  "Branch"
CASCADE;

-- ===============================
-- SUCURSALES
-- ===============================
INSERT INTO "Branch" (id, name, type)
VALUES
  ('branch-central', 'Sucursal Central', 'physical'),
  ('branch-web', 'Tienda Online', 'virtual');

-- ===============================
-- USUARIOS
-- password = "123456"
-- hash generado con bcrypt (10 rounds)
-- ===============================
INSERT INTO "User" (id, name, email, password, role, "branchId", "updatedAt")
VALUES
(
  'user-admin',
  'Admin',
  'admin@demo.com',
  '$2a$10$4m5yC2cYv7v8tFQH5ZfB1O6Qw9A8xE2Q8M0E6MZQ6B5hH8E9nZ2aG',
  'SUPER_ADMIN',
  null,
  NOW()
),
(
  'user-manager',
  'Manager Central',
  'manager@demo.com',
  '$2a$10$4m5yC2cYv7v8tFQH5ZfB1O6Qw9A8xE2Q8M0E6MZQ6B5hH8E9nZ2aG',
  'BRANCH_MANAGER',
  'branch-central',
  NOW()
),
(
  'user-seller',
  'Vendedor',
  'seller@demo.com',
  '$2a$10$4m5yC2cYv7v8tFQH5ZfB1O6Qw9A8xE2Q8M0E6MZQ6B5hH8E9nZ2aG',
  'SELLER',
  'branch-central',
  NOW() 
);

-- ===============================
-- PRODUCTOS
-- ===============================
INSERT INTO "Product" (id, sku, name, price, cost, active, "updatedAt")
VALUES
  ('prod-1', 'SKU-001', 'Remera Negra', 10000, 6000, true, NOW()),
  ('prod-2', 'SKU-002', 'Pantalón Jean', 18000, 11000, true, NOW()),
  ('prod-3', 'SKU-003', 'Zapatillas Urban', 35000, 25000, true, NOW());

-- ===============================
-- STOCK POR SUCURSAL
-- ===============================
INSERT INTO "Stock" (id, "productId", "branchId", quantity)
VALUES
  ('stock-1', 'prod-1', 'branch-central', 50),
  ('stock-2', 'prod-2', 'branch-central', 30),
  ('stock-3', 'prod-3', 'branch-central', 20),
  ('stock-4', 'prod-1', 'branch-web', 100),
  ('stock-5', 'prod-2', 'branch-web', 60);

-- ===============================
-- MOVIMIENTOS DE STOCK
-- ===============================
INSERT INTO "StockMovement"
(id, "productId", "toBranchId", quantity, type)
VALUES
  ('mov-1', 'prod-1', 'branch-central', 50, 'ADJUST'),
  ('mov-2', 'prod-2', 'branch-central', 30, 'ADJUST'),
  ('mov-3', 'prod-3', 'branch-central', 20, 'ADJUST'),
  ('mov-4', 'prod-1', 'branch-web', 100, 'ADJUST'),
  ('mov-5', 'prod-2', 'branch-web', 60, 'ADJUST');

-- ===============================
-- VENTAS
-- ===============================
INSERT INTO "Sale" (id, "branchId", "userId", total, "createdAt")
VALUES
  ('sale-1', 'branch-central', 'user-seller', 28000, NOW() - INTERVAL '2 days'),
  ('sale-2', 'branch-central', 'user-seller', 10000, NOW() - INTERVAL '1 day');

INSERT INTO "SaleItem"
(id, "saleId", "productId", quantity, price)
VALUES
  ('item-1', 'sale-1', 'prod-1', 1, 10000),
  ('item-2', 'sale-1', 'prod-2', 1, 18000),
  ('item-3', 'sale-2', 'prod-1', 1, 10000);

-- ===============================
-- PEDIDOS WHATSAPP
-- ===============================
INSERT INTO "WhatsappOrder"
(id, "customerName", "customerPhone", message, status, total)
VALUES
(
  'wa-1',
  'Juan Pérez',
  '+5491112345678',
  'Hola, quiero 1 Remera Negra y 1 Jean',
  'pending',
  28000
);

-- ===============================
-- REFRESH TOKENS (mock)
-- ===============================
INSERT INTO "RefreshToken"
(id, token, "userId", "expiresAt")
VALUES
(
  'rt-1',
  'mock-refresh-token',
  'user-admin',
  NOW() + INTERVAL '7 days'
);
