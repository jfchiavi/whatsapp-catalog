# Autenticación y Roles

## Flujo de autenticación

### SUPER_ADMIN (sin tenant)

```
1. Login → POST /api/auth/login
   { email: "admin@demo.com", password: "123456" }

2. JWT generado con:
   { userId: "xxx", role: "SUPER_ADMIN", tenantId: null }

3. En cada request, authMiddleware decodifica el JWT
   → auth.tenantId = null

4. Rutas de plataforma (/api/platform/*)
   → Validan auth.role === 'SUPER_ADMIN'
   → NO necesitan tenantId

5. Rutas de negocio (/api/products, /api/branches, etc.)
   → requireTenantId(auth.tenantId) lanza error
   → "Tenant ID is required"
   → SUPER_ADMIN no puede acceder a datos de un tenant específico
```

### ADMIN / BRANCH_MANAGER / SELLER (con tenant)

```
1. Login → POST /api/auth/login
   { email: "seller@demo.com", password: "123456" }

2. JWT generado con:
   { userId: "yyy", role: "SELLER", tenantId: "0b95f160-..." }

3. En cada request, authMiddleware decodifica el JWT
   → auth.tenantId = "0b95f160-..."

4. Rutas de plataforma (/api/platform/*)
   → Validan auth.role === 'SUPER_ADMIN'
   → ADMIN/SELLER reciben 403

5. Rutas de negocio (/api/products, etc.)
   → requireTenantId(auth.tenantId) retorna el string
   → Todas las queries filtran por tenantId automáticamente
```

## Dónde se usa cada cosa

```
backend/src/lib/auth.ts
├── generateAccessToken({ tenantId: null })     ← SUPER_ADMIN
├── generateAccessToken({ tenantId: "abc" })    ← Otros roles
├── verifyAccessToken()                         ← Decodifica JWT
└── requireTenantId(tenantId)                   ← Valida y retorna string

backend/src/middlewares/auth.middleware.ts
└── authMiddleware(req) → retorna payload del JWT (con tenantId nullable)

backend/src/app/api/platform/tenants/route.ts
└── if (auth.role !== 'SUPER_ADMIN') → 403

backend/src/app/api/products/route.ts
└── requireTenantId(auth.tenantId) → valida que haya tenant
```

## En el frontend

```
auth.store.ts
├── user.tenantId = null      ← SUPER_ADMIN
└── user.tenantId = "abc"     ← Otros roles

sidebar.config.ts
├── "Plataforma" permission: 'tenants'  → Solo SUPER_ADMIN
├── "Tenants"   permission: 'tenants'  → Solo SUPER_ADMIN
└── "Usuarios"  permission: 'users'    → ADMIN + SUPER_ADMIN
```

## Resumen visual

```
SUPER_ADMIN  →  tenantId: null  →  /api/platform/* (OK)
                            ↓
                      /api/products/* → ERROR "Tenant ID required"

ADMIN        →  tenantId: "abc" →  /api/platform/* → 403 Forbidden
                            ↓
                      /api/products/* → OK (filtra por tenant)
                      /api/users/*    → OK (solo usuarios de su tenant)
```
