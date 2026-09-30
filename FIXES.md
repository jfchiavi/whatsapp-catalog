# Fixes Pendientes

## Análisis de Issues

| # | Issue | Causa raíz | Tipo |
|---|-------|-----------|------|
| 1 | Sales ZodError `branchId: null` | Zod `.optional()` rechaza `null`, frontend envía `null` cuando el usuario no tiene branch asignado | Bug |
| 2 | Users solo muestra admin demo | `requireTenantId('')` lanza error para SUPER_ADMIN (JWT tiene string vacío), `getUsers` siempre filtra por tenantId | Bug |
| 3 | Orders página vacía | Mismo raíz que #2: SUPER_ADMIN tiene tenantId vacío, la query no retorna nada. Decisión: ocultar del sidebar para SUPER_ADMIN | Bug |
| 4 | Diferencia Orders vs WhatsApp Orders | `WhatsappOrder` = modelo legacy (mensaje crudo de WhatsApp), `Order` = nuevo modelo (carrito → checkout → orden). Son flujos distintos | Documentación |
| 5 | Settings debería mostrar lista de tenants | Página actual es single-tenant, los componentes de plataforma ya existen en `/platform/tenants`. Decisión: reemplazar contenido de `/dashboard/settings` | Rediseño |
| 6 | Stock 403 para ADMIN | Guard en `stock/branch/[id]` usa `!== 'SUPER_ADMIN'` que bloquea a ADMIN. Otros endpoints de stock usan `=== 'BRANCH_MANAGER'` correctamente | Bug |
| 7 | Sales tabla fecha inválida + sin vendedor | Frontend usa campos `date` y `sellerId` que no existen en la respuesta del API (Prisma usa `createdAt` y `userId` con relación `user`) | Bug |
| 8 | WhatsApp orders PUT 404 | Frontend llama `PUT /whatsapp/orders/:id`, endpoint real es `PUT /whatsapp/orders/:id/status` | Bug |

---

## Fix 1: WhatsApp orders PUT 404

### Problema
Al procesar un pedido en la pantalla Pedidos WhatsApp, la request PUT falla con 404.

### Causa
El frontend en `frontend/src/services/whatsapp.api.ts:35` llama:
```ts
return api.put(`/whatsapp/orders/${id}`, { status });
```
Pero el endpoint del backend está en `backend/src/app/api/whatsapp/orders/[id]/status/route.ts`, no en `[id]/route.ts`. No existe archivo `route.ts` en `[id]/`, solo en `[id]/status/`.

### Fix
**Archivo:** `frontend/src/services/whatsapp.api.ts:35`
```ts
// Antes:
return api.put(`/whatsapp/orders/${id}`, { status });

// Después:
return api.put(`/whatsapp/orders/${id}/status`, { status });
```

---

## Fix 2: Stock 403 para ADMIN

### Problema
Al seleccionar una sucursal en la pantalla de stock, el endpoint `GET /api/stock/branch/:branchId` retorna 403 Forbidden para usuario ADMIN.

### Causa
En `backend/src/app/api/stock/branch/[branchId]/route.ts:21`, el guard es:
```ts
if (auth.role !== 'SUPER_ADMIN' && auth.branchId !== branchId) {
```
Esto bloquea a ADMIN porque `ADMIN !== 'SUPER_ADMIN'` es `true`, y si el admin no tiene branchId asignado, la condición completa es `true` → 403.

Todos los demás endpoints de stock usan el guard correcto:
```ts
if (auth.role === 'BRANCH_MANAGER' && auth.branchId !== branchId) {
```
Solo BRANCH_MANAGER está restringido a su propia sucursal. ADMIN puede ver todas.

### Fix
**Archivo:** `backend/src/app/api/stock/branch/[branchId]/route.ts:21`
```ts
// Antes:
if (auth.role !== 'SUPER_ADMIN' && auth.branchId !== branchId) {

// Después:
if (auth.role === 'BRANCH_MANAGER' && auth.branchId !== branchId) {
```

---

## Fix 3: Sales tabla fecha inválida + sin vendedor

### Problema
La tabla de ventas muestra "Invalid Date" en la columna de fecha y la columna Vendedor está vacía.

### Causa
El tipo `Sale` en `frontend/src/types/sales.ts` usa campos que no existen en la respuesta del API:
- `date` → Prisma retorna `createdAt` (el modelo Sale no tiene campo `date`)
- `sellerId` → Prisma retorna `userId` con relación `user` (no `sellerId`)

En tiempo de ejecución, `sale.date` es `undefined` → `new Date(undefined)` → `Invalid Date`. Y `sale.seller` es `undefined` porque la propiedad se llama `user`.

