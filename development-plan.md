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
- [x] Rutas públicas iniciales de tenant y marketplace; separación por intención de ruta/domain detallada en Slice 1.2
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

## Slice 1.2: Portada pública del tenant

### Objetivo

Mostrar una portada propia al entrar a `/t/:slug`, con navegación clara al catálogo, conservando marketplace, detalle de producto y flujo actual del carrito. Esta primera fase usa únicamente la configuración y los productos públicos existentes; no incluye CMS ni contenido editorial inventado.

### Checks de implementación

- [x] Mover el catálogo existente a `/t/:slug/catalogo` sin rehacer su búsqueda, filtros ni tarjetas.
- [x] Crear portada pública para `/t/:slug` con identidad del tenant, descripción disponible, conteo de productos activos y CTA al catálogo.
- [x] Mostrar hasta tres productos reales del tenant en la portada, con estado de error/vacío y componentes de tarjeta existentes.
- [x] Actualizar el header público con marca y navegación Inicio/Catálogo cuando se está dentro de un tenant.
- [x] Mantener `/` como marketplace y conservar `/t/:slug/product/:id`.
- [x] Resolver `/` como portada cuando el host corresponde a un tenant y como marketplace cuando no se resuelve tenant; en dominio tenant, usar `/catalogo` y `/product/:id`.
- [x] Actualizar el retorno desde el detalle para volver al catálogo.
- [ ] Agregar pruebas automatizadas de rutas y navegación tenant; el frontend no tiene actualmente una suite de pruebas configurada.
- [x] Validación estática: `cd frontend && npm run build` y ESLint focalizado de los archivos modificados.

### Checks de validación manual

- [ ] Abrir `/t/demo` y confirmar que aparece la portada, no la grilla del catálogo.
- [ ] Abrir `/t/demo/catalogo` y comprobar búsqueda, filtros, ordenamiento y acceso a productos.
- [ ] Abrir un detalle desde catálogo y confirmar que el retorno lleva a `/t/demo/catalogo`.
- [ ] Repetir con dos tenants y comprobar que marca y productos no se mezclan.
- [ ] Agregar un producto al carrito desde catálogo/detalle y confirmar que el flujo sigue funcionando.
- [ ] Confirmar que `/` continúa mostrando el marketplace global.

## Slice 1.3: Gestión MVP de portada (Fase 2)

### Objetivo

Permitir que el ADMIN edite el rubro y el hero de su propia portada como borrador, lo previsualice y publique. La tienda pública consume únicamente la versión publicada; los tenants sin publicación conservan el fallback existente.

### Checks de implementación

- [x] Crear `TenantHomePage` tenant-scoped con contenido JSON draft/published, timestamps e índice único por tenant.
- [x] Crear y aplicar migración `20261018090000_add_tenant_home_page`; restaurar aditivamente metadatos faltantes del historial legacy de `_prisma_migrations` sin resetear la base.
- [x] Validar versión del contenido, rubro, campos del hero y URL HTTP/HTTPS con Zod.
- [x] Crear API autenticada para obtener/guardar borrador; derivar tenant del JWT y no aceptar `tenantId` en el payload.
- [x] Crear API de publicación que copia el draft validado a published dentro de transacción.
- [x] Crear API pública por slug que devuelve solo contenido publicado de tenants activos.
- [x] Agregar permiso `storefront` solo a ADMIN tenant; no habilitar administración global de tenants.
- [x] Ampliar contenido a `version: 2` con normalización transparente del contenido v1 ya existente.
- [x] Agregar secciones ordenables y habilitables: hero, categorías basadas en facetas reales, destacados, promoción con vigencia, beneficios y contacto.
- [x] Validar en backend que categorías y productos destacados existan y pertenezcan al tenant; rechazar destacados inactivos.
- [x] Renderizar secciones publicadas y usar el mismo renderer en la vista previa del editor.
- [x] Hacer que las categorías enlacen al catálogo mediante parámetros `attributeKey`/`attributeValue`.
- [x] Guardar historial inmutable de publicaciones con número de revisión; backfill de publicación actual a revisión inicial.
- [x] Listar historial y restaurar una versión anterior únicamente al borrador; para hacerla pública se requiere publicar.
- [x] Pruebas focalizadas de compatibilidad v1→v2, draft/publicación, aislamiento, validación de fechas, referencias cross-tenant y restore-to-draft (5 pruebas pasan).
- [x] Build de backend Next.js, frontend Vite/TypeScript, lint focalizado y `prisma migrate status` sincronizado.
- [ ] Carga/almacenamiento de imágenes propio: el MVP acepta URL HTTP/HTTPS; implementar storage gestionado en una fase posterior.
- [ ] Agregar pruebas automatizadas del componente/editor y el recorrido end-to-end de preview/publicación en navegador.

### Fuera de alcance pendiente

- [ ] Carga de archivos e integración con almacenamiento gestionado/CDN.
- [ ] Taxonomía explícita de categorías propia del tenant (las categorías actuales son enlaces basados en facetas verificadas de productos).

## Trabajo final del sistema (posterior a los slices funcionales)

No es requisito de la etapa actual. Abordar cuando catálogo, pedidos, administración y storefront estén funcionalmente completos y validados.

- [ ] SEO configurable por tenant: title, description, imagen social, canonical y datos estructurados.
- [ ] Analítica avanzada y atribución de conversiones; las métricas operativas básicas de la portada se adelantan al Slice 1.4.

### Decisiones para la fase final

- Canonical y sitemap deben apuntar al host público canónico del tenant; evitar indexar como duplicados las rutas por slug, subdominio y dominio propio.
- Metadatos sociales e imágenes deben proceder de contenido publicado y con permisos de uso; nunca revelar datos del borrador.
- JSON-LD se seleccionará por tipo de tienda y solo incluirá ofertas, precios, disponibilidad, dirección y horarios respaldados por datos vigentes.
- Definir política de consentimiento, aviso de privacidad, retención y eliminación de datos antes de introducir analítica identificable o cookies no esenciales.
- La atribución avanzada debe diferenciar clic, pedido iniciado, pedido confirmado y venta; no inferir una conversión de un simple clic.
- Métricas agregadas deben conservar `tenantId` en cada consulta y no permitir consultas cross-tenant salvo rol/plataforma con permiso auditado.
- Definir zona horaria de reportes, exclusión de bots, límites de frecuencia y estrategia de migración/retención antes de ampliar el esquema de métricas.

