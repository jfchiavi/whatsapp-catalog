# Plan: Catálogo Multi-Tenant + Marketplace Global

## Objetivo

Implementar un sistema de catálogo público donde cada tenant tenga su propia página de catálogo (accesible por dominio custom, subdominio o fallback en desarrollo), con configuración independiente (nombre, logo, colores, WhatsApp, descripción, categorías). Además, un marketplace público que muestre productos de todos los tenants.

---

## Arquitectura de URLs

```
Producción:
  mitienda.com          → Tenant "Mi Tienda" (dominio custom)
  demo.plataforma.com   → Tenant "Demo" (subdominio)
  plataforma.com        → Marketplace global

Desarrollo:
  localhost/t/demo       → Catálogo Demo Tenant
  localhost/t/fashion    → Catálogo Fashion Tenant
  localhost/             → Marketplace global
  localhost:3000         → Backend API
```

---

## Fase 1: Schema y Backend - Tenant Config

### 1.1 Migración Prisma

Agregar campos de configuración al modelo `Tenant`:

```prisma
model Tenant {
  id              String   @id @default(uuid())
  name            String
  slug            String   @unique
  domain          String?  @unique
  logoUrl         String?
  primaryColor    String?  @default("#000000")
  description     String?
  whatsappNumber  String?
  active          Boolean  @default(true)
  // ... relaciones existentes sin cambios
}
```

### 1.2 API: Resolución de tenant

Crear `GET /api/tenant/resolve`:
- Query params: domain, slug
- Headers: X-Tenant-ID (fallback desarrollo)
- Response: tenant config pública

### 1.3 API: Marketplace

Crear `GET /api/marketplace/products`:
- Sin auth, sin X-Tenant-ID
- Productos activos de TODOS los tenants
- Incluye tenant info

### 1.4 Actualizar seed

Agregar slug, domain, logoUrl, primaryColor, description, whatsappNumber.

---

## Fase 2: Frontend - Tenant Context

### 2.1 TenantProvider
Detecta tenant desde dominio/subdominio/param, llama resolve API.

### 2.2 useTenant hook
Retorna TenantConfig del context.

### 2.3 Actualizar servicios
Catalog usa tenant del context. Nuevo service marketplace.

---

## Fase 3: Páginas

### 3.1 /t/:slug — Catálogo por tenant
Reutiliza Home, ProductDetail, Search existentes.

### 3.2 / — Marketplace global
Productos de todos los tenants con badge de tenant.

---

## Fase 4: Fixes de carrito

- Aislamiento por tenant en localStorage
- Deduplicación de items
- Fix CartItem.tsx (imageUrl, variant.price)
- WhatsApp con config del tenant

---

## Fase 5: Configuración UI

- /dashboard/settings — Formulario para SUPER_ADMIN
- PUT /api/tenants/:id/config

---

## Archivos clave

### Backend
- `backend/prisma/schema.prisma`
- `backend/src/app/api/tenant/resolve/route.ts`
- `backend/src/app/api/marketplace/products/route.ts`
- `backend/seed-docker.sql`

### Frontend
- `frontend/src/app/providers/TenantProvider.tsx`
- `frontend/src/hooks/useTenant.ts`
- `frontend/src/app/routes/web/TenantCatalog.tsx`
- `frontend/src/app/routes/web/Marketplace.tsx`
- `frontend/src/app/router.tsx`
- `frontend/src/store/cart.store.ts`
- `frontend/src/lib/whatsapp.ts`