### Fix
**Archivo 1:** `frontend/src/types/sales.ts` — Actualizar tipo `Sale`:
```ts
// Antes:
date: string;
sellerId: string;

// Después:
createdAt: string;
userId: string;
user?: { id: string; name: string; email?: string };
branch?: { id: string; name: string };
```

**Archivo 2:** `frontend/src/features/sales/SalesListPage.tsx` — Actualizar referencias:
```ts
// Línea 54 - Antes:
{new Date(sale.date).toLocaleDateString()}
// Después:
{new Date(sale.createdAt).toLocaleDateString()}

// Línea 57 - Antes:
{sale.seller?.name ?? sale.sellerId}
// Después:
{sale.user?.name ?? sale.userId}
```

---

## Fix 4: Sales ZodError branchId null

### Problema
Al confirmar una venta con SUPER_ADMIN o ADMIN (usuarios sin branchId asignado), el backend retorna 400 con ZodError: "expected string, received null" en `branchId`.

### Causa
El schema Zod en `backend/src/validators/sale.schema.ts:4` define:
```ts
branchId: z.string().uuid().optional(),
```
`.optional()` acepta `string | undefined` pero **no** `null`. El frontend en `CreateSalePage.tsx:82` envía `branchId: user!.branchId!` que es `null` en runtime para SUPER_ADMIN/ADMIN.

### Fix
**Archivo 1:** `backend/src/validators/sale.schema.ts:4`
```ts
// Antes:
branchId: z.string().uuid().optional(),

// Después:
branchId: z.string().uuid().nullish(),
```
`.nullish()` acepta `string | null | undefined`. La lógica de negocio en el route handler ya valida que se proporcione un branchId antes de crear la venta.

**Archivo 2:** `frontend/src/features/sales/CreateSalePage.tsx:82`
```ts
// Antes:
branchId: user!.branchId!,

// Después:
...(user!.branchId ? { branchId: user!.branchId } : {}),
```
No enviar `branchId` cuando es `null`. El backend recibe el campo ausente (undefined) y maneja la validación.

---

## Fix 5: Login JWT null tenantId

### Problema
El JWT de SUPER_ADMIN contiene `tenantId: ''` (string vacío) en lugar de `null`. Esto causa que `requireTenantId('')` lance error, bloqueando a SUPER_ADMIN de endpoints como `/api/users`.

### Causa
En `backend/src/app/api/auth/login/route.ts:53`:
```ts
tenantId: user.tenantId ?? '',
```
Convierte `null` a `''` (empty string). Luego `requireTenantId('')` falla porque `!''` es `true`.

### Fix
**Archivo:** `backend/src/app/api/auth/login/route.ts:53`
```ts
// Antes:
tenantId: user.tenantId ?? '',

// Después:
tenantId: user.tenantId ?? null,
```
El JWT ahora carry `null` para SUPER_ADMIN. `requireTenantId(null)` lanza error (correcto para rutas de negocio), pero las rutas que necesitan soporte para SUPER_ADMIN pueden manejar `null` explícitamente.

---

## Fix 6: Users endpoint para SUPER_ADMIN

### Problema
La pantalla de usuarios solo muestra el admin demo cuando se ingresa con SUPER_ADMIN. No se listan todos los usuarios de la plataforma.

### Causa
Dos problemas encadenados:
1. `requireTenantId(auth.tenantId)` lanza error para SUPER_ADMIN (tiene `null` o `''` en el JWT)
2. `getUsers()` siempre filtra por `tenantId`, así que incluso si el SUPER_ADMIN tuviera un tenantId, solo vería usuarios de ese tenant

### Fix
**Archivo 1:** `backend/src/modules/users/user.service.ts` — Hacer `tenantId` opcional:
```ts
// Antes:
export const getUsers = async (
  tenantId: string,
  role?: Role,
  branchId?: string | null
) => {
  const where: { tenantId: string; role?: Role; branchId?: string | null } = { tenantId };

// Después:
export const getUsers = async (
  tenantId: string | null,
  role?: Role,
  branchId?: string | null
) => {
  const where: { tenantId?: string; role?: Role; branchId?: string | null } = {};
  if (tenantId) {
    where.tenantId = tenantId;
  }
```
Cuando `tenantId` es `null` (SUPER_ADMIN), no se agrega el filtro → retorna todos los usuarios.

**Archivo 2:** `backend/src/app/api/users/route.ts:20` — Skip requireTenantId para SUPER_ADMIN:
```ts
// Antes:
const users = await getUsers(requireTenantId(auth.tenantId), auth.role, branchId);

// Después:
const tenantId = auth.role === 'SUPER_ADMIN' ? (auth.tenantId || null) : requireTenantId(auth.tenantId);
const users = await getUsers(tenantId, auth.role, branchId);
```