## Slice 1.4: Métricas básicas de storefront

### Objetivo

Dar al ADMIN una lectura sencilla de la actividad de la portada para orientar las siguientes iteraciones del storefront. Son conteos agregados diarios y no representan usuarios únicos ni conversiones comerciales.

### Checks de implementación

- [x] Agregar buckets diarios tenant-scoped por evento y destino, con upsert atómico e índice único.
- [x] Registrar vistas de portada, clics a catálogo/categorías/productos destacados y WhatsApp sin IP, sesión, cookies ni datos de contacto.
- [x] Validar eventos mediante enum cerrado; validar productos destacados activos del tenant y categorías de la publicación actual.
- [x] Agregar consulta administrativa por rango máximo de 90 días, derivando tenant exclusivamente del JWT.
- [x] Mostrar en `/dashboard/storefront` totales de 7/30/90 días.
- [x] Tests de agregación diaria y aislamiento entre tenants (suite storefront: 5 pruebas pasan).
- [ ] Añadir rate limiting o protección antiabuso para el endpoint público antes de despliegues de alto tráfico.
- [x] Migración `20261020100000_add_storefront_daily_metrics` aplicada; builds frontend/backend y lint focalizado correctos.

### Interpretación y límites

- Los datos son eventos/acciones, no personas; repetición de una acción cuenta varias veces.
- `HOME_VIEW` es una vista de ruta (deduplicada en el montaje normal del componente), no una sesión ni un visitante único.
- `CATALOG_CLICK`, `CATEGORY_CLICK`, `FEATURED_PRODUCT_CLICK` y `WHATSAPP_CLICK` son interacciones, no pedidos ni ventas confirmadas.
- Los buckets usan fecha UTC; cualquier reporte en hora local debe convertir límites de fecha de forma explícita.

### Checks de validación manual

- [ ] Generar algunas vistas/clics desde dos tenants y verificar totales separados en el panel.
- [ ] Cambiar 7/30/90 días y verificar que los rangos y resultados cambien correctamente.
- [ ] Confirmar que un ADMIN no puede leer métricas de otro tenant.
- [ ] Verificar en Docker que eventos y panel están activos tras reconstruir backend y frontend.

### Checks de validación manual

- [ ] Login como ADMIN de Tenant A → editar rubro/hero, guardar borrador y confirmar que visitante aún ve lo publicado.
- [ ] Previsualizar borrador y publicarlo; confirmar cambio en portada pública.
- [ ] Intentar editar/publicar Tenant B con credenciales de Tenant A y confirmar `403`.
- [ ] Confirmar que un tenant sin publicación sigue usando el fallback.
- [ ] Verificar el editor y la portada con dos tenants en Docker después de reconstruir backend y frontend.

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
- [x] Actualizar `store/cart.store.ts`: sincronizar con server-side cart.

#### Frontend — Cart Components
- [x] Actualizar `CartDrawer.tsx`: selector de sucursal, validación server-side.
- [x] Actualizar `CartSummary.tsx`: disponibilidad por sucursal, "Comprar por WhatsApp" llama API primero.
- [x] Actualizar `CartItem.tsx`: mostrar disponibilidad, bloquear si no disponible en sucursal seleccionada.

#### Frontend — Order Pages
- [x] Crear `features/orders/OrdersPage.tsx`: lista de pedidos con badges de estado.
- [x] Crear `features/orders/OrderDetailPage.tsx`: detalle de pedido con items, acciones de estado.
- [x] Agregar rutas: `/orders`.
- [x] Agregar entrada en sidebar: "Pedidos" con permiso `sales`.

#### Tests
- [x] Cart CRUD: agregar, actualizar, eliminar items.
- [x] Validación de stock: rechazar si insuficiente.
- [x] Selección de sucursal: recalcular disponibilidad.
- [x] Creación de orden: formato del mensaje WhatsApp, idempotencia.
- [x] Confirmación de orden: descuento de stock, creación de Sale.
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
- [x] Agregar `ADMIN` al enum `Role` de Prisma.
- [x] Hacer `tenantId` nullable en `User`.
- [x] Agregar campo `active` a `User` (default true).

#### Backend — Platform Admin (SUPER_ADMIN)
- [x] Crear servicio `platform.service.ts`: `getAllTenants`, `getTenantById`, `createTenant`, `updateTenant`, `deactivateTenant`, `getPlatformStats`.
- [x] Crear rutas: `GET /api/platform/tenants`, `GET /api/platform/tenants/:id`, `POST /api/platform/tenants`, `PUT /api/platform/tenants/:id`, `DELETE /api/platform/tenants/:id`, `GET /api/platform/stats`.
- [x] Todas las rutas platform requieren `SUPER_ADMIN` role.

#### Backend — Tenant Admin (ADMIN)
- [x] Actualizar servicio `user.service.ts`: `getUsers`, `getUserById`, `createUser`, `updateUser`, `deactivateUser`.
- [x] Fix rutas `GET/POST /api/users`: usar permiso `users` en vez de `dashboard`.
- [x] Crear rutas: `GET /api/users/:id`, `PUT /api/users/:id`, `DELETE /api/users/:id`.

#### Backend — Auth Changes
- [x] JWT: hacer `tenantId` opcional (null para SUPER_ADMIN).
- [x] `authMiddleware`: manejar null tenantId.
- [x] `/api/auth/me`: retorna `tenantId` en la respuesta.

#### Frontend — Tenant Management
- [x] Crear `features/platform/TenantsPage.tsx`: tabla de tenants con stats.
- [x] Crear `features/platform/CreateTenantModal.tsx`: formulario de creación/edición.
- [x] Crear `features/platform/PlatformDashboard.tsx`: métricas de plataforma.
- [x] Agregar rutas: `/platform`, `/platform/tenants`.

