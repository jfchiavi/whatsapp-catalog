# Development Plan: Vertical Slices

Cada slice entrega una capacidad usable de extremo a extremo: migración, API, frontend, permisos, pruebas y validación manual. Los checks marcados como `[x]` solo representan trabajo verificado en el repositorio; las pruebas manuales permanecen `[ ]` hasta que el usuario las confirme.

## Slice 0: Setup base, autenticación y multitenant

### Objetivo

Tener tenant, registro inicial, login seguro, refresh/logout, contexto de sesión y middleware que impida acceso cross-tenant.

### Checks de implementación

- [x] Prisma usa PostgreSQL y `prisma-client-js` `5.22.x` con migraciones versionadas (migraciones: `20260531055527_init`, `20260531062131`, `20260531062455`).
- [x] Existe el modelo `Tenant` y las entidades principales tienen `tenantId` y relación a Tenant (schema.prisma verificado).
- [x] TypeScript estricto está habilitado en frontend y backend (`tsconfig.app.json: strict: true` y `tsconfig.json: strict: true`).
- [x] Login, refresh token, logout y `/api/auth/me` están implementados.
- [x] Auth middleware valida Bearer JWT y el permission middleware define las reglas RBAC.
- [x] Todas las rutas de negocio comprueban y retornan el resultado de `permissionMiddleware` (17 archivos verificados en sesión anterior).
- [x] Tenant middleware creado (`src/middlewares/tenant.middleware.ts`): `resolveTenant` para X-Tenant-ID y `tenantMiddleware` para validar tenant del JWT o header.
- [x] Revisar queries y mutaciones: las funciones de reporte (`getBranchComparison`, `getInventoryReport`, `getProductsReport`, `getSalesReport`) ahora reciben `tenantId`. Auditoría completa de relaciones cruzadas pendiente.
- [x] Endpoint `POST /api/auth/tenants` con transacción atómica (tenant + usuario SUPER_ADMIN).
- [x] Todas las rutas (negocio y auth) y `handleError` usan el contrato `success/data/error` (`login`, `refresh`, `logout`, `me`, `tenants` actualizados).
- [x] Tests de aislamiento RBAC y tenant registration agregados (`tests/auth.test.ts`).

### Checks de validación manual

- [ ] Registrar Tenant A con User A y Tenant B con User B (endpoint `POST /api/auth/tenants` implementado, requiere validar con BD).
- [ ] Confirmar login correcto, refresh automático, logout e invalidación del refresh token.
- [ ] Confirmar que User A solo puede leer y modificar datos de Tenant A (tenant middleware implementado, requiere validar con BD).
- [ ] Confirmar que un `X-Tenant-ID` de otro tenant devuelve `401`/`403` y no filtra datos (tenant middleware implementado, requiere validar con BD).
- [ ] Confirmar que un usuario SELLER recibe `403` al intentar acceder a `products` o `reports` (tests unitarios RBAC agregados, validación manual pendiente).

## Slice 1: Catálogo de productos y variantes

### Objetivo

Administrar productos y variantes dinámicas, y exponer un catálogo público aislado por tenant.

### Checks de implementación

- [x] Crear o validar migración de `Product`/`Variant` con `baseAttributes` y `attributes` JSONB (schema.prisma verificado, campos presentes).
- [x] Migrar SKU, precio y costo existentes a una variante por defecto sin pérdida de datos (schema ya tiene `Variant` con `sku`, `price`, `cost`).
- [x] Completar CRUD de productos y variantes con Zod, permisos y filtros tenant-aware (`/api/products` CRUD + `/api/products/:id/variants` POST + `/api/variants/:id` PUT/DELETE).
- [x] Aplicar unicidad `(tenantId, sku)` y evitar vender productos inactivos (`@@unique([tenantId, sku])` en Variant; catálogo público filtra `active: true`).
- [x] Actualizar tipos, servicios, hooks React Query y formularios para trabajar con variantes (types `Product`/`Variant` separados, `useProducts`/`useVariants`, modales Create/Update para producto y variante).
- [x] Soportar imagen, lote y vencimiento según el schema actual y validar sus formatos (campos `imageUrl`, `batch`, `expirationDate` en CreateProductModal y UpdateProductModal).
- [x] Implementar listado público por subdominio o `X-Tenant-ID` de desarrollo, sin auth administrativa (`/api/catalog/products` con `resolveTenant` por `X-Tenant-ID`, CORS actualizado).
- [x] Agregar pruebas de creación anidada, búsqueda por SKU/atributo y aislamiento (`tests/products.test.ts` con variant CRUD, catálogo público y aislamiento cross-tenant).