---

## Fix 7: Ocultar Pedidos del sidebar para SUPER_ADMIN

### Problema
La pantalla Pedidos está vacía para SUPER_ADMIN porque no tiene tenantId y los pedidos son tenant-scoped. No tiene sentido que SUPER_ADMIN vea esta opción.

### Causa
El sidebar en `frontend/src/config/sidebar.config.ts` muestra "Pedidos" basado en el permiso `sales`. SUPER_ADMIN tiene el permiso `sales` en `rolePermissions.ts`, pero la página no le sirve porque los pedidos son por tenant.

### Fix
**Archivo:** `frontend/src/config/sidebar.config.ts`
- Cambiar el permiso de "Pedidos" de `sales` a un permiso que solo tengan ADMIN/BRANCH_MANAGER/SELLER, o
- Agregar un campo `minRole` o `excludeRoles` al sidebar item
- Opción más simple: cambiar el permiso a un valor que excluya SUPER_ADMIN, o usar la lógica existente de `RoleBasedRender`

Verificar primero si SUPER_ADMIN tiene el permiso `sales` en `frontend/src/config/rolePermissions.ts`. Si lo tiene, se puede crear un permiso específico o usar `excludeRoles`.

---

## Fix 8: Settings = lista de tenants

### Problema
La pantalla `/dashboard/settings` muestra un formulario de configuración de un solo tenant. Se espera que muestre una lista de todos los tenants con botones de editar/crear.

### Causa
`TenantSettingsPage.tsx` usa `tenants.api.ts` (servicio de tenant individual) en vez de `platform.api.ts` (servicio de plataforma). Los componentes de lista de tenants ya existen en `features/platform/TenantsPage.tsx` y `features/platform/CreateTenantModal.tsx`.

### Fix
**Archivo:** `frontend/src/features/settings/TenantSettingsPage.tsx` — Reemplazar contenido:
- Importar hooks `useTenants`, `useDeleteTenant` de `hooks/useTenants`
- Importar `CreateTenantModal` de `features/platform/CreateTenantModal`
- Renderizar tabla de tenants (misma estructura que `TenantsPage.tsx`)
- Incluir modal de creación/edición
- Mantener la ruta `/dashboard/settings` funcionando

La ruta existente `/platform/tenants` puede redirigir a `/dashboard/settings` o mantenerse como alternativa.

---

## Documentación: Orders vs WhatsApp Orders

### Pedidos (Orders - Modelo nuevo, Slice 3)
**Flujo:** Cliente → Catálogo público → Agrega al carrito → Selecciona sucursal → Completa nombre/teléfono → "Comprar por WhatsApp" → Se crea `Order` en BD + se abre WhatsApp con mensaje pre-armado → El vendedor recibe el mensaje, confirma, y gestiona el pedido desde la pantalla Pedidos.

**Tabla:** `Order` con `customerName`, `customerPhone`, `status` (pending → contacted → confirmed → completed), `totalSnapshot`, `whatsappUrl`.

### Pedidos WhatsApp (WhatsappOrder - Modelo legacy)
**Flujo:** Cliente envía mensaje directo a WhatsApp del tenant → El sistema almacena el mensaje crudo en `WhatsappOrder` → El vendedor procesa manualmente desde la pantalla Pedidos WhatsApp.

**Tabla:** `WhatsappOrder` con `customerName`, `customerPhone`, `message` (texto crudo), `status`, `total`.

### Diferencia clave
- **Orders** = flujo estructurado con carrito, stock validado, y cierre atómico
- **WhatsApp Orders** = captura de mensajes de WhatsApp sin estructura previa

---

## Resumen de archivos a modificar

| Fix | Archivos |
|-----|----------|
| 1 | `frontend/src/services/whatsapp.api.ts` |
| 2 | `backend/src/app/api/stock/branch/[branchId]/route.ts` |
| 3 | `frontend/src/types/sales.ts`, `frontend/src/features/sales/SalesListPage.tsx` |
| 4 | `backend/src/validators/sale.schema.ts`, `frontend/src/features/sales/CreateSalePage.tsx` |
| 5 | `backend/src/app/api/auth/login/route.ts` |
| 6 | `backend/src/modules/users/user.service.ts`, `backend/src/app/api/users/route.ts` |
| 7 | `frontend/src/config/sidebar.config.ts` |
| 8 | `frontend/src/features/settings/TenantSettingsPage.tsx` |