#### Frontend — User Management
- [x] Crear `features/users/UsersPage.tsx`: tabla de usuarios del tenant.
- [x] Crear `features/users/CreateUserModal.tsx`: formulario de creación.
- [x] Agregar rutas: `/users`.

#### Frontend — Navigation
- [x] Sidebar: agregar "Plataforma" y "Tenants" para SUPER_ADMIN.
- [x] Sidebar: agregar "Usuarios" para ADMIN.
- [x] Router: agregar todas las rutas nuevas.

#### Tests
- [x] Platform: CRUD de tenants, desactivación, stats.
- [ ] Users: CRUD, asignación de roles, desactivación.
- [ ] Auth: login de SUPER_ADMIN sin tenantId, aislamiento de tenant.
- [x] Permisos: SUPER_ADMIN cross-tenant, ADMIN tenant-scoped.

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
- [x] Crear modelo `AuditLog` (tenantId, userId, action, entity, entityId, changes JSONB, createdAt) — migración `20261020120000_add_audit_notification_discount`.
- [x] Crear modelo `Notification` (tenantId, userId, type, title, message, read, createdAt) — enum `NotificationType`.
- [x] Crear modelo `Discount` (tenantId, name, type, value, variantId?, productId?, active, startDate, endDate) — enum `DiscountType`.
- [x] Modelo `Customer` (tenantId, name, phone, email, notes) — ya existía desde Slice 3 (`@@unique([tenantId, phone])`).
- [x] `customerId` en `Order` — ya existía desde Slice 3 y ahora se setea en `submitCart` vía `findOrCreateCustomer`.

#### Backend — Audit Trail
- [x] Servicio `audit.service.ts`: `logAction`, `getAuditLogs` con paginación y filtros (entity, action, userId, entityId, rango de fechas) y `redactSensitive` (enmascara password/token).
- [x] Middleware `auditMiddleware` (`src/middlewares/audit.middleware.ts`) que registra create/update/delete automáticamente en `AuditLog` desde el handler de la ruta; aplicado a products, variants, users, discounts e import.
- [x] Ruta `GET /api/audit` con permiso `audit` y contrato `success/data/meta`.

#### Backend — Notifications
- [x] Servicio `notifications.service.ts`: `checkLowStock`, `createNotification`, `getNotifications`, `markAsRead`, `markAllAsRead` (con dedupe de alertas LOW_STOCK sin leer).
- [x] Rutas: `GET /api/notifications`, `PATCH /api/notifications/:id/read`, `PATCH /api/notifications/read-all`.
- [x] `checkLowStock` integrado como trigger post-ajuste (`adjustStock`), transferencia (`transferStock`/`receiveTransfer`) e importación de stock; umbral configurable con `LOW_STOCK_THRESHOLD` (default 5).

#### Backend — Discounts
- [x] Servicio `discounts.service.ts`: `getDiscounts`, `createDiscount`, `updateDiscount`, `deleteDiscount`, `applyDiscounts`, `getCartPricing` (mejor descuento por ítem: scope variante > producto > tenant).
- [x] Rutas: `GET /api/discounts`, `POST /api/discounts`, `GET/PUT/DELETE /api/discounts/:id` con validación de scope cross-tenant, porcentaje ≤ 100 y rango de fechas.
- [x] Descuentos integrados en cart/order: `GET /api/carts/:id` incluye `pricing` (subtotal/descuento/total), `submitCart` aplica `applyDiscounts` en los snapshots de precio y muestra los descuentos en el mensaje WhatsApp.

#### Backend — Customers
- [x] Servicio `customers.service.ts`: `getCustomers` (búsqueda por nombre/teléfono/email), `getCustomerById`, `findOrCreateCustomer` (upsert por `(tenantId, phone)`), `getCustomerOrders`.
- [x] Rutas: `GET /api/customers`, `GET /api/customers/:id`, `GET /api/customers/:id/orders` (permiso `customers`).

#### Backend — Import/Export
- [x] Servicio `import-export.service.ts`: `parseCSV` (campos entrecomillados), `toCSV`, `importProducts`, `importStock`, `exportProducts`, `exportSales`.
- [x] Rutas: `POST /api/import/products`, `POST /api/import/stock`, `GET /api/export/products`, `GET /api/export/sales` (respuesta `text/csv` con attachment).

#### Frontend — Dashboard
- [x] Dashboard reescrito (implementado en `features/dashboard/Home.tsx`, la página existente de `/dashboard`): tarjetas de resumen 7/30 días, gráfico de ventas diarias, top productos, comparación de sucursales, pedidos recientes y alertas de stock bajo.

#### Frontend — Notifications
- [x] `components/notifications/NotificationBell.tsx`: ícono con badge de no leídas y dropdown, integrado en `Topbar`.
- [x] `features/notifications/NotificationsPage.tsx`: lista completa con filtros por tipo y solo no leídas.

#### Frontend — Discounts
- [x] `features/discounts/DiscountsPage.tsx`: tabla de reglas con activar/desactivar y eliminar.
- [x] `features/discounts/CreateDiscountModal.tsx`: formulario con scope producto/variante y vigencia.

#### Frontend — Customers
- [x] `features/customers/CustomersPage.tsx`: tabla con búsqueda por nombre/teléfono/email.
- [x] `features/customers/CustomerDetailPage.tsx`: detalle con historial de pedidos.

#### Frontend — Import/Export
- [x] `features/import/ImportPage.tsx`: upload de CSV de productos y stock con resumen de resultado (creados/actualizados/errores por fila).
- [x] Botones "Exportar CSV" en páginas de productos y ventas (visibles con permiso `import_export`).

#### Frontend — Navigation
- [x] Sidebar: agregar "Descuentos", "Clientes", "Notificaciones", "Importar/Exportar".
- [x] Router: agregar todas las rutas nuevas (`/discounts`, `/customers`, `/customers/:id`, `/notifications`, `/import`).
- [x] `CartSummary` muestra subtotal, descuento aplicado y total desde el `pricing` del server cart.