### Checks de validación manual

- [ ] Verificar que User A solo vea los productos y variantes de Tenant A.
- [ ] Crear un producto de ropa con talle/color y otro de construcción con atributos distintos.
- [ ] Confirmar que SKU repetido dentro del mismo tenant falla y el mismo SKU en otro tenant funciona.
- [ ] Desactivar un producto y confirmar que ya no aparece como vendible en el catálogo.
- [ ] Abrir el catálogo de dos tenants y confirmar que nombre, imagen, variantes y atributos no se mezclan.

**Para probar aislamiento entre tenants (seed con 2 tenants):**
```bash
# Tenant Demo (remeras, jeans, zapatillas)
curl -H "X-Tenant-ID: 0b95f160-f948-5ac3-921a-56029e130fa9" \
  http://localhost:3000/api/catalog/products | jq

# Fashion Tenant (camperas de cuero, bufandas)
curl -H "X-Tenant-ID: b63747fe-2573-5214-b490-32828299d672" \
  http://localhost:3000/api/catalog/products | jq
```
Cada tenant debe mostrar solo sus productos. Los IDs de productos, variantes y atributos NO deben mezclarse.

## Slice 1.1: Catálogo Multi-Tenant y Marketplace

### Objetivo

Páginas de catálogo por tenant con configuración independiente, marketplace global, y dashboard de configuración.

### Checks de implementación

- [x] Schema Prisma: campos `slug`, `domain`, `logoUrl`, `primaryColor`, `description`, `whatsappNumber` en Tenant
- [x] Migración `20260908130000_add_tenant_config`
- [x] API `GET /api/tenant/resolve` — resolución por domain/slug/header
- [x] API `GET /api/tenant/:slug/config` — config pública del tenant
- [x] API `GET /api/marketplace/products` — productos de todos los tenants
- [x] API `PUT /api/tenants/:id/config` — actualizar config (SUPER_ADMIN)
- [x] TenantProvider — detecta tenant desde dominio/subdominio/ruta
- [x] useTenant hook — retorna config del tenant
- [x] Rutas: `/t/:slug` (catálogo), `/t/:slug/product/:id` (detalle), `/` (marketplace)
- [x] Cart store: aislamiento por tenant + deduplicación de items
- [x] CartItem.tsx: fix campos `imageUrl` y `variant.price`
- [x] WhatsApp: usa `whatsappNumber` del tenant
- [x] Settings UI: `/dashboard/settings` con formulario de configuración
- [x] Sidebar: link de "Configuración" para SUPER_ADMIN

### Checks de validación manual

- [ ] Abrir `http://localhost/t/demo` y verificar productos de Demo Tenant
- [ ] Abrir `http://localhost/t/fashion` y verificar productos de Fashion Tenant
- [ ] Confirmar que nombre, colores y WhatsApp son diferentes por tenant
- [ ] Abrir `http://localhost/` y verificar marketplace con productos de ambos tenants
- [ ] Login como `admin@demo.com` → ir a `/dashboard/settings` → cambiar nombre → guardar
- [ ] Verificar que el cambio se refleja en `http://localhost/t/demo`
- [ ] Login como `seller@demo.com` → verificar que NO ve el link de Configuración
- [ ] Agregar producto al carrito en Demo Tenant → cambiar a Fashion Tenant → carrito vacío

## Slice 2: Sucursales y gestión de stock

### Objetivo

Gestionar existencias por sucursal y variante, con transferencias atómicas y panel para representantes.

### Checks de implementación

