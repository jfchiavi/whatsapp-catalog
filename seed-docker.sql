-- Seed data only (schema created by migrations)
-- All IDs are deterministic UUIDs for reproducibility
BEGIN;

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
RESTART IDENTITY CASCADE;

-- Tenant
INSERT INTO "Tenant" (id, name) VALUES
  ('0b95f160-f948-5ac3-921a-56029e130fa9', 'Demo Tenant'),
  ('b63747fe-2573-5214-b490-32828299d672', 'Fashion Tenant');

-- Branches
INSERT INTO "Branch" (id, name, type, address, hours, "tenantId") VALUES
  ('1075ea0b-a199-5f89-ad10-bcb83627b8a6', 'Sucursal Central', 'physical', 'Av. Rivadavia 1234, CABA', 'Lun-Vie 9:00-18:00', '0b95f160-f948-5ac3-921a-56029e130fa9'),
  ('b6ff47c1-6d63-5bd7-a880-b012bd39c19a', 'Tienda Online', 'virtual', NULL, NULL, '0b95f160-f948-5ac3-921a-56029e130fa9'),
  ('30dde5a8-9bb3-5a8d-9bcf-a624f3d771cd', 'Fashion Store', 'physical', 'Av. Corrientes 4567, CABA', 'Lun-Sab 10:00-20:00', 'b63747fe-2573-5214-b490-32828299d672'),
  ('26762c5d-3146-5891-9b67-92b5f416f739', 'Fashion Online', 'virtual', NULL, NULL, 'b63747fe-2573-5214-b490-32828299d672');

-- Users (password: 123456 for all)
INSERT INTO "User" (id, name, email, password, role, "branchId", "tenantId", "updatedAt") VALUES
  ('3446d34c-deb5-58ef-8822-2b94fb6f5842', 'Admin Demo', 'admin@demo.com', '$2b$10$4EugrtvDPexe0g4OSYo77exqwxrQU.mLgSWQSQVmo3j4j6SZvkpZC', 'SUPER_ADMIN', NULL, '0b95f160-f948-5ac3-921a-56029e130fa9', NOW()),
  ('8e188ee8-0bdf-55b0-abb3-1deb8d6f2da0', 'Gerente Central', 'manager@demo.com', '$2b$10$4EugrtvDPexe0g4OSYo77exqwxrQU.mLgSWQSQVmo3j4j6SZvkpZC', 'BRANCH_MANAGER', '1075ea0b-a199-5f89-ad10-bcb83627b8a6', '0b95f160-f948-5ac3-921a-56029e130fa9', NOW()),
  ('46b4faa7-e0bd-510f-bc69-a0270b7eb450', 'Vendedor Tienda', 'seller@demo.com', '$2b$10$4EugrtvDPexe0g4OSYo77exqwxrQU.mLgSWQSQVmo3j4j6SZvkpZC', 'SELLER', '1075ea0b-a199-5f89-ad10-bcb83627b8a6', '0b95f160-f948-5ac3-921a-56029e130fa9', NOW()),
  ('7c25527d-593e-5b76-a595-838858e598cd', 'Admin Fashion', 'admin@fashion.com', '$2b$10$4EugrtvDPexe0g4OSYo77exqwxrQU.mLgSWQSQVmo3j4j6SZvkpZC', 'SUPER_ADMIN', NULL, 'b63747fe-2573-5214-b490-32828299d672', NOW()),
  ('4350621d-006a-5d6c-9876-888fc92a3716', 'Vendedor Fashion', 'seller@fashion.com', '$2b$10$4EugrtvDPexe0g4OSYo77exqwxrQU.mLgSWQSQVmo3j4j6SZvkpZC', 'SELLER', '30dde5a8-9bb3-5a8d-9bcf-a624f3d771cd', 'b63747fe-2573-5214-b490-32828299d672', NOW());