#### Tests
- [x] Audit: creación de logs, filtrado, paginación, redacción de secretos y registro automático vía middleware (`tests/audit.test.ts`).
- [x] Notifications: detección de stock bajo con dedupe, read/unread, bulk mark, aislamiento (`tests/notifications.test.ts`).
- [x] Discounts: validaciones, percentage/fixed, rango de fechas, scope product/variante, aislamiento (`tests/discounts.test.ts`).
- [x] Customers: creación/upsert por teléfono, búsqueda, historial de pedidos, aislamiento (`tests/customers.test.ts`).
- [x] Import: parsing de CSV, creación bulk de productos, update por SKU duplicado, ajuste de stock (`tests/import-export.test.ts`).
- [x] Export: generación de CSV de productos y ventas con precisión de datos (`tests/import-export.test.ts`).

### Verificación ejecutada

- `npx vitest run` en backend: 11 archivos, 81 pruebas pasan (incluye 21 nuevas del slice).
- `npx tsc --noEmit` en backend sin errores; `npm run build` de Next.js compila y pasa el type check de rutas.
- `npm run build` de frontend (Vite) correcto; ESLint focalizado de archivos nuevos/modificados sin errores.
- `npx prisma migrate status`: 7 migraciones, base sincronizada.
- [ ] Validación manual en Docker pendiente (checks siguientes).

### Pendiente / fuera de alcance de esta fase

- [ ] UI de visualización del audit trail (`GET /api/audit` existe; no se pidió panel en el plan).
- [ ] Extender `auditMiddleware` a rutas de stock/branches/orders (los movimientos de stock ya tienen su propio historial en `StockMovement`).
- [ ] Rate limiting en el endpoint público de métricas de storefront (arrastre de Slice 1.4).

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

## Slice 6: Esquema de pagos y facturación por tenant

> Fuente: `plan-pagos-impl.md` Etapa 1; credenciales por tenant según `PAGOS-BO.md`.

### Objetivo

Preparar el esquema multitenant para pasarelas de pago y facturación desacopladas: configuración cifrada por tenant, campos de conciliación en `Order` y utilidad de criptografía para credenciales.

### Decisiones de contrato

- `Order.status` sigue representando el estado comercial (`pending|contacted|confirmed|completed|cancelled`); el estado del pago se guarda en `gatewayStatus` (`initiated|paid|failed`) para no romper el flujo WhatsApp existente.
- Credenciales de pasarela/facturación se almacenan cifradas (AES-256-GCM, key desde `PAYMENTS_ENCRYPTION_KEY`); nunca en claro ni en logs ni en respuestas API.
- Un tenant puede tener varias filas de `TenantPaymentConfig` (una por gateway) pero solo una activa a la vez, validada en el servicio.

### Checks de implementación

#### Schema
- [x] Enums `PaymentGatewayType { LIBELULA, CUCU }` y `BillingProviderType { FACTELEC, LIBELULA_NATIVE }`.
- [x] Modelo `TenantPaymentConfig` (id uuid, tenantId, gateway, appkeyEncrypted, isActive, timestamps) con `@@unique([tenantId, gateway])` y relación a `Tenant`.
- [x] Modelo `TenantBillingConfig` (id uuid, tenantId, provider, credentialsEncrypted Json, isEnabled, timestamps) con `@@unique([tenantId, provider])` y relación a `Tenant`.
- [x] Extender `Order` con `gatewayTransactionId` (índice único), `gatewayStatus`, `billingInvoiceId`, `billingInvoiceUrl` (todos opcionales).
- [x] Migración versionada `20261028090000_add_payment_billing_config` + `prisma generate`; nunca `db push`.

#### Backend
- [x] `backend/src/lib/crypto.ts`: `encryptSecret`/`decryptSecret` AES-256-GCM con `PAYMENTS_ENCRYPTION_KEY` (64 hex) y error claro si falta la env (`PAYMENTS_ENCRYPTION_KEY_MISSING`/`_INVALID`), más `maskSecret`.
- [x] API de configuración tenant-scoped derivando tenant del JWT (no acepta tenantId del body): `GET/PUT /api/tenants/payment-config` y `GET/PUT /api/tenants/billing-config` con Zod (`validators/payment-config.schema.ts`) y contrato `success/data/error`.
- [x] Al guardar: valida que solo una config de pago quede activa por tenant (transacción), cifra credenciales antes de persistir (por valor en billing) y redacta appkey/credenciales en respuestas (solo máscara `****xxxx`).
- [x] Permiso `settings` agregado solo a ADMIN (backend `lib/permissions.ts` y frontend `config/rolePermissions.ts`/`types/permissions.ts`); el SUPER_ADMIN no gestiona credenciales de tenants.

#### Tests
- [x] `backend/tests/payment-config.test.ts`: roundtrip encrypt/decrypt (más payload alterado y env faltante), CRUD de payment/billing, aislamiento cross-tenant, unicidad `(tenantId, gateway)`, una sola config activa por tenant, rutas con JWT (tenant del token, 403 para SELLER/SUPER_ADMIN, 400 por validación) — 19 pruebas pasan.

### Verificación ejecutada

- `npx vitest run` en backend: 12 archivos, 105 pruebas pasan (incluye las 19 del slice).
- `npx tsc --noEmit` en backend sin errores; `npm run build` de Next.js compila y registra `/api/tenants/payment-config` y `/api/tenants/billing-config`.
- ESLint focalizado de los archivos nuevos/modificados (backend y frontend) sin errores; `npm run build` de frontend correcto.
- `npx prisma migrate status`: 8 migraciones, base sincronizada.
- Nota: `prisma migrate dev` detecta drift histórico (schema actual vs. migraciones más antiguas) y propone resetear la base; la migración de este slice se generó con `prisma migrate diff --from-schema-datamodel` (schema HEAD → schema actual) y se aplicó con `npx prisma migrate deploy`, sin resetear datos. El drift histórico sigue pendiente de resolver en una tarea dedicada.
- La env `PAYMENTS_ENCRYPTION_KEY` (64 hex) se agregó a `backend/.env`, `.env.docker` y `backend/.env.production` (archivos locales, gitignored).