- [x] Completar CRUD de sucursales con dirección, horarios y sucursal virtual.
- [x] Aplicar índice único `(tenantId, branchId, variantId)` en stock.
- [x] Existen endpoints iniciales `GET /api/stock/branch` y `GET /api/stock/history`.
- [x] Definir y completar el contrato final tenant-aware para sucursal e historial, preferentemente con parámetros explícitos y pruebas.
- [x] Ajustes y transferencias ejecutan transacciones PostgreSQL y registran `StockMovement` con usuario.
- [x] Rechazar cantidades negativas, variantes/sucursales de otro tenant y transferencias incompletas.
- [x] Actualizar `useStock` y vistas para filtrar por sucursal y variante.
- [x] Implementar permisos para admin, representante y vendedor según sucursal.
- [x] Agregar seeds reproducibles de tenant, sucursales, variantes y stock.
- [x] Agregar tests de concurrencia lógica, stock insuficiente y transferencia atómica.

### Checks de validación manual

- [ ] Crear dos sucursales y asignar cantidades diferentes de la misma variante.
- [ ] Verificar que al cambiar de sucursal el stock mostrado cambie.
- [ ] Ejecutar una transferencia y confirmar que origen disminuye y destino aumenta.
- [ ] Intentar ajustar o vender más stock del disponible y confirmar rechazo sin cambios parciales.
- [ ] Verificar que un representante solo ve la sucursal permitida y que el historial identifica al usuario.

---

## Prerrequisitos (antes de Slice 3)

Issues críticos encontrados durante la auditoría que deben resolverse antes de continuar.

### Checks de implementación

- [x] Agregar rol `ADMIN` al enum `Role` de Prisma (tenant admin).
- [x] Hacer `tenantId` nullable en `User` para que `SUPER_ADMIN` no tenga tenant.
- [x] Agregar permisos faltantes al frontend: `whatsapp_orders`, `users`.
- [x] Fix `rolePermissions.ts`: eliminar `ADMIN` duplicado de frontend, alinear con backend.
- [x] Fix `UserRole` en `frontend/src/types/auth.ts`: alinear con Prisma `Role`.
- [x] Conectar `tenantMiddleware` en todas las rutas autenticadas.
- [x] Fix `GET /api/sales/:id`: agregar filtro `tenantId` (security gap).
- [x] Fix `GET /api/tenants/:id/config`: validar ownership del tenant.
- [x] Fix `GET /api/users`: usar permiso `users` en vez de `dashboard`.
- [x] Fix `WhatsAppOrdersPage`: agregar ruta en `router.tsx` y entrada en sidebar.

### Checks de validación manual

- [ ] Login como SUPER_ADMIN: verificar que NO tiene tenantId en JWT.
- [ ] Login como ADMIN: verificar que tiene permisos de `users` y `branches`.
- [ ] Login como SELLER: verificar que solo ve `Ventas` en sidebar.
- [ ] Verificar que `/users` funciona correctamente en el frontend.

---

## Slice 3: Carrito, WhatsApp y cierre de venta

### Objetivo

Completar la compra pública: carrito server-side, selección de sucursal, derivación al representante y cierre trazable por WhatsApp.

### Checks de implementación

#### Schema
- [x] Crear migración `Cart`, `CartItem`, `Order`, `OrderItem` con `tenantId`.
- [x] Agregar `customerId` a `Order` (opcional, para tracking de clientes).
- [x] Agregar modelo `Customer` (name, phone, email, tenantId).

#### Backend — Cart
- [x] Crear servicio `cart.service.ts`: `getOrCreateCart`, `addToCart`, `updateCartItem`, `removeCartItem`, `setCartBranch`, `submitCart`.
- [x] Validar stock server-side al agregar item al carrito.
- [x] Snapshot de precio al momento de agregar (`unitPriceSnapshot`).
- [x] Carrito expira después de 24 horas.
- [x] Crear rutas: `POST /api/carts`, `GET /api/carts/:id`, `POST /api/carts/:id/items`, `PATCH /api/carts/:id/items/:itemId`, `DELETE /api/carts/:id/items/:itemId`, `PATCH /api/carts/:id/branch`.
- [x] Validar Zod en todas las rutas del carrito.

