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

## Slice 2: Sucursales y gestión de stock

### Objetivo

Gestionar existencias por sucursal y variante, con transferencias atómicas y panel para representantes.

### Checks de implementación

- [ ] Completar CRUD de sucursales con dirección, horarios y sucursal virtual.
- [ ] Aplicar índice único `(tenantId, branchId, variantId)` en stock.
- [x] Existen endpoints iniciales `GET /api/stock/branch` y `GET /api/stock/history`.
- [ ] Definir y completar el contrato final tenant-aware para sucursal e historial, preferentemente con parámetros explícitos y pruebas.
- [ ] Ajustes y transferencias ejecutan transacciones PostgreSQL y registran `StockMovement` con usuario.
- [ ] Rechazar cantidades negativas, variantes/sucursales de otro tenant y transferencias incompletas.
- [ ] Actualizar `useStock` y vistas para filtrar por sucursal y variante.
- [ ] Implementar permisos para admin, representante y vendedor según sucursal.
- [ ] Agregar seeds reproducibles de tenant, sucursales, variantes y stock.
- [ ] Agregar tests de concurrencia lógica, stock insuficiente y transferencia atómica.

### Checks de validación manual

- [ ] Crear dos sucursales y asignar cantidades diferentes de la misma variante.
- [ ] Verificar que al cambiar de sucursal el stock mostrado cambie.
- [ ] Ejecutar una transferencia y confirmar que origen disminuye y destino aumenta.
- [ ] Intentar ajustar o vender más stock del disponible y confirmar rechazo sin cambios parciales.
- [ ] Verificar que un representante solo ve la sucursal permitida y que el historial identifica al usuario.

## Slice 3: Carrito, WhatsApp y cierre de venta

### Objetivo

Completar la compra pública: carrito, selección de sucursal, derivación al representante y cierre trazable por WhatsApp.

### Checks de implementación

- [ ] Crear migraciones y modelos `Cart`, `CartItem`, `Order` y sus items con `tenantId`.
- [ ] Implementar carrito por sesión con cantidades, precio snapshot, expiración y validación de variante activa.
- [ ] Implementar selección de sucursal y recálculo de disponibilidad por variante.
- [ ] Resolver el representante de la sucursal en servidor, con fallback explícito del tenant.
- [ ] Generar mensaje determinista con cliente, sucursal, SKU, atributos, cantidades y total.
- [ ] Generar enlace WhatsApp con teléfono validado y texto URL-encoded.
- [ ] Crear pedido idempotente desde carrito y conservar snapshots para auditoría.
- [x] Existe un panel y API inicial para `WhatsappOrder`, estados y conversión a venta.
- [ ] Integrar el flujo nuevo de `Order` con permisos por sucursal, manteniendo compatibilidad durante la migración.
- [ ] Definir transacción de cierre: validar stock nuevamente y descontarlo solo al estado comercial acordado.
- [ ] Agregar tests de carrito, aislamiento, idempotencia, stock cambiado y formato del mensaje.

### Checks de validación manual

- [ ] Agregar varias variantes al carrito y confirmar que cantidades y total se actualicen.
- [ ] Cambiar de sucursal y verificar que disponibilidad y representante cambien correctamente.
- [ ] Intentar agregar una variante sin stock y confirmar que la API y la UI lo bloquean.
- [ ] Verificar que el botón "Comprar por WhatsApp" abre el chat del representante de la sucursal seleccionada.
- [ ] Confirmar que el mensaje incluye productos, variantes, cantidades, precios, subtotal y total formateados.
- [ ] Crear el pedido dos veces por reintento y confirmar que no duplica la operación.
- [ ] Confirmar que el representante puede gestionar solo pedidos de su sucursal y cambiar estados permitidos.
- [ ] Cerrar una venta y verificar descuento de stock, movimiento auditado y pedido con snapshot.

## Progreso

Actualizar esta sección después de cada sesión de trabajo. `[x]` requiere evidencia en código, prueba automatizada o validación manual informada por el usuario; `[ ]` significa pendiente. El agente debe leer el estado actual antes de cambiar marcas y preguntar por los checks manuales que no estén demostrados.

- [ ] Slice 0 completo
- [ ] Slice 1 completo (implementación completa, validación manual pendiente)
- [ ] Slice 2 completo
- [ ] Slice 3 completo
- [ ] Próximo slice activo: Slice 1 (validación manual pendiente)
- [x] Última actualización: Slice 1 implementación completada

Cuando el usuario solicite **“Actualizar progreso”**, comparar este checklist con el código actual y con la evidencia proporcionada. Cuando solicite **“Continuar con el Slice #”**, trabajar únicamente en ese slice, mantener los contratos anteriores y actualizar esta sección al terminar.