### Checks de validación manual

- [ ] Configurar credenciales Libélula de un tenant y verificar que se guardan cifradas en BD y la API nunca devuelve el appkey completo.
- [ ] Intentar leer o escribir la config de otro tenant y confirmar `403` o lista vacía.

> Ejecutado el 2026-10-28 contra Docker con evidencia (BD: `appkeyEncrypted` en `v1:<iv>:<tag>:<data>` sin texto plano; API responde solo `****4321`/`****cret`; SELLER y SUPER_ADMIN reciben `403`; payload inválido `400`; ADMIN de Fashion ve `data: []` y escribe una fila aislada sin afectar la de Demo). Pendiente de confirmación del usuario para marcar.

---

## Slice 7: Arquitectura Strategy de pagos y facturación

> Fuente: `plan-pagos-impl.md` Etapa 2.

### Objetivo

Crear las abstracciones `IPaymentStrategy`/`IBillingStrategy` y los contextos que resuelven la estrategia activa por tenant, de modo que ningún controlador o servicio de aplicación conozca Libélula ni FactElec.

### Decisiones de contrato

- Las interfaces y contextos viven en `backend/src/modules/payments/` (no en `/src/interfaces` y `/src/strategies` de la raíz) para seguir la estructura de módulos de AGENTS.md.
- Los contextos se implementan como funciones/fábricas con tipado estricto, consistente con el estilo de servicios existentes; las estrategias concretas pueden ser clases que implementen las interfaces.

### Checks de implementación

#### Interfaces
- [x] `IPaymentStrategy` (en `modules/payments/payment-strategy.ts`) con `createPayment(order, config)` → `{ gatewayTransactionId, qrUrl?, paymentUrl?, status }` y `processWebhook(params, config)` → resultado tipado (el config se pasa también para que la estrategia pueda validar/descifrar credenciales en el webhook).
- [x] `IBillingStrategy` con `emitInvoice(order, config)` → `{ invoiceId, invoiceUrl }`.
- [x] Tipos de dominio para configs y resultados (`modules/payments/payment-types.ts`), sin `any`.

#### Contextos
- [x] `PaymentContext` (`modules/payments/payment-context.ts`): recibe `tenantId`, carga `TenantPaymentConfig` activa (credencial descifrada en memoria) y delega en la estrategia del gateway; error `PAYMENT_NOT_CONFIGURED` si no hay config activa y `PAYMENT_GATEWAY_MISMATCH` si la config activa no coincide con el gateway del webhook.
- [x] `BillingContext`: sin config o `isEnabled = false` o provider `LIBELULA_NATIVE` → no-op (`null`, la facturación nativa la resuelve Libélula en el webhook); si está habilitado, instancia la estrategia correspondiente.
- [x] Registry de estrategias (`registerPaymentStrategy`/`registerBillingStrategy` + getters con `PAYMENT_STRATEGY_NOT_REGISTERED`/`BILLING_STRATEGY_NOT_REGISTERED`): mapa `PaymentGatewayType → IPaymentStrategy` y `BillingProviderType → IBillingStrategy` para agregar proveedores solo registrándolos.

#### Tests
- [x] `backend/tests/payment-strategies.test.ts` con estrategias fake: resolución por tenant con credenciales descifradas, error sin config activa (y con config inactiva), no-op de facturación (deshabilitada/ausente/nativa), delegación de webhook con mismatch de gateway y registro de un proveedor ficticio (stub CUCU) sin tocar el resto — 8 pruebas pasan.

### Verificación ejecutada

- `npx vitest run`: 13 archivos, 113 pruebas pasan.
- `npx tsc --noEmit` sin errores; `npm run build` de Next.js compila; ESLint focalizado de los archivos nuevos sin errores.

### Checks de validación manual

- [ ] Verificar con logs de desarrollo que un checkout inexistente produce `PAYMENT_NOT_CONFIGURED` y no un error 500 opaco.

---

## Slice 8: Checkout de pago con Libélula

> Fuente: `plan-pagos-impl.md` Etapa 3 + controlador de Etapa 4; API real en `libelula_documentation.md` §1.

### Objetivo

Inicializar un pago Libélula para una orden existente, registrar la transacción en la orden y devolver el QR/link de pago al cliente, con tenant resuelto en servidor.

### Decisiones de contrato

- Además de `customerEmail`, la idempotencia del reintento requiere redevolver el mismo QR/link: se agregan `Order.gatewayQrUrl` y `Order.gatewayPaymentUrl` (migración `20261028120000_add_checkout_order_fields`).
- El `callback_url` del webhook se construye con `APP_BASE_URL` (agregada a `backend/.env`, `.env.docker` y `backend/.env.production`); en despliegues reales debe apuntar al host público del backend.
- `POST /api/checkout` acepta además `customerNit` opcional (agregado en el Slice 9 para alimentar `numeroDocumento` de FactElec; solo se persiste en el registro, no en el reintento idempotente).
- `LibelulaPaymentStrategy` se registra en el registry mediante `registerBuiltinStrategies()` (idempotente), manteniendo el patrón de registro del Slice 7.

### Checks de implementación

#### Backend — LibelulaPaymentStrategy
- [x] `LibelulaPaymentStrategy implements IPaymentStrategy`: `POST https://api.libelula.bo/rest/deuda/registrar` con `appkey` descifrado de la config del tenant.
- [x] Mapeo de payload: `identificador_deuda` = `order.id`, `email_cliente` (requerido por Libélula, con guard `CUSTOMER_EMAIL_REQUIRED`), `nombre_cliente`, `nit`/`razon_social` cuando existan, `moneda: BOB` y `lineas_detalle_deuda` desde los ítems (concepto = producto + SKU, cantidad, costo_unitario).
- [x] `callback_url` dinámico hacia `GET /api/webhooks/payments/libelula` (base URL desde env `APP_BASE_URL`; error `APP_BASE_URL_MISSING` si falta).
- [x] Capturar y tipar la respuesta: `id_transaccion` → `Order.gatewayTransactionId`; `qr_simple_url` → `qrUrl` y `url_pasarela_pagos` → `paymentUrl`; `error: true` o `!ok` → `GATEWAY_ERROR`/`GATEWAY_UNREACHABLE` (502) con logs sin credenciales.