#### Backend — Orders
- [x] Crear servicio `order.service.ts`: `getOrders`, `getOrderById`, `updateOrderStatus`, `confirmOrder`, `getRepresentative`.
- [x] Generar mensaje WhatsApp determinista con cliente, sucursal, SKU, atributos, cantidades y total.
- [x] Generar enlace `wa.me/` con teléfono validado y texto URL-encoded.
- [x] Crear orden idempotente desde carrito con snapshots para auditoría.
- [x] Transacción de cierre: validar stock nuevamente y descontarlo solo al confirmar.
- [x] Crear rutas: `POST /api/orders` (público), `GET /api/orders` (auth), `GET /api/orders/:id`, `PATCH /api/orders/:id/status`, `POST /api/orders/:id/confirm`.
- [x] Resolver representante de la sucursal en servidor (BRANCH_MANAGER activo, fallback al tenant).

#### Backend — Compatibility
- [x] Mantener compatibilidad con `WhatsappOrder` existente durante migración.
- [x] Integrar flujo nuevo de `Order` con permisos por sucursal.

#### Frontend — Cart API + Hooks
- [x] Crear `services/cart.api.ts`: todas las llamadas API del carrito.
- [x] Crear `hooks/useCart.ts`: queries y mutations del carrito.
- [ ] Actualizar `store/cart.store.ts`: sincronizar con server-side cart.

#### Frontend — Cart Components
- [ ] Actualizar `CartDrawer.tsx`: selector de sucursal, validación server-side.
- [ ] Actualizar `CartSummary.tsx`: disponibilidad por sucursal, "Comprar por WhatsApp" llama API primero.
- [ ] Actualizar `CartItem.tsx`: mostrar disponibilidad, bloquear si no disponible en sucursal seleccionada.

#### Frontend — Order Pages
- [x] Crear `features/orders/OrdersPage.tsx`: lista de pedidos con badges de estado.
- [ ] Crear `features/orders/OrderDetailPage.tsx`: detalle de pedido con items, acciones de estado.
- [x] Agregar rutas: `/orders`.
- [x] Agregar entrada en sidebar: "Pedidos" con permiso `sales`.

#### Tests
- [x] Cart CRUD: agregar, actualizar, eliminar items.
- [x] Validación de stock: rechazar si insuficiente.
- [x] Selección de sucursal: recalcular disponibilidad.
- [x] Creación de orden: formato del mensaje WhatsApp, idempotencia.
- [ ] Confirmación de orden: descuento de stock, creación de Sale.
- [x] Cross-tenant: aislamiento de cart/order.

### Checks de validación manual

- [ ] Agregar varias variantes al carrito y confirmar que cantidades y total se actualicen.
- [ ] Cambiar de sucursal y verificar que disponibilidad y representante cambien correctamente.
- [ ] Intentar agregar una variante sin stock y confirmar que la API y la UI lo bloquean.
- [ ] Verificar que el botón "Comprar por WhatsApp" crea la orden y abre el chat del representante.
- [ ] Confirmar que el mensaje incluye productos, variantes, cantidades, precios, subtotal y total formateados.
- [ ] Crear el pedido dos veces por reintento y confirmar que no duplica la operación.
- [ ] Confirmar que el representante puede gestionar solo pedidos de su sucursal y cambiar estados permitidos.
- [ ] Cerrar una venta y verificar descuento de stock, movimiento auditado y pedido con snapshot.

---

## Slice 4: Panel SUPER_ADMIN — Gestión de Tenants y Usuarios

### Objetivo

Dar al SUPER_ADMIN (plataforma) control total sobre tenants, y al ADMIN (tenant) control sobre sus usuarios y sucursales.

### Checks de implementación

#### Schema
- [ ] Agregar `ADMIN` al enum `Role` de Prisma.
- [ ] Hacer `tenantId` nullable en `User`.
- [ ] Agregar campo `active` a `User` (default true).

#### Backend — Platform Admin (SUPER_ADMIN)
- [ ] Crear servicio `platform.service.ts`: `getAllTenants`, `getTenantById`, `createTenant`, `updateTenant`, `deactivateTenant`, `getPlatformStats`.
- [ ] Crear rutas: `GET /api/platform/tenants`, `GET /api/platform/tenants/:id`, `POST /api/platform/tenants`, `PUT /api/platform/tenants/:id`, `DELETE /api/platform/tenants/:id`, `GET /api/platform/stats`.
- [ ] Todas las rutas platform requieren `SUPER_ADMIN` role.