-- Products
INSERT INTO "Product" (id, name, "imageUrl", batch, "expirationDate", "baseAttributes", active, "tenantId", "updatedAt") VALUES
  ('0aa15edc-d718-5385-9e43-75b42902d59e', 'Remera Oversize', NULL, 'LOTE-2025-01', NULL, '{"color": "negro", "material": "algodon"}', true, '0b95f160-f948-5ac3-921a-56029e130fa9', NOW()),
  ('8e17f68d-69a8-5824-af57-7c1b830e414c', 'Pantalón Jean Slim', NULL, 'LOTE-2025-02', NULL, '{"color": "azul oscuro", "talle": "42"}', true, '0b95f160-f948-5ac3-921a-56029e130fa9', NOW()),
  ('fe121631-6d0c-5cf2-b4d1-b72e3c40d4b0', 'Zapatillas Urban Run', NULL, 'LOTE-2025-03', NULL, '{"color": "blanco", "talle": "41"}', true, '0b95f160-f948-5ac3-921a-56029e130fa9', NOW()),
  ('7b40b931-e52f-5b77-aa0f-9db18a4bc122', 'Campera de Cuero', NULL, 'LOTE-FASHION-01', NULL, '{"material": "cuero", "estilo": "biker"}', true, 'b63747fe-2573-5214-b490-32828299d672', NOW()),
  ('71a5e942-bd19-5960-a322-887e9453233a', 'Bufanda de Lana', NULL, 'LOTE-FASHION-02', NULL, '{"material": "lana", "estilo": "invierno"}', true, 'b63747fe-2573-5214-b490-32828299d672', NOW());

-- Variants
INSERT INTO "Variant" (id, "productId", sku, price, cost, attributes, "tenantId", "updatedAt") VALUES
  ('a9fbfe58-6361-557b-90c0-7dadf311090d', '0aa15edc-d718-5385-9e43-75b42902d59e', 'REM-NEG-S', 8500, 5000, '{"talle": "S"}', '0b95f160-f948-5ac3-921a-56029e130fa9', NOW()),
  ('40bff466-6107-58ea-af9a-ebb91ec2034a', '0aa15edc-d718-5385-9e43-75b42902d59e', 'REM-NEG-M', 8500, 5000, '{"talle": "M"}', '0b95f160-f948-5ac3-921a-56029e130fa9', NOW()),
  ('009e6cf9-52ba-56ad-97a9-2488a266d5f9', '0aa15edc-d718-5385-9e43-75b42902d59e', 'REM-NEG-L', 9000, 5200, '{"talle": "L"}', '0b95f160-f948-5ac3-921a-56029e130fa9', NOW()),
  ('7ce11874-16d9-55a8-ab96-149f2c546805', '8e17f68d-69a8-5824-af57-7c1b830e414c', 'JEAN-SLIM-38', 18000, 11000, '{"talle": "38"}', '0b95f160-f948-5ac3-921a-56029e130fa9', NOW()),
  ('fd3167b2-8250-5827-92b3-27e96f253688', '8e17f68d-69a8-5824-af57-7c1b830e414c', 'JEAN-SLIM-42', 18500, 11500, '{"talle": "42"}', '0b95f160-f948-5ac3-921a-56029e130fa9', NOW()),
  ('a6e9f87c-5fad-52ba-9645-5b5d6a412c06', 'fe121631-6d0c-5cf2-b4d1-b72e3c40d4b0', 'ZAP-URBAN-40', 35000, 25000, '{"talle": "40"}', '0b95f160-f948-5ac3-921a-56029e130fa9', NOW()),
  ('d744183c-949e-51f8-b591-33954650b06e', 'fe121631-6d0c-5cf2-b4d1-b72e3c40d4b0', 'ZAP-URBAN-41', 35000, 25000, '{"talle": "41"}', '0b95f160-f948-5ac3-921a-56029e130fa9', NOW()),
  ('b89af82f-82be-5268-abbd-2c7f9efb4c7f', 'fe121631-6d0c-5cf2-b4d1-b72e3c40d4b0', 'ZAP-URBAN-42', 36000, 26000, '{"talle": "42"}', '0b95f160-f948-5ac3-921a-56029e130fa9', NOW()),
  ('19eb60f7-402a-5b13-9002-0cd724384204', '7b40b931-e52f-5b77-aa0f-9db18a4bc122', 'CUE-BIKER-M', 45000, 30000, '{"talle": "M"}', 'b63747fe-2573-5214-b490-32828299d672', NOW()),
  ('9cb7cc5f-2477-57f1-a8b6-84b4e03c57ac', '7b40b931-e52f-5b77-aa0f-9db18a4bc122', 'CUE-BIKER-L', 45000, 30000, '{"talle": "L"}', 'b63747fe-2573-5214-b490-32828299d672', NOW()),
  ('d0c80090-2783-57b6-aa18-1a1cf466323a', '71a5e942-bd19-5960-a322-887e9453233a', 'BUF-LANA-ROJO', 8000, 4500, '{"color": "rojo"}', 'b63747fe-2573-5214-b490-32828299d672', NOW()),
  ('93679d14-33a2-566b-a7b1-0d22b00322c1', '71a5e942-bd19-5960-a322-887e9453233a', 'BUF-LANA-AZUL', 8000, 4500, '{"color": "azul"}', 'b63747fe-2573-5214-b490-32828299d672', NOW());