#### Backend — Checkout
- [x] `customerEmail` snapshot a `Order` (migración `20261028120000_add_checkout_order_fields`), validado con Zod (`validators/checkout.schema.ts`, uuid + email) en el checkout.
- [x] `POST /api/checkout` (público, resuelve tenant con `resolveTenant` por `X-Tenant-ID`; NO acepta tenantId del body): valida orden perteneciente al tenant (`ORDER_NOT_FOUND` 404), estado pagable (`pending|contacted|confirmed` → `ORDER_NOT_PAYABLE`; `gatewayStatus = paid` → `ORDER_ALREADY_PAID`) y email.
- [x] Invoca `PaymentContext.createPayment`, actualiza `customerEmail`, `gatewayTransactionId`, `gatewayStatus` (`initiated`) y QR/link en la orden, y retorna `{ orderId, customerEmail, gatewayTransactionId, qrUrl, paymentUrl, gatewayStatus }` en el envelope.
- [x] Reintento de checkout idempotente: si la orden ya tiene transacción `initiated` vigente, retorna los mismos datos sin registrar otra deuda.

#### Tests
- [x] `backend/tests/checkout.test.ts` con `fetch` mockeado: payload exacto a Libélula (URL, método, appkey descifrada, callback, líneas), actualización de la orden, idempotencia del reintento (un solo `fetch`), aislamiento cross-tenant (404 sin tocar la pasarela), rechazo sin config activa, validación de tenant/email, estados no pagables y rechazo de pasarela (502 sin persistir) — 8 pruebas pasan.

### Verificación ejecutada

- `npx vitest run`: 14 archivos, 121 pruebas pasan.
- `npx tsc --noEmit` sin errores; `npm run build` de Next.js compila (`/api/checkout` registrada); ESLint focalizado sin errores.
- `npx prisma migrate status`: 9 migraciones; `prisma migrate diff --from-url ... --to-schema-datamodel` vacío (BD exactamente igual al schema).
- Smoke test en Docker (imagen reconstruida): `POST /api/checkout` sin tenant → `401`, body inválido → `400 VALIDATION_ERROR`, orden inexistente → `404 ORDER_NOT_FOUND`.

### Checks de validación manual

- [ ] Registrar un pago sandbox y confirmar que la orden queda con `gatewayTransactionId` y `gatewayStatus = initiated`.
- [ ] Reintentar el checkout de la misma orden y verificar que no se crea una segunda deuda en Libélula.
- [ ] Confirmar que un checkout con `X-Tenant-ID` de otro tenant devuelve error y no toca la orden.

> Requiere una `appkey` sandbox real de Libélula y una orden de prueba; el reintento y el aislamiento cross-tenant ya están cubiertos por `tests/checkout.test.ts`, y el route handler responde `401/400/404` correctamente en Docker.

---

## Slice 9: Webhook de pagos y orquestación de facturación

> Fuente: `plan-pagos-impl.md` Etapa 3 (FactElec) y Etapa 4; webhook Libélula en `libelula_documentation.md` §2; contrato FactElec en `FactElec.md`.

### Objetivo

Confirmar pagos de forma desacoplada vía webhook global por gateway, con idempotencia, y disparar facturación electrónica según la configuración del tenant.

### Decisiones de contrato

- `Sale.userId` pasa a nullable (migración `20261028150000_add_billing_webhook_fields`, FK ahora `ON DELETE SET NULL`): el webhook confirma la orden sin usuario autenticado; la UI muestra `Sistema` como fallback.
- `Order.customerNit` (opcional) alimenta `numeroDocumento` de FactElec; `POST /api/checkout` acepta `customerNit` opcional para persistirlo.
- `Variant.codigoProductoSin` opcional; requerido solo cuando FactElec está habilitado para el tenant (si falta, la facturación falla con `BILLING_PRODUCT_CODE_REQUIRED` y el webhook igual responde `200`).
- `AuditAction` se amplía con `CONFIRM_FAILED` y `BILLING_FAILED` (columna String, sin migración) como estado de reintento observable.
- El `:gateway` del webhook se normaliza a mayúsculas: el `callback_url` enviado a Libélula es `.../payments/libelula` (minúscula) pero el enum es `LIBELULA`.
- Interpretación de la regla `200/400`: `200 "OK"` para entregas procesadas y reintentos idempotentes; `400` para gateway desconocido, payload sin `transaction_id`, `transaction_id` sin orden correspondiente y tenant inactivo.

### Checks de implementación

#### Backend — Webhook
- [x] `GET /api/webhooks/payments/:gateway` (público): valida `:gateway` contra `PaymentGatewayType` (case-insensitive) y para Libélula lee `transaction_id`, `invoice_id`, `invoice_url` del query string.
- [x] Transacción Prisma: busca orden por `gatewayTransactionId`, verifica tenant activo e idempotencia (claim con `updateMany` where `gatewayStatus != paid`, sin reprocesar órdenes ya pagadas); actualiza `gatewayStatus = 'paid'`, guarda la factura nativa de Libélula si viene en el query y ejecuta la confirmación existente de la orden (`confirmOrder`: descuento de stock + `Sale`) sin duplicarla (promueve `pending|contacted → confirmed` antes de confirmar; `cancelled` queda logueado).
- [x] Orquestación de facturación asíncrona (post-commit, fuera de la respuesta HTTP): si el tenant tiene FactElec habilitado, invoca `BillingContext.emitInvoice` y persiste `billingInvoiceId`/`billingInvoiceUrl`; si falla, log descriptivo + `AuditLog(BILLING_FAILED)` con `code`/`error` como estado de reintento sin bloquear el `200`.
- [x] Responde `200` con cuerpo `"OK"` (text/plain) en entregas válidas; `400` para gateway desconocido o payload ilegible (ver interpretación arriba).