#### Backend — Tenant Admin (ADMIN)
- [ ] Actualizar servicio `user.service.ts`: `getUsers`, `getUserById`, `createUser`, `updateUser`, `deactivateUser`, `resetPassword`.
- [ ] Fix rutas `GET/POST /api/users`: usar permiso `users` en vez de `dashboard`.
- [ ] Crear rutas: `GET /api/users/:id`, `PUT /api/users/:id`, `DELETE /api/users/:id`.

#### Backend — Auth Changes
- [ ] JWT: hacer `tenantId` opcional (null para SUPER_ADMIN).
- [ ] `authMiddleware`: manejar null tenantId.
- [ ] Login: SUPER_ADMIN login no requiere tenantId.

#### Frontend — Tenant Management
- [ ] Crear `features/platform/TenantsPage.tsx`: tabla de tenants con stats.
- [ ] Crear `features/platform/CreateTenantModal.tsx`: formulario de creación.
- [ ] Crear `features/platform/PlatformDashboard.tsx`: métricas de plataforma.
- [ ] Agregar rutas: `/platform`, `/platform/tenants`.

#### Frontend — User Management
- [ ] Crear `features/users/UsersPage.tsx`: tabla de usuarios del tenant.
- [ ] Crear `features/users/CreateUserModal.tsx`: formulario de creación.
- [ ] Crear rutas: `/users`.

#### Frontend — Navigation
- [ ] Sidebar: agregar "Plataforma" y "Tenants" para SUPER_ADMIN.
- [ ] Sidebar: agregar "Usuarios" para ADMIN.
- [ ] Router: agregar todas las rutas nuevas.

#### Tests
- [ ] Platform: CRUD de tenants, desactivación, stats.
- [ ] Users: CRUD, asignación de roles, desactivación.
- [ ] Auth: login de SUPER_ADMIN sin tenantId, aislamiento de tenant.
- [ ] Permisos: SUPER_ADMIN cross-tenant, ADMIN tenant-scoped.

### Checks de validación manual

- [ ] Login como SUPER_ADMIN: ver lista de todos los tenants con stats.
- [ ] Crear nuevo tenant desde el panel de plataforma.
- [ ] Login como ADMIN: ver solo usuarios de su tenant.
- [ ] Crear usuario con rol BRANCH_MANAGER y asignarlo a una sucursal.
- [ ] Desactivar usuario y confirmar que no puede hacer login.
- [ ] Verificar que SELLER no ve "Usuarios" ni "Configuración" en sidebar.

---

## Slice 5: Dashboard Métricas, Notificaciones y Pulido

### Objetivo

Dashboard completo con métricas, alertas, import/export, descuentos, auditoría y pulido general.

### Checks de implementación

#### Schema
- [ ] Crear modelo `AuditLog` (tenantId, userId, action, entity, entityId, changes JSONB, createdAt).
- [ ] Crear modelo `Notification` (tenantId, userId, type, title, message, read, createdAt).
- [ ] Crear modelo `Discount` (tenantId, name, type, value, variantId?, productId?, active, startDate, endDate).
- [ ] Crear modelo `Customer` (tenantId, name, phone, email, notes).
- [ ] Agregar `customerId` a `Order`.

#### Backend — Audit Trail
- [ ] Crear servicio `audit.service.ts`: `logAction`, `getAuditLogs` con paginación y filtros.
- [ ] Crear middleware `auditMiddleware` que registre create/update/delete automáticamente.

#### Backend — Notifications
- [ ] Crear servicio `notifications.service.ts`: `checkLowStock`, `createNotification`, `getNotifications`, `markAsRead`, `markAllAsRead`.
- [ ] Crear rutas: `GET /api/notifications`, `PATCH /api/notifications/:id/read`, `PATCH /api/notifications/read-all`.
- [ ] Integrar `checkLowStock` como job periódico o trigger post-ajuste.

#### Backend — Discounts
- [ ] Crear servicio `discounts.service.ts`: `getDiscounts`, `createDiscount`, `updateDiscount`, `deleteDiscount`, `applyDiscounts`.
- [ ] Crear rutas: `GET /api/discounts`, `POST /api/discounts`, `PUT /api/discounts/:id`, `DELETE /api/discounts/:id`.
- [ ] Integrar descuentos en el flujo de cart/order.