-- Stock (all variants in both branches)
INSERT INTO "Stock" (id, "variantId", "branchId", quantity, "tenantId") VALUES
  ('e6304dd7-635b-5976-a071-bbc97c5eb745', 'a9fbfe58-6361-557b-90c0-7dadf311090d', '1075ea0b-a199-5f89-ad10-bcb83627b8a6', 25, '0b95f160-f948-5ac3-921a-56029e130fa9'),
  ('416e943d-8802-59ab-b3eb-842a58d54509', '40bff466-6107-58ea-af9a-ebb91ec2034a', '1075ea0b-a199-5f89-ad10-bcb83627b8a6', 30, '0b95f160-f948-5ac3-921a-56029e130fa9'),
  ('8e31960f-7cff-540a-a279-6b324c4da199', '009e6cf9-52ba-56ad-97a9-2488a266d5f9', '1075ea0b-a199-5f89-ad10-bcb83627b8a6', 20, '0b95f160-f948-5ac3-921a-56029e130fa9'),
  ('ae450e87-64a9-53c9-9beb-2b4342e32a1c', '7ce11874-16d9-55a8-ab96-149f2c546805', '1075ea0b-a199-5f89-ad10-bcb83627b8a6', 15, '0b95f160-f948-5ac3-921a-56029e130fa9'),
  ('d1201dbd-1dbf-5957-8619-54582720fd22', 'fd3167b2-8250-5827-92b3-27e96f253688', '1075ea0b-a199-5f89-ad10-bcb83627b8a6', 12, '0b95f160-f948-5ac3-921a-56029e130fa9'),
  ('f8938c5c-0909-5d66-b1fd-dbf3991f844a', 'a6e9f87c-5fad-52ba-9645-5b5d6a412c06', '1075ea0b-a199-5f89-ad10-bcb83627b8a6', 8, '0b95f160-f948-5ac3-921a-56029e130fa9'),
  ('b7ec0ab6-b7ec-5961-bbe3-db0b935d0c7a', 'd744183c-949e-51f8-b591-33954650b06e', '1075ea0b-a199-5f89-ad10-bcb83627b8a6', 10, '0b95f160-f948-5ac3-921a-56029e130fa9'),
  ('b12668c9-b06f-59c0-96f6-eaa8aba86d65', 'b89af82f-82be-5268-abbd-2c7f9efb4c7f', '1075ea0b-a199-5f89-ad10-bcb83627b8a6', 5, '0b95f160-f948-5ac3-921a-56029e130fa9'),
  ('4c2d7d3a-c407-5c4f-b961-299a072e5ab8', 'a9fbfe58-6361-557b-90c0-7dadf311090d', 'b6ff47c1-6d63-5bd7-a880-b012bd39c19a', 100, '0b95f160-f948-5ac3-921a-56029e130fa9'),
  ('bf2fd71a-9146-57aa-abee-449793b072d5', '40bff466-6107-58ea-af9a-ebb91ec2034a', 'b6ff47c1-6d63-5bd7-a880-b012bd39c19a', 100, '0b95f160-f948-5ac3-921a-56029e130fa9'),
  ('64bcef16-2790-5894-ba0a-b6eb521ad515', '009e6cf9-52ba-56ad-97a9-2488a266d5f9', 'b6ff47c1-6d63-5bd7-a880-b012bd39c19a', 80, '0b95f160-f948-5ac3-921a-56029e130fa9'),
  ('25086712-de4a-5ead-b778-f8acfb76ad4f', '7ce11874-16d9-55a8-ab96-149f2c546805', 'b6ff47c1-6d63-5bd7-a880-b012bd39c19a', 50, '0b95f160-f948-5ac3-921a-56029e130fa9'),
  ('8d676f1a-da91-59c4-900a-858b7e7cdab7', 'fd3167b2-8250-5827-92b3-27e96f253688', 'b6ff47c1-6d63-5bd7-a880-b012bd39c19a', 40, '0b95f160-f948-5ac3-921a-56029e130fa9'),
  ('8e8fe90b-de05-5c74-9a64-fc0e24bc5fb0', 'a6e9f87c-5fad-52ba-9645-5b5d6a412c06', 'b6ff47c1-6d63-5bd7-a880-b012bd39c19a', 20, '0b95f160-f948-5ac3-921a-56029e130fa9'),
  ('05744546-2d1e-5fc2-8ee8-308a76ee4239', 'd744183c-949e-51f8-b591-33954650b06e', 'b6ff47c1-6d63-5bd7-a880-b012bd39c19a', 25, '0b95f160-f948-5ac3-921a-56029e130fa9'),
  ('ca3494ea-8d6f-5d0c-ad1b-c876b4cee520', 'b89af82f-82be-5268-abbd-2c7f9efb4c7f', 'b6ff47c1-6d63-5bd7-a880-b012bd39c19a', 15, '0b95f160-f948-5ac3-921a-56029e130fa9'),
  ('f1a2b3c4-d5e6-7890-abcd-ef1234567890', '19eb60f7-402a-5b13-9002-0cd724384204', '30dde5a8-9bb3-5a8d-9bcf-a624f3d771cd', 15, 'b63747fe-2573-5214-b490-32828299d672'),
  ('f2b3c4d5-e6f7-8901-bcde-f12345678901', '9cb7cc5f-2477-57f1-a8b6-84b4e03c57ac', '30dde5a8-9bb3-5a8d-9bcf-a624f3d771cd', 10, 'b63747fe-2573-5214-b490-32828299d672'),
  ('f3c4d5e6-f7a8-9012-cdef-123456789012', 'd0c80090-2783-57b6-aa18-1a1cf466323a', '30dde5a8-9bb3-5a8d-9bcf-a624f3d771cd', 30, 'b63747fe-2573-5214-b490-32828299d672'),
  ('f4d5e6f7-a8b9-0123-defa-234567890123', '93679d14-33a2-566b-a7b1-0d22b00322c1', '30dde5a8-9bb3-5a8d-9bcf-a624f3d771cd', 25, 'b63747fe-2573-5214-b490-32828299d672'),
  ('f5e6f7a8-b9c0-1234-efab-345678901234', '19eb60f7-402a-5b13-9002-0cd724384204', '26762c5d-3146-5891-9b67-92b5f416f739', 50, 'b63747fe-2573-5214-b490-32828299d672'),
  ('f6f7a8b9-c0d1-2345-fabc-456789012345', '9cb7cc5f-2477-57f1-a8b6-84b4e03c57ac', '26762c5d-3146-5891-9b67-92b5f416f739', 40, 'b63747fe-2573-5214-b490-32828299d672'),
  ('f7a8b9c0-d1e2-3456-abcd-567890123456', 'd0c80090-2783-57b6-aa18-1a1cf466323a', '26762c5d-3146-5891-9b67-92b5f416f739', 60, 'b63747fe-2573-5214-b490-32828299d672'),
  ('f8b9c0d1-e2f3-4567-bcde-678901234567', '93679d14-33a2-566b-a7b1-0d22b00322c1', '26762c5d-3146-5891-9b67-92b5f416f739', 55, 'b63747fe-2573-5214-b490-32828299d672');