#### Backend — FactElecBillingStrategy
- [x] `FactElecBillingStrategy implements IBillingStrategy`: `fetch` POST a `https://api.factelec-api.com/api/v1/facturas` con header `x-api-token` desde `TenantBillingConfig.credentialsEncrypted` (descifrado) y payload `cliente` (nombreRazonSocial, numeroDocumento, codigoTipoDocumento 1=CI/2=NIT), `codigoMetodoPago` y `detalles[]` (codigoProductoSin, codigoProducto=SKU snapshot, descripcion, cantidad, precioUnitario, subTotal) desde `OrderItem`.
- [x] Captura la respuesta `data.cuf` → `billingInvoiceId` y `data.url/pdfUrl/pdf` → `billingInvoiceUrl`; `!ok` o CUF ausente → error de pasarela sin credenciales en logs.
- [x] `codigoProductoSin` agregado a `Variant` (migración + validators/service + formularios Create/UpdateVariantModal y tipo `Variant`); requerido solo cuando FactElec está habilitado para el tenant.
- [x] Registrados `LIBELULA` y `FACTELEC` en los contextos vía `registerBuiltinStrategies()`; `LIBELULA_NATIVE` resuelve el no-op (el webhook de Libélula ya trae `invoice_id`/`invoice_url`).

#### Tests
- [x] `backend/tests/payment-webhook.test.ts`: happy path (orden `paid`, factura nativa del query persistida, stock descontado, `Sale` con `userId` null y `StockMovement`), idempotencia (segundo webhook no duplica `Sale` ni stock), gateway inválido, payload sin transacción, orden inexistente, facturación FactElec mockeada (payload exacto con token descifrado, persistencia de CUF/URL, gateway en minúsculas), fallo de facturación sin romper el `200` (auditoría `BILLING_FAILED`) y validación de `codigoProductoSin`/documento — 6 pruebas pasan.

### Verificación ejecutada

- `npx vitest run`: 15 archivos, 127 pruebas pasan.
- `npx tsc --noEmit` backend sin errores; `npm run build` Next.js compila con `/api/webhooks/payments/[gateway]`; ESLint focalizado backend y frontend sin errores.
- `npm run build` frontend (Vite) correcto; `prisma migrate status`: 10 migraciones y diff BD↔schema vacío.
- Smoke test en Docker (imagen reconstruida): `PAYPAL` → `400 INVALID_GATEWAY`, sin `transaction_id` → `400`, transacción inexistente → `400 ORDER_NOT_FOUND`.

### Checks de validación manual

- [ ] Disparar el webhook manualmente (curl) con un `transaction_id` de prueba y verificar orden pagada + `200 "OK"`.
- [ ] Repetir el mismo curl y confirmar que no se duplica stock ni `Sale` (idempotencia).
- [ ] Con FactElec habilitado y sandbox, verificar `billingInvoiceId`/`billingInvoiceUrl` persistidos tras el webhook.

> Los tres escenarios están cubiertos por `tests/payment-webhook.test.ts` contra BD real; en Docker solo se verificó el manejo de errores (`400` gateway/payload/orden). El caso FactElec requiere un `apiToken` sandbox real de FactElec.

---

## Slice 10: Frontend de checkout y estado de pago

> Fuente: flujo bifurcado de `PAGOS-BO.md`; QR de `libelula_documentation.md` §1.

### Objetivo

Ofrecer en el checkout público las dos vías —pago en línea con QR Libélula o coordinación por WhatsApp— y mostrar el estado del pago y la factura al cliente.

### Decisiones de contrato

- El estado del pedido se consulta con `GET /api/checkout/:orderId` (público, `resolveTenant` por `X-Tenant-ID`), que devuelve solo `{ orderId, status, gatewayStatus, qrUrl, paymentUrl, billingInvoiceId, billingInvoiceUrl }` sin exponer el resto de la orden.
- El QR/link se persisten en `Order.gatewayQrUrl`/`gatewayPaymentUrl` (Slice 8), por lo que el reintento y el tracking pueden redevolverlos sin repetir la llamada a Libélula.
- Si el pedido ya se creó pero el pago falla, el formulario conserva el pedido y ofrece "Coordinar este pedido por WhatsApp" (el carrito ya fue consumido por `submitCart`).

### Checks de implementación

- [x] `frontend/src/services/checkout.api.ts` + hook `useCheckout` (`hooks/useCheckout.ts`): `initiatePayment(tenantId, orderId, customerEmail, customerNit?)` con header `X-Tenant-ID` y timeout de 20s → datos de QR/link; `useCheckoutStatus` con `refetchInterval` de 5s mientras `gatewayStatus === 'initiated'`.
- [x] Componente de resultado de checkout (`components/cart/CheckoutResult.tsx`): imagen QR desde `qrUrl` (la pasarela lo llama `qr_simple_url`), link a `paymentUrl` (`url_pasarela_pagos`), botón "Copiar enlace de pago", aviso de expiración del QR/enlace y estado con badge (pendiente/confirmado/fallido/cancelado).
- [x] `CartSummary` bifurcado en "Pagar en línea ahora" (crea orden + checkout + resultado) y "Coordinar pedido por WhatsApp" (flujo previo intacto: formulario, `submitOrder`, abre `wa.me` y cierra), con pasos, "Volver" y estados de carga.
- [x] Consulta de estado de la orden para el cliente vía `GET /api/checkout/:orderId` (`checkout.service.getCheckoutStatus`): pendiente de pago → pagado → factura disponible con enlace `billingInvoiceUrl`.
- [x] Estados de error/timeout: `describeCheckoutError` mapea `PAYMENT_NOT_CONFIGURED`, `ORDER_NOT_PAYABLE`, `ORDER_ALREADY_PAID`, `ORDER_NOT_FOUND`, `CUSTOMER_EMAIL_REQUIRED`, `GATEWAY_ERROR`, `GATEWAY_UNREACHABLE`, `VALIDATION_ERROR`, timeout (`ECONNABORTED`) y fallo de red; se muestran en el formulario con opción de reintentar.
- [x] `npm run build` y ESLint del frontend sin errores.

