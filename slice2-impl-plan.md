# Slice 2: Sucursales y gestión de stock

Completar el CRUD de sucursales, refactorizar el servicio de stock para que reciba `tenantId` desde el contexto autenticado (no lo derive del userId), validar relaciones cruzadas, normalizar errores al envelope estándar, reconstruir el frontend de stock con selección de sucursal, y agregar tests.

## User Review Required

> [!IMPORTANT]
> La base de datos Docker de este proyecto **no está corriendo** — el contenedor `catalog_postgres` no aparece en `docker ps` (solo hay contenedores de otro proyecto `edutech`). Necesito que levantes la DB antes de poder correr tests o migraciones.
>
> ```bash
> cd /Users/jfchiavi/develop/typescript-projects/whatsapp-catalog
> docker compose up -d postgres
> ```

> [!WARNING]
> El `BRANCH_MANAGER` tiene permiso `stock` en el backend pero **no** en el frontend ([rolePermissions.ts](file:///Users/jfchiavi/develop/typescript-projects/whatsapp-catalog/frontend/src/config/rolePermissions.ts)). Este plan lo corrige. ¿Estás de acuerdo en que BRANCH_MANAGER vea stock en el dashboard?

## Proposed Changes

### 1. Backend — Branch CRUD completo

#### [NEW] [route.ts](file:///Users/jfchiavi/develop/typescript-projects/whatsapp-catalog/backend/src/app/api/branches/[id]/route.ts)
- `GET /api/branches/:id` — devuelve sucursal por ID con filtro `tenantId`
- `PUT /api/branches/:id` — actualiza nombre, tipo, dirección y horarios
- `DELETE /api/branches/:id` — elimina sucursal (solo si no tiene stock ni users asociados)

#### [MODIFY] [branch.service.ts](file:///Users/jfchiavi/develop/typescript-projects/whatsapp-catalog/backend/src/modules/branches/branch.service.ts)
- Agregar `getBranchById(id, tenantId)`, `updateBranch(id, tenantId, data)`, `deleteBranch(id, tenantId)`
- `createBranch` acepta `address` y `hours`
- `deleteBranch` valida que no haya stock ni users referenciando la sucursal

#### [MODIFY] [branch.schema.ts](file:///Users/jfchiavi/develop/typescript-projects/whatsapp-catalog/backend/src/validators/branch.schema.ts)
- Agregar `updateBranchSchema` con campos opcionales: `name`, `type`, `address`, `hours`
- Extender `createBranchSchema` con `address` y `hours` opcionales

---

### 2. Backend — Stock service refactorizado (tenant-aware)

#### [MODIFY] [stock.service.ts](file:///Users/jfchiavi/develop/typescript-projects/whatsapp-catalog/backend/src/modules/stock/stock.service.ts)
- **`adjustStock`**: recibe `tenantId` como parámetro explícito (del JWT, no derivado del userId). Valida que `variantId` y `branchId` pertenezcan al `tenantId` antes de operar. Eliminar la lógica de derivación de tenantId desde user/variant/branch.
- **`transferStock`**: igual, recibe `tenantId` explícito. Valida que variante y ambas sucursales pertenezcan al tenant. Rechaza `fromBranchId === toBranchId`.
- Ambas funciones lanzan `AppError` en vez de `Error` genérico.

#### [MODIFY] [route.ts (adjust)](file:///Users/jfchiavi/develop/typescript-projects/whatsapp-catalog/backend/src/app/api/stock/adjust/route.ts)
- Pasar `auth.tenantId` a `adjustStock` en vez de solo `auth.userId`
- Usar `handleError` para respuestas consistentes
- Validar que BRANCH_MANAGER solo ajuste stock de su sucursal (`auth.branchId`)

#### [MODIFY] [route.ts (transfer)](file:///Users/jfchiavi/develop/typescript-projects/whatsapp-catalog/backend/src/app/api/stock/transfer/route.ts)
- Pasar `auth.tenantId` a `transferStock`
- Usar `handleError` para respuestas consistentes
- Validar que BRANCH_MANAGER solo transfiera desde/hacia su sucursal

#### [MODIFY] [route.ts (stock/branch)](file:///Users/jfchiavi/develop/typescript-projects/whatsapp-catalog/backend/src/app/api/stock/branch/[branchId]/route.ts)
- Validar que la sucursal pertenezca al `auth.tenantId` (actualmente valida branch exists pero no compara tenantId)
- Normalizar errores al envelope `success/error`

#### [MODIFY] [route.ts (stock/history)](file:///Users/jfchiavi/develop/typescript-projects/whatsapp-catalog/backend/src/app/api/stock/history/[variantId]/route.ts)
- Normalizar errores al envelope `success/error`
- Permitir filtro por `branchId` vía query param

#### [MODIFY] [route.ts (stock/product)](file:///Users/jfchiavi/develop/typescript-projects/whatsapp-catalog/backend/src/app/api/stock/product/[productId]/route.ts)
- Agregar `try/catch` con `handleError`

---

### 3. Backend — Permisos por sucursal

#### [MODIFY] [permissions.ts](file:///Users/jfchiavi/develop/typescript-projects/whatsapp-catalog/backend/src/lib/permissions.ts)
- BRANCH_MANAGER ya tiene `stock` — no cambia
- SELLER no tiene `stock` — no cambia
- La lógica de "solo puede ver/operar su sucursal" se implementa en las rutas de stock, no en el middleware genérico

---

### 4. Frontend — Service, hook y tipos de branches

#### [NEW] [branches.api.ts](file:///Users/jfchiavi/develop/typescript-projects/whatsapp-catalog/frontend/src/services/branches.api.ts)
- `fetchBranches()`, `fetchBranchById(id)`, `createBranch(data)`, `updateBranch(id, data)`, `deleteBranch(id)`

#### [NEW] [useBranches.ts](file:///Users/jfchiavi/develop/typescript-projects/whatsapp-catalog/frontend/src/hooks/useBranches.ts)
- `useBranches()` — lista sucursales con React Query
- `useCreateBranch()`, `useUpdateBranch()`, `useDeleteBranch()` — mutaciones

#### [MODIFY] [stock.ts (types)](file:///Users/jfchiavi/develop/typescript-projects/whatsapp-catalog/frontend/src/types/stock.ts)
- Actualizar `Branch` para que refleje el schema real (sin `stockMinThreshold`)
- Actualizar `StockByBranch` para incluir `variant`, `product`, `id` (contrato real del backend)
- Actualizar `StockMovement` para usar `type: 'ADJUST' | 'TRANSFER' | 'SALE'` y `user` en vez de `reason`/`createdBy`

---

### 5. Frontend — Stock API y hooks actualizados

#### [MODIFY] [stock.api.ts](file:///Users/jfchiavi/develop/typescript-projects/whatsapp-catalog/frontend/src/services/stock.api.ts)
- Eliminar mocks y `SEED_IDS`
- `fetchStockByBranch(branchId)` → `GET /stock/branch/:branchId`
- `fetchStockByProduct(productId)` → `GET /stock/product/:productId`
- `adjustStock({ variantId, branchId, quantity })` → `POST /stock/adjust`
- `transferStock({ variantId, fromBranchId, toBranchId, quantity })` → `POST /stock/transfer`
- `fetchStockHistory(variantId)` → `GET /stock/history/:variantId`

#### [MODIFY] [useStock.ts](file:///Users/jfchiavi/develop/typescript-projects/whatsapp-catalog/frontend/src/hooks/useStock.ts)
- `useStockByBranch(branchId)` — stock de una sucursal
- `useAdjustStock()` — mutación de ajuste
- `useTransferStock()` — mutación de transferencia
- `useStockHistory(variantId)` — historial de movimientos

---

### 6. Frontend — StockPage reescrita

#### [MODIFY] [StockPage.tsx](file:///Users/jfchiavi/develop/typescript-projects/whatsapp-catalog/frontend/src/features/stock/StockPage.tsx)
- Selector de sucursal (dropdown con `useBranches`)
- Tabla de stock por sucursal con producto, variante, SKU, atributos y cantidad
- Botón "Ajustar" → modal `AdjustStockModal` (variante, cantidad +/-)
- Botón "Transferir" → modal `TransferStockModal` (variante, sucursal destino, cantidad)
- Botón "Historial" → modal `StockHistoryModal` (variante, tabla de movimientos)
- BRANCH_MANAGER ve solo su sucursal (selector deshabilitado)

#### [NEW] [AdjustStockModal.tsx](file:///Users/jfchiavi/develop/typescript-projects/whatsapp-catalog/frontend/src/features/stock/AdjustStockModal.tsx)
- Formulario: variante (readonly), cantidad (positiva o negativa), confirmar

#### [NEW] [TransferStockModal.tsx](file:///Users/jfchiavi/develop/typescript-projects/whatsapp-catalog/frontend/src/features/stock/TransferStockModal.tsx)
- Formulario: variante (readonly), sucursal origen (readonly), sucursal destino (selector), cantidad

#### [NEW] [StockHistoryModal.tsx](file:///Users/jfchiavi/develop/typescript-projects/whatsapp-catalog/frontend/src/features/stock/StockHistoryModal.tsx)
- Tabla: fecha, tipo, origen, destino, cantidad, usuario

---

### 7. Frontend — Fix rolePermissions

#### [MODIFY] [rolePermissions.ts](file:///Users/jfchiavi/develop/typescript-projects/whatsapp-catalog/frontend/src/config/rolePermissions.ts)
- Agregar `'stock'` a `BRANCH_MANAGER`
- Agregar `'products'` a `BRANCH_MANAGER` (para ver productos en stock context, coincide con backend)

---

### 8. Backend — Tests

#### [NEW] [stock.test.ts](file:///Users/jfchiavi/develop/typescript-projects/whatsapp-catalog/backend/tests/stock.test.ts)
- Ajuste positivo: incrementa stock y crea `StockMovement`
- Ajuste negativo (stock insuficiente): rechaza y no modifica stock
- Transferencia atómica: origen baja, destino sube, movimiento creado
- Transferencia insuficiente: rechaza sin cambios parciales
- Variante/sucursal de otro tenant: rechaza con error
- Transferencia a la misma sucursal: rechaza

---

## Verification Plan

### Automated Tests
```bash
cd backend && npm run test -- tests/stock.test.ts
```

### Build Checks
```bash
cd backend && npx tsc --noEmit
cd frontend && npm run build
```

### Manual Verification
- Crear dos sucursales y asignar cantidades diferentes de la misma variante
- Verificar que al cambiar de sucursal el stock mostrado cambie
- Ejecutar una transferencia y confirmar que origen disminuye y destino aumenta
- Intentar ajustar más stock del disponible y confirmar rechazo
- Verificar que BRANCH_MANAGER solo ve su sucursal