-- Stock Movements (initial stock adjustments)
INSERT INTO "StockMovement" (id, "variantId", "fromBranchId", "toBranchId", quantity, type, "userId", "tenantId") VALUES
  ('3f6bc8aa-6dce-5bc9-9e67-f43d9eb1d233', 'a9fbfe58-6361-557b-90c0-7dadf311090d', NULL, '1075ea0b-a199-5f89-ad10-bcb83627b8a6', 25, 'ADJUST', '3446d34c-deb5-58ef-8822-2b94fb6f5842', '0b95f160-f948-5ac3-921a-56029e130fa9'),
  ('ef9b7ca1-c061-5ea4-b1e9-fa6426dab4fc', '40bff466-6107-58ea-af9a-ebb91ec2034a', NULL, '1075ea0b-a199-5f89-ad10-bcb83627b8a6', 30, 'ADJUST', '3446d34c-deb5-58ef-8822-2b94fb6f5842', '0b95f160-f948-5ac3-921a-56029e130fa9'),
  ('ec0b7d25-bb49-5e31-8c1c-3b68431cc574', '009e6cf9-52ba-56ad-97a9-2488a266d5f9', NULL, '1075ea0b-a199-5f89-ad10-bcb83627b8a6', 20, 'ADJUST', '3446d34c-deb5-58ef-8822-2b94fb6f5842', '0b95f160-f948-5ac3-921a-56029e130fa9'),
  ('77459c9e-cacd-545d-a95a-9d08acc77989', '7ce11874-16d9-55a8-ab96-149f2c546805', NULL, '1075ea0b-a199-5f89-ad10-bcb83627b8a6', 15, 'ADJUST', '3446d34c-deb5-58ef-8822-2b94fb6f5842', '0b95f160-f948-5ac3-921a-56029e130fa9'),
  ('3775f8d8-9e8d-53ca-8fda-192e7a440e99', 'fd3167b2-8250-5827-92b3-27e96f253688', NULL, '1075ea0b-a199-5f89-ad10-bcb83627b8a6', 12, 'ADJUST', '3446d34c-deb5-58ef-8822-2b94fb6f5842', '0b95f160-f948-5ac3-921a-56029e130fa9'),
  ('0c2ed2f9-c6c6-5a33-88a9-ce9b722547e2', 'a6e9f87c-5fad-52ba-9645-5b5d6a412c06', NULL, '1075ea0b-a199-5f89-ad10-bcb83627b8a6', 8, 'ADJUST', '3446d34c-deb5-58ef-8822-2b94fb6f5842', '0b95f160-f948-5ac3-921a-56029e130fa9'),
  ('a8bc0d4c-5218-50b1-838e-f4075841761f', 'd744183c-949e-51f8-b591-33954650b06e', NULL, '1075ea0b-a199-5f89-ad10-bcb83627b8a6', 10, 'ADJUST', '3446d34c-deb5-58ef-8822-2b94fb6f5842', '0b95f160-f948-5ac3-921a-56029e130fa9'),
  ('3c5066a2-2319-516c-a0e6-830634b04370', 'b89af82f-82be-5268-abbd-2c7f9efb4c7f', NULL, '1075ea0b-a199-5f89-ad10-bcb83627b8a6', 5, 'ADJUST', '3446d34c-deb5-58ef-8822-2b94fb6f5842', '0b95f160-f948-5ac3-921a-56029e130fa9'),
  ('16675979-7c8b-5959-89c4-7fda4947b712', 'a9fbfe58-6361-557b-90c0-7dadf311090d', NULL, 'b6ff47c1-6d63-5bd7-a880-b012bd39c19a', 100, 'ADJUST', '3446d34c-deb5-58ef-8822-2b94fb6f5842', '0b95f160-f948-5ac3-921a-56029e130fa9'),
  ('760086ab-1313-5ad6-9e4d-699173185c36', '40bff466-6107-58ea-af9a-ebb91ec2034a', NULL, 'b6ff47c1-6d63-5bd7-a880-b012bd39c19a', 100, 'ADJUST', '3446d34c-deb5-58ef-8822-2b94fb6f5842', '0b95f160-f948-5ac3-921a-56029e130fa9'),
  ('fbde88b5-7849-5f28-9c30-419bbb7aa8cb', '009e6cf9-52ba-56ad-97a9-2488a266d5f9', NULL, 'b6ff47c1-6d63-5bd7-a880-b012bd39c19a', 80, 'ADJUST', '3446d34c-deb5-58ef-8822-2b94fb6f5842', '0b95f160-f948-5ac3-921a-56029e130fa9'),
  ('1bc8d3ad-2eaa-5b68-9df8-d6ec0d28bf6e', '7ce11874-16d9-55a8-ab96-149f2c546805', NULL, 'b6ff47c1-6d63-5bd7-a880-b012bd39c19a', 50, 'ADJUST', '3446d34c-deb5-58ef-8822-2b94fb6f5842', '0b95f160-f948-5ac3-921a-56029e130fa9'),
  ('0ac3d269-2562-5245-ab43-8143ed2b8d1f', 'fd3167b2-8250-5827-92b3-27e96f253688', NULL, 'b6ff47c1-6d63-5bd7-a880-b012bd39c19a', 40, 'ADJUST', '3446d34c-deb5-58ef-8822-2b94fb6f5842', '0b95f160-f948-5ac3-921a-56029e130fa9'),
  ('3e03f602-88fa-5976-bf6b-55a7793f3e23', 'a6e9f87c-5fad-52ba-9645-5b5d6a412c06', NULL, 'b6ff47c1-6d63-5bd7-a880-b012bd39c19a', 20, 'ADJUST', '3446d34c-deb5-58ef-8822-2b94fb6f5842', '0b95f160-f948-5ac3-921a-56029e130fa9'),
  ('86eccaac-6324-5939-96ad-3ac1aaf34ee0', 'd744183c-949e-51f8-b591-33954650b06e', NULL, 'b6ff47c1-6d63-5bd7-a880-b012bd39c19a', 25, 'ADJUST', '3446d34c-deb5-58ef-8822-2b94fb6f5842', '0b95f160-f948-5ac3-921a-56029e130fa9'),
  ('a72ca3d5-5246-5f81-8e7b-debbe97fe638', 'b89af82f-82be-5268-abbd-2c7f9efb4c7f', NULL, 'b6ff47c1-6d63-5bd7-a880-b012bd39c19a', 15, 'ADJUST', '3446d34c-deb5-58ef-8822-2b94fb6f5842', '0b95f160-f948-5ac3-921a-56029e130fa9'),
  ('b1c2d3e4-f5a6-7890-abcd-ef1234567890', '19eb60f7-402a-5b13-9002-0cd724384204', NULL, '30dde5a8-9bb3-5a8d-9bcf-a624f3d771cd', 15, 'ADJUST', '7c25527d-593e-5b76-a595-838858e598cd', 'b63747fe-2573-5214-b490-32828299d672'),
  ('c2d3e4f5-a6b7-8901-bcde-f12345678901', '9cb7cc5f-2477-57f1-a8b6-84b4e03c57ac', NULL, '30dde5a8-9bb3-5a8d-9bcf-a624f3d771cd', 10, 'ADJUST', '7c25527d-593e-5b76-a595-838858e598cd', 'b63747fe-2573-5214-b490-32828299d672'),
  ('d3e4f5a6-b7c8-9012-cdef-123456789012', 'd0c80090-2783-57b6-aa18-1a1cf466323a', NULL, '30dde5a8-9bb3-5a8d-9bcf-a624f3d771cd', 30, 'ADJUST', '7c25527d-593e-5b76-a595-838858e598cd', 'b63747fe-2573-5214-b490-32828299d672'),
  ('e4f5a6b7-c8d9-0123-defa-234567890123', '93679d14-33a2-566b-a7b1-0d22b00322c1', NULL, '30dde5a8-9bb3-5a8d-9bcf-a624f3d771cd', 25, 'ADJUST', '7c25527d-593e-5b76-a595-838858e598cd', 'b63747fe-2573-5214-b490-32828299d672'),
  ('f5a6b7c8-d9e0-1234-efab-345678901234', '19eb60f7-402a-5b13-9002-0cd724384204', NULL, '26762c5d-3146-5891-9b67-92b5f416f739', 50, 'ADJUST', '7c25527d-593e-5b76-a595-838858e598cd', 'b63747fe-2573-5214-b490-32828299d672'),
  ('a6b7c8d9-e0f1-2345-fabc-456789012345', '9cb7cc5f-2477-57f1-a8b6-84b4e03c57ac', NULL, '26762c5d-3146-5891-9b67-92b5f416f739', 40, 'ADJUST', '7c25527d-593e-5b76-a595-838858e598cd', 'b63747fe-2573-5214-b490-32828299d672'),
  ('b7c8d9e0-f1a2-3456-abcd-567890123456', 'd0c80090-2783-57b6-aa18-1a1cf466323a', NULL, '26762c5d-3146-5891-9b67-92b5f416f739', 60, 'ADJUST', '7c25527d-593e-5b76-a595-838858e598cd', 'b63747fe-2573-5214-b490-32828299d672'),
  ('c8d9e0f1-a2b3-4567-bcde-678901234567', '93679d14-33a2-566b-a7b1-0d22b00322c1', NULL, '26762c5d-3146-5891-9b67-92b5f416f739', 55, 'ADJUST', '7c25527d-593e-5b76-a595-838858e598cd', 'b63747fe-2573-5214-b490-32828299d672');