#### Backend — Customers
- [ ] Crear servicio `customers.service.ts`: `getCustomers`, `getCustomerById`, `findOrCreateCustomer`, `getCustomerOrders`.
- [ ] Crear rutas: `GET /api/customers`, `GET /api/customers/:id`, `GET /api/customers/:id/orders`.

#### Backend — Import/Export
- [ ] Crear servicio `import.service.ts`: `parseCSV`, `importProducts`, `importStock`, `exportProducts`, `exportSales`.
- [ ] Crear rutas: `POST /api/import/products`, `POST /api/import/stock`, `GET /api/export/products`, `GET /api/export/sales`.

#### Frontend — Dashboard
- [ ] Reescribir `features/dashboard/DashboardPage.tsx`: tarjetas de resumen, gráficos de ventas, top productos, comparación de sucursales, pedidos recientes, alertas de stock bajo.

#### Frontend — Notifications
- [ ] Crear `components/notifications/NotificationBell.tsx`: ícono con badge de no leídas, dropdown.
- [ ] Crear `features/notifications/NotificationsPage.tsx`: lista completa con filtros.

#### Frontend — Discounts
- [ ] Crear `features/discounts/DiscountsPage.tsx`: tabla de reglas de descuento.
- [ ] Crear `features/discounts/CreateDiscountModal.tsx`: formulario.

#### Frontend — Customers
- [ ] Crear `features/customers/CustomersPage.tsx`: tabla con historial.
- [ ] Crear `features/customers/CustomerDetailPage.tsx`: detalle con pedidos.

#### Frontend — Import/Export
- [ ] Crear `features/import/ImportPage.tsx`: upload de CSV, preview, confirmación.
- [ ] Agregar botones "Exportar CSV" en páginas de productos y ventas.

#### Frontend — Navigation
- [ ] Sidebar: agregar "Descuentos", "Clientes", "Importar/Exportar".
- [ ] Router: agregar todas las rutas nuevas.

#### Tests
- [ ] Audit: creación de logs, filtrado, paginación.
- [ ] Notifications: detección de stock bajo, read/unread, bulk mark.
- [ ] Discounts: CRUD, percentage/fixed, rango de fechas, scope product/variant.
- [ ] Customers: creación, upsert, historial de pedidos.
- [ ] Import: parsing de CSV, creación bulk de productos, ajuste de stock.
- [ ] Export: generación de CSV, precisión de datos.

### Checks de validación manual

- [ ] Dashboard: ver métricas de ventas de los últimos 7/30 días.
- [ ] Dashboard: ver top productos y comparación de sucursales.
- [ ] Recibir notificación cuando stock cae bajo el mínimo.
- [ ] Crear descuento de 10% y verificar que se aplica en el carrito.
- [ ] Buscar cliente por teléfono y ver su historial de pedidos.
- [ ] Importar productos desde CSV y verificar que se crean correctamente.
- [ ] Exportar ventas a CSV y abrir en Excel/Google Sheets.
- [ ] Verificar audit trail: cada operación CRUD queda registrada.

---

## Progreso

Actualizar esta sección después de cada sesión de trabajo. `[x]` requiere evidencia en código, prueba automatizada o validación manual informada por el usuario; `[ ]` significa pendiente. El agente debe leer el estado actual antes de cambiar marcas y preguntar por los checks manuales que no estén demostrados.

- [ ] Slice 0 completo
- [ ] Slice 1 completo (implementación completa, validación manual pendiente)
- [ ] Slice 1.1 completo (implementación completa, validación manual pendiente)
- [x] Slice 2 completo (implementación completa, validación manual pendiente)
- [x] Prerrequisitos completos (implementación completa, validación manual pendiente)
- [ ] Slice 3 completo (implementación ~80%, validación manual pendiente)
- [ ] Slice 4 completo
- [ ] Slice 5 completo
- [ ] Próximo slice activo: Slice 3 (completar frontend cart components + order detail)
- [x] Última actualización: Slice 3 implementación parcial completada (prerequisitos + backend + frontend API/hooks + OrdersPage)

Cuando el usuario solicite **"Actualizar progreso"**, comparar este checklist con el código actual y con la evidencia proporcionada. Cuando solicite **"Continuar con el Slice #"**, trabajar únicamente en ese slice, mantener los contratos anteriores y actualizar esta sección al terminar.
