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
  "Variant",
  "Product",
  "User",
  "Branch",
  "Tenant"
CASCADE;

-- ===============================
-- TENANTS
-- ===============================
INSERT INTO "Tenant" (id)
VALUES
  ('tenant-demo'),
  ('tenant-fashion');

-- ===============================
-- SUCURSALES
-- ===============================
INSERT INTO "Branch" (id, name, type, address, hours, "tenantId")
VALUES
  ('branch-demo-central', 'Sucursal Central', 'physical', 'Av. Demo 123', 'Lun-Vie 9:00-18:00', 'tenant-demo'),
  ('branch-demo-web', 'Tienda Online', 'virtual', NULL, '24/7', 'tenant-demo'),
  ('branch-fashion-central', 'Casa Central', 'physical', 'Av. Fashion 456', 'Lun-Sab 10:00-20:00', 'tenant-fashion');

-- ===============================
-- USUARIOS
-- password = 123456
-- ===============================
INSERT INTO "User"
(id, name, email, password, role, branchId, "tenantId")
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
  'tenant-fashion');

-- ===============================
-- PRODUCTOS
-- ===============================
INSERT INTO "Product"
(id, name, imageUrl, batch, expirationDate, active, baseAttributes, "tenantId")
VALUES
  ('prod-demo-1', 'Remera Negra', 'https://example.com/remera-negra.jpg', 'LOTE-2026-001', NULL, true, '{"metrosPorCaja": 10}', 'tenant-demo'),
  ('prod-demo-2', 'Jean Azul', 'https://example.com/jean-azul.jpg', 'LOTE-2026-002', NULL, true, '{"metrosPorCaja": 5}', 'tenant-demo'),
  ('prod-fashion-1', 'Campera Cuero', 'https://example.com/campera-cuero.jpg', 'LOTE-2026-003', NULL, true, '{"metrosPorCaja": 2}', 'tenant-fashion');

-- ===============================
-- VARIANTES (una variante por producto por ahora)
-- ===============================
INSERT INTO "Variant"
(id, productId, tenantId, sku, price, cost, attributes)
VALUES
  ('variant-demo-1', 'prod-demo-1', 'tenant-demo', 'SKU-D-001', 10000, 6000, '{"color": "negro", "talle": "unico"}'),
  ('variant-demo-2', 'prod-demo-2', 'tenant-demo', 'SKU-D-002', 18000, 11000, '{"color": "azul", "talle": "M"}'),
  ('variant-fashion-1', 'prod-fashion-1', 'tenant-fashion', 'SKU-F-001', 60000, 42000, '{"color": "negro", "talle": "L", "material": "cuero"}');

-- ===============================
-- STOCK
-- ===============================
INSERT INTO "Stock"
(id, variantId, branchId, quantity, "tenantId")
VALUES
  ('stock-demo-1', 'variant-demo-1', 'branch-demo-central', 50, 'tenant-demo'),
  ('stock-demo-2', 'variant-demo-2', 'branch-demo-central', 30, 'tenant-demo'),
  ('stock-demo-3', 'variant-demo-1', 'branch-demo-web', 100, 'tenant-demo'),
  ('stock-fashion-1', 'variant-fashion-1', 'branch-fashion-central', 20, 'tenant-fashion');

-- ===============================
-- MOVIMIENTOS DE STOCK
-- ===============================
INSERT INTO "StockMovement"
(id, variantId, toBranchId, quantity, type, userId, "tenantId")
VALUES
  ('mov-demo-1', 'variant-demo-1', 'branch-demo-central', 50, 'ADJUST', 'user-demo-admin', 'tenant-demo'),
  ('mov-demo-2', 'variant-demo-2', 'branch-demo-central', 30, 'ADJUST', 'user-demo-admin', 'tenant-demo'),
  ('mov-fashion-1', 'variant-fashion-1', 'branch-fashion-central', 20, 'ADJUST', 'user-fashion-admin', 'tenant-fashion');

-- ===============================
-- VENTAS
-- ===============================
INSERT INTO "Sale"
(id, branchId, userId, total, "tenantId", "createdAt")
VALUES
  ('sale-demo-1', 'branch-demo-central', 'user-demo-seller', 28000, 'tenant-demo', NOW());

INSERT INTO "SaleItem"
(id, saleId, variantId, quantity, price, "tenantId")
VALUES
  ('item-demo-1', 'sale-demo-1', 'variant-demo-1', 1, 10000, 'tenant-demo'),
  ('item-demo-2', 'sale-demo-1', 'variant-demo-2', 1, 18000, 'tenant-demo');

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
(id, token, userId, "expiresAt", "tenantId")
VALUES
(
  'rt-demo-1',
  'mock-refresh-token-demo',
  'user-demo-admin',
  NOW() + INTERVAL '7 days',
  'tenant-demo'
);