-- Sales
INSERT INTO "Sale" (id, "branchId", "userId", total, "tenantId", "createdAt") VALUES
  ('e30f47be-32a0-57d5-976a-7dd54715ec60', '1075ea0b-a199-5f89-ad10-bcb83627b8a6', '46b4faa7-e0bd-510f-bc69-a0270b7eb450', 23500, '0b95f160-f948-5ac3-921a-56029e130fa9', NOW() - INTERVAL '5 days'),
  ('09df768a-6ce2-58a2-ad35-713e2eab3fd9', '1075ea0b-a199-5f89-ad10-bcb83627b8a6', '46b4faa7-e0bd-510f-bc69-a0270b7eb450', 8500, '0b95f160-f948-5ac3-921a-56029e130fa9', NOW() - INTERVAL '3 days'),
  ('283e0512-a2ca-541a-be8e-0792ff98bc48', '1075ea0b-a199-5f89-ad10-bcb83627b8a6', '46b4faa7-e0bd-510f-bc69-a0270b7eb450', 51500, '0b95f160-f948-5ac3-921a-56029e130fa9', NOW() - INTERVAL '1 day');

-- Sale Items
INSERT INTO "SaleItem" (id, "saleId", "variantId", quantity, price, "tenantId") VALUES
  ('bdabe30e-3858-515d-8517-7f4fb3945aea', 'e30f47be-32a0-57d5-976a-7dd54715ec60', 'a9fbfe58-6361-557b-90c0-7dadf311090d', 1, 8500, '0b95f160-f948-5ac3-921a-56029e130fa9'),
  ('fdac74ed-121e-5b70-ad10-f7722cb84936', 'e30f47be-32a0-57d5-976a-7dd54715ec60', '7ce11874-16d9-55a8-ab96-149f2c546805', 1, 15000, '0b95f160-f948-5ac3-921a-56029e130fa9'),
  ('ec0efbc3-5e6a-57f4-983b-0f2fb8e5922b', '09df768a-6ce2-58a2-ad35-713e2eab3fd9', '40bff466-6107-58ea-af9a-ebb91ec2034a', 1, 8500, '0b95f160-f948-5ac3-921a-56029e130fa9'),
  ('b52dc3b9-5c40-55ea-9aae-57633e54a255', '283e0512-a2ca-541a-be8e-0792ff98bc48', 'd744183c-949e-51f8-b591-33954650b06e', 1, 35000, '0b95f160-f948-5ac3-921a-56029e130fa9'),
  ('b6dd8635-76ff-519d-903c-1c2eba47f29c', '283e0512-a2ca-541a-be8e-0792ff98bc48', '009e6cf9-52ba-56ad-97a9-2488a266d5f9', 1, 9000, '0b95f160-f948-5ac3-921a-56029e130fa9'),
  ('029bde05-3f59-5656-b6e0-70e9d99e0320', '283e0512-a2ca-541a-be8e-0792ff98bc48', 'fd3167b2-8250-5827-92b3-27e96f253688', 1, 7500, '0b95f160-f948-5ac3-921a-56029e130fa9');

