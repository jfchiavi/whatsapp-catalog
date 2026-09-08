# Agent Context and Rules

Este archivo es el contexto operativo para cualquier agente que modifique este repositorio. La implementación debe seguir el código existente y este documento; si hay una contradicción, se debe señalar antes de cambiar un contrato público.

## Estado actual verificado

- La autenticación JWT, refresh token y `/api/auth/me` existen.
- El JWT de acceso contiene `userId`, `role`, `tenantId` y `branchId`.
- El schema ya tiene `Tenant`, `Variant` y `tenantId` en las entidades principales.
- El aislamiento por tenant está aplicado en varios servicios, pero todavía requiere una auditoría completa de queries y relaciones cruzadas.
- No existe todavía un tenant middleware que resuelva subdominio o `X-Tenant-ID`.
- El RBAC tiene middleware y permisos definidos, pero las rutas deben comprobar y retornar el resultado del middleware para que el `403` sea efectivo.
- El modelo de carrito/pedido público todavía no existe; el flujo actual usa `WhatsappOrder` y conversión a `Sale`.
- Las respuestas API todavía no están normalizadas globalmente al envelope `success/data/error`.

## Stack efectivo

- **Frontend:** React `19.2.x`, TypeScript `5.9.x`, Vite `7.2.x`, Tailwind CSS `4.1.x`, React Router `7.x`, TanStack React Query `5.x`, Zustand `5.x`, React Hook Form, Zod y Axios.
- **Backend:** Node.js `20.x` como runtime objetivo, Next.js `16.1.1` con App Router y Route Handlers, TypeScript `5.x`, Zod `4.x`, JWT (`jsonwebtoken`) y `bcryptjs`.
- **Base de datos:** PostgreSQL. El entorno local actual usa la imagen Docker `postgres:16`; PostgreSQL 15 es el mínimo compatible de producción si se requiere esa versión. No documentar PostgreSQL 15 como versión instalada mientras Docker siga en 16.
- **Persistencia:** Prisma ORM `5.22.x`, `prisma-client-js`, migraciones en `backend/prisma/migrations/` y cliente generado desde `backend/prisma/schema.prisma`.
- **API:** REST bajo `/api`, con respuestas JSON y CORS gestionado por `backend/src/middleware.ts`. No es un backend Express: las rutas pertenecen al App Router de Next.js.
- **Testing:** Vitest en backend; MSW disponible en frontend para mocks. Cada cambio de lógica debe conservar o agregar una prueba del slice afectado.

## Estructura y nomenclatura

### Frontend

- `src/app`: router, providers y configuración transversal.
- `src/features/<feature>`: páginas, componentes y lógica específica de auth, products, stock, sales, whatsapp y reports.
- `src/components`: piezas reutilizables y de layout; no colocar aquí lógica de dominio.
- `src/hooks`: hooks compartidos, con nombres `useSomething` en camelCase.
- `src/services`: clientes y contratos HTTP.
- `src/store`: estado global, principalmente auth.
- `src/types` y `src/utils`: tipos y utilidades compartidos.

Componentes, páginas y tipos de React usan `PascalCase`; hooks, funciones, variables y archivos de hooks usan `camelCase`. Evitar `any`, props implícitas y estado duplicado en componentes.

### Backend

- `src/app/api/<resource>`: Route Handlers REST (`route.ts` y segmentos dinámicos).
- `src/modules/<resource>`: lógica de dominio, servicios, repositorios y tipos del módulo.
- `src/lib`: Prisma, auth, permisos, errores y respuestas comunes.
- `src/middlewares`: auth, tenant y permisos reutilizables.
- `src/validators`: esquemas Zod de entrada.

Usar `PascalCase` para clases, tipos e interfaces; `camelCase` para funciones, variables y métodos; nombres de módulos y rutas en `kebab-case` cuando haya más de una palabra. Mantener TypeScript estricto (`strict: true`) y no silenciar errores con `as any`.

## Prisma y migraciones

1. Editar primero `backend/prisma/schema.prisma`.
2. Crear una migración con `npx prisma migrate dev --name <descripcion>` desde `backend`.
3. Ejecutar `npx prisma generate` después de modificar el schema.
4. Revisar la migración SQL antes de aplicarla y agregar un script de backfill cuando se muevan datos.
5. No editar `node_modules`, `.prisma` ni el cliente generado a mano. El cliente se regenera desde el schema.
6. En producción aplicar migraciones versionadas con `npx prisma migrate deploy`; nunca usar `db push` para cambios de datos o esquemas compartidos.
7. Todas las tablas de negocio nuevas deben tener `id String @id @default(uuid())`, `tenantId`, relación a `Tenant`, timestamps cuando corresponda e índices para las consultas del slice.

## Reglas obligatorias de multitenant

- `tenantId` se resuelve en el servidor desde el contexto autenticado y no se acepta como autoridad desde el body, query string o un valor enviado por el frontend.
- En rutas autenticadas, el JWT debe aportar el tenant asociado al usuario. El middleware debe validar que el usuario y el recurso pertenezcan al mismo tenant.
- En catálogo público, resolver el tenant primero por subdominio (`<tenant>.dominio`) o, en desarrollo/API, por `X-Tenant-ID`. El header solo es válido si el tenant existe, está activo y la ruta es pública o el usuario autenticado pertenece a él.
- Precedencia: tenant del contexto autenticado; si no existe, tenant resuelto por subdominio; como fallback controlado, `X-Tenant-ID`. Nunca mezclar fuentes sin validarlas.
- Cada query de Prisma que lea, cree, actualice o elimine datos tenant-owned debe incluir el filtro `tenantId` o derivarlo de una relación ya validada. Esto incluye `findUnique`, `findFirst`, `update`, `delete`, `upsert`, agregaciones y transacciones.
- Las relaciones cruzadas deben validar ambos lados: por ejemplo, `variantId`, `branchId` y `cartId` tienen que pertenecer al mismo tenant antes de usarse.
- Los índices únicos tenant-owned deben ser compuestos, por ejemplo `@@unique([tenantId, sku])` y `@@unique([tenantId, variantId, branchId])`.
- Un usuario nunca puede cambiar de tenant modificando un header o un campo de request. El acceso cross-tenant debe ser una capacidad administrativa explícita y auditada.
- No loguear tokens, contraseñas ni datos sensibles del cliente. Las respuestas de error no deben revelar si existe un recurso de otro tenant.

## Auth, respuestas y validación

- Access token JWT de vida corta y refresh token persistido y revocable. Las contraseñas se almacenan únicamente con hash.
- Proteger rutas con auth middleware y aplicar permisos RBAC antes de ejecutar el servicio.
- Validar params, query y body con Zod en el borde de la API.
- Usar una respuesta consistente:

```ts
{ success: true, data: T, meta?: { page?: number, pageSize?: number, total?: number } }
{ success: false, error: { code: string, message: string, details?: unknown } }
```

- Las operaciones de stock, transferencia, venta y cierre de pedido deben ser transacciones atómicas. El stock nunca puede quedar negativo.
- Mantener compatibilidad con los hooks y servicios existentes; cualquier cambio de contrato debe actualizar backend, tipos, servicio, hook y pruebas en el mismo slice.

## Forma de trabajo SDD

Trabajar por cortes verticales. Antes de implementar, identificar el slice, el contrato de aceptación y el tenant involucrado. Después de cada cambio ejecutar la prueba o build más estrecha disponible, actualizar `development-plan.md` y no marcar un check manual como completado sin evidencia del usuario.