#### Tests (endpoint de estado agregado al slice)

- [x] `tests/checkout.test.ts`: estado devuelto acotado al tenant (`qrUrl`/`paymentUrl` presentes tras el registro), `404` cross-tenant y `401` sin header (10 pruebas en el archivo).

### Verificación ejecutada

- `npx vitest run` backend: 15 archivos, 129 pruebas pasan; `tsc --noEmit` y ESLint sin errores; `npm run build` con `/api/checkout` y `/api/checkout/[orderId]`.
- Frontend: `npm run build` (Vite) y ESLint focalizado sin errores.
- Docker (imágenes backend+frontend reconstruidas): `GET /api/checkout/:id` sin tenant → `401`, orden inexistente → `404 ORDER_NOT_FOUND`.

### Checks de validación manual

- [ ] Completar un pago sandbox y ver la orden marcada como pagada sin intervención manual.
- [ ] Verificar que el flujo por WhatsApp sigue funcionando igual que antes del slice.

---

## Slice 11: Conciliación y consulta de pagos (posterior)

> Fuente: `libelula_documentation.md` §3 (consultar_pagos) y §4 (consultar deudas por identificador).

### Objetivo

Auditar transacciones pagadas en Libélula por rango de fechas y permitir sincronizar manualmente el estado de una orden puntual.

### Checks de implementación

- [ ] Método de estrategia Libélula para `POST /rest/deuda/consultar_pagos` por rango (máx. 90 días) con `appkey` del tenant; resultado tenant-scoped con paginación.
- [ ] Método para `POST /rest/deuda/consultar_deudas/por_identificador` y botón "Sincronizar pago" en el detalle de orden (ADMIN), actualización idempotente.
- [ ] UI de conciliación en dashboard: listado por rango con montos y formas de pago, export CSV reutilizando `import-export.service`.
- [ ] Tests de aislamiento y manejo de errores de la pasarela.

### Checks de validación manual

- [ ] Conciliar un periodo con transacciones sandbox y comparar montos con las `Sale` del tenant.
- [ ] Sincronizar una orden pagada fuera de banda y verificar que el estado queda consistente sin duplicados.

---

## Progreso

Actualizar esta sección después de cada sesión de trabajo. `[x]` requiere evidencia en código, prueba automatizada o validación manual informada por el usuario; `[ ]` significa pendiente. El agente debe leer el estado actual antes de cambiar marcas y preguntar por los checks manuales que no estén demostrados.

- [ ] Slice 0 completo
- [ ] Slice 1 completo (implementación completa, validación manual pendiente)
- [ ] Slice 1.1 completo (implementación completa, validación manual pendiente)
- [ ] Slice 1.2 completo (portada y navegación implementadas; pruebas automatizadas y validación manual pendientes)
- [x] Slice 2 completo (implementación completa, validación manual pendiente)
- [x] Prerrequisitos completos (implementación completa, validación manual pendiente)
- [ ] Slice 3 completo (implementación completa, validación manual pendiente)
- [ ] Slice 4 completo (implementación ~90%, validación manual pendiente)
- [ ] Slice 5 completo (implementación completa: schema, backend, frontend y 21 pruebas nuevas; validación manual pendiente)
- [ ] Slice 1.3 completo (gestor ampliado implementado; validación manual actualizada y pruebas frontend E2E pendientes)
- [ ] Slice 1.4 completo (métricas básicas implementadas; pruebas manuales en Docker pendientes)
- [x] Slice 6 completo (esquema de pagos/facturación por tenant, crypto y config API; evidencia de validación manual ejecutada, pendiente de confirmación)
- [x] Slice 7 completo (arquitectura Strategy de pagos y facturación: interfaces, contexts, registry y 8 tests con estrategias fake; validación manual pendiente)
- [x] Slice 8 completo (checkout con Libélula: estrategia, `POST /api/checkout`, idempotencia y 8 tests con fetch mockeado; validación sandbox manual pendiente)
- [x] Slice 9 completo (webhook idempotente + `FactElecBillingStrategy` + `codigoProductoSin`/`customerNit`/`Sale.userId` nullable y 6 tests; validación con sandbox pendiente)
- [x] Slice 10 completo (frontend de checkout y estado de pago: bifurcación del CTA, resultado con QR/link/copia, tracking público y mapeo de errores; validación manual sandbox pendiente)
- [ ] Slice 11 completo (conciliación y consulta de pagos — posterior)
- [ ] Próximo slice activo: Slice 11 (conciliación: `consultar_pagos` por rango, botón "Sincronizar pago" en detalle de orden, UI de conciliación con export CSV); pendientes de usuario: confirmar validación manual del Slice 6, sandbox de Libélula (Slices 8–10) y webhook/FactElec (Slice 9), verificar en navegador que el flujo WhatsApp no regresó, y resolver el drift histórico de `prisma migrate dev`. Validación manual de Slices 0–5 en Docker pendiente. SEO y analítica avanzada quedan para el tramo final
- [x] Última actualización: Slice 10 implementado — `checkout.api.ts`/`useCheckout` (polling 5s mientras `initiated`), `CheckoutResult` con QR, link, copia y badge de estado, `CartSummary` bifurcado (pago en línea vs. WhatsApp con fallback si el pago falla tras crear la orden), endpoint público `GET /api/checkout/:orderId` + 2 tests (129 totales), builds/lint OK y smoke en Docker

Cuando el usuario solicite **"Actualizar progreso"**, comparar este checklist con el código actual y con la evidencia proporcionada. Cuando solicite **"Continuar con el Slice #"**, trabajar únicamente en ese slice, mantener los contratos anteriores y actualizar esta sección al terminar.