-- WhatsApp Orders
INSERT INTO "WhatsappOrder" (id, "customerName", "customerPhone", message, status, total, "tenantId") VALUES
  ('ee65a3bb-0547-5354-a0a2-77e87d4669a1', 'Juan Pérez', '+5491112345678', 'Hola! Quiero comprar 2 Remeras Talle M y 1 Jean Talle 38. ¿Tienen stock?', 'pending', 23500, '0b95f160-f948-5ac3-921a-56029e130fa9'),
  ('50c822ef-0e8e-5ddb-90fe-acfa5d22ed0f', 'María García', '+5491165432100', 'Buenas tardes. Necesito 1 par de Zapatillas Urban talle 41. ¿Cuál es el precio?', 'contacted', 35000, '0b95f160-f948-5ac3-921a-56029e130fa9'),
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Carlos López', '+5491198765432', 'Hola, me interesa una Campera de Cuero talle L. ¿Tienen stock?', 'pending', 45000, 'b63747fe-2573-5214-b490-32828299d672'),
  ('b2c3d4e5-f6a7-8901-bcde-f12345678901', 'Ana Martínez', '+5491155556666', 'Buen día. Quiero una Bufanda de Lana color rojo. ¿Cuánto sale?', 'contacted', 8000, 'b63747fe-2573-5214-b490-32828299d672');

-- Refresh Token
INSERT INTO "RefreshToken" (id, token, "userId", "expiresAt", "tenantId") VALUES
  ('ba7c56df-f948-5460-aac0-a7bb41d1d611', 'mock-refresh-token', '3446d34c-deb5-58ef-8822-2b94fb6f5842', NOW() + INTERVAL '7 days', '0b95f160-f948-5ac3-921a-56029e130fa9'),
  ('c1d2e3f4-a5b6-7890-cdef-123456789012', 'mock-refresh-token-fashion', '7c25527d-593e-5b76-a595-838858e598cd', NOW() + INTERVAL '7 days', 'b63747fe-2573-5214-b490-32828299d672');

COMMIT;
