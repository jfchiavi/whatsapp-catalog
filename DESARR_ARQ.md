# Diseño y Arquitectura — WhatsApp Catalog

## 1. Arquitectura de Alto Nivel

```mermaid
graph TB
    subgraph Usuarios["Usuarios"]
        SA["SUPER_ADMIN<br/>Desarrollador"]
        AD["ADMIN<br/>Dueño Tenant"]
        BM["BRANCH_MANAGER<br/>Gerente Sucursal"]
        SE["SELLER<br/>Vendedor"]
        CL["CLIENTE<br/>Comprador Público"]
    end

    subgraph Frontend["Frontend — React + Vite + Tailwind"]
        PUB["Rutas Públicas<br/>/ Marketplace<br/>/t/:slug Catálogo"]
        DASH["Dashboard Autenticado<br/>/dashboard /platform<br/>/products /stock /sales<br/>/orders /reports /users"]
    end

    subgraph Backend["Backend — Next.js App Router"]
        MW["Middleware<br/>authMiddleware JWT<br/>permissionMiddleware RBAC<br/>tenantMiddleware tenant"]
        API["API Routes /api<br/>auth platform products<br/>catalog branches stock<br/>sales orders carts<br/>whatsapp reports users"]
        SVC["Services<br/>cart order sale stock<br/>product variant branch<br/>user platform catalog"]
    end

    subgraph DB["Base de Datos — PostgreSQL + Prisma ORM"]
        TABLAS["Tenant User Branch<br/>Product Variant Stock<br/>Sale Order Cart<br/>StockMovement WhatsappOrder<br/>Customer"]
    end

    SA --> DASH
    AD --> DASH
    BM --> DASH
    SE --> DASH
    CL --> PUB

    PUB --> MW
    DASH --> MW
    MW --> API
    API --> SVC
    SVC --> TABLAS

    style Usuarios fill:#e1f5fe,stroke:#0288d1
    style Frontend fill:#f3e5f5,stroke:#7b1fa2
    style Backend fill:#e8f5e9,stroke:#388e3c
    style DB fill:#fff3e0,stroke:#f57c00
```

---

## 2. Modelo Multi-Tenant

```mermaid
graph TB
    subgraph Platform["PLATAFORMA — Sistema WhatsApp Catalog"]
        SA2["SUPER_ADMIN<br/>tenantId: null<br/>Acceso global"]

        subgraph TenantA["Tenant A — Demo Tenant"]
            direction LR
            UA["Usuarios"] --> PA["Productos"] --> BA["Sucursales"]
            BA --> SA3["Stock"] --> VA["Ventas"]
            VA --> OA["Pedidos"]
        end

        subgraph TenantB["Tenant B — Fashion Tenant"]
            direction LR
            UB["Usuarios"] --> PB["Productos"] --> BB["Sucursales"]
            BB --> SB["Stock"] --> VB["Ventas"]
            VB --> OB["Pedidos"]
        end
    end

    SA2 -->|"gestiona"| TenantA
    SA2 -->|"gestiona"| TenantB

    CA["Cliente → /t/demo"] --> TenantA
    CB["Cliente → /t/fashion"] --> TenantB

    style Platform fill:#fafafa,stroke:#616161
    style TenantA fill:#e3f2fd,stroke:#1565c0
    style TenantB fill:#fce4ec,stroke:#c62828
```

**Reglas de aislamiento:**
- Cada entidad de negocio tiene `tenantId` y relación a `Tenant`
- Todas las queries filtran por `tenantId` automáticamente
- `tenantId` se resuelve desde JWT (rutas autenticadas) o `X-Tenant-ID` (catálogo público)
- SUPER_ADMIN opera sin tenantId — ve datos de todos los tenants

---

## 3. Modelo de Roles y Permisos

### Jerarquía de Roles

```mermaid
graph TD
    SA["SUPER_ADMIN<br/>Desarrollador / Plataforma<br/>tenantId: null"]
    AD["ADMIN<br/>Dueño del Tenant<br/>tenantId asignado"]
    BM["BRANCH_MANAGER<br/>Gerente de Sucursal<br/>tenantId + branchId"]
    SE["SELLER<br/>Vendedor<br/>tenantId + branchId"]

    SA -->|"crea y gestiona"| AD
    AD -->|"crea y asigna"| BM
    AD -->|"crea y asigna"| SE

    style SA fill:#e8eaf6,stroke:#283593
    style AD fill:#e3f2fd,stroke:#1565c0
    style BM fill:#e8f5e9,stroke:#2e7d32
    style SE fill:#fff3e0,stroke:#ef6c00
```

### Matriz de Permisos

| Permiso | SUPER_ADMIN | ADMIN | BRANCH_MANAGER | SELLER |
|---------|:-----------:|:-----:|:--------------:|:------:|
| dashboard | ✓ | ✓ | ✓ | ✓ |
| tenants | ✓ | - | - | - |
| users | ✓ | ✓ | - | - |
| products | ✓ | ✓ | ✓ | - |
| stock | ✓ | ✓ | ✓ | - |
| sales | ✓ | ✓ | ✓ | ✓ |
| reports | ✓ | ✓ | ✓ | - |
| whatsapp_orders | ✓ | ✓ | - | ✓ |

> **Nota:** SUPER_ADMIN tiene todos los permisos pero NO accede a módulos tenant-scoped porque no tiene tenantId.

### Sidebar por Rol

```mermaid
graph LR
    subgraph SA_Sidebar["SUPER_ADMIN"]
        SA1["Dashboard"]
        SA2["Plataforma"]
        SA3["Tenants"]
        SA4["Reportes"]
    end

    subgraph AD_Sidebar["ADMIN"]
        AD1["Dashboard"]
        AD2["Configuración"]
        AD3["Usuarios"]
        AD4["Productos"]
        AD5["Stock"]
        AD6["Ventas"]
        AD7["Pedidos"]
        AD8["Pedidos WhatsApp"]
        AD9["Reportes"]
    end

    subgraph BM_Sidebar["BRANCH_MANAGER"]
        BM1["Dashboard"]
        BM2["Productos"]
        BM3["Stock"]
        BM4["Ventas"]
        BM5["Pedidos"]
        BM6["Reportes"]
    end

    subgraph SE_Sidebar["SELLER"]
        SE1["Dashboard"]
        SE2["Ventas"]
        SE3["Pedidos WhatsApp"]
    end

    style SA_Sidebar fill:#e8eaf6,stroke:#283593
    style AD_Sidebar fill:#e3f2fd,stroke:#1565c0
    style BM_Sidebar fill:#e8f5e9,stroke:#2e7d32
    style SE_Sidebar fill:#fff3e0,stroke:#ef6c00
```

---

## 4. Casos de Uso por Rol

### 4.1 SUPER_ADMIN — Panel de Plataforma

```mermaid
graph TD
    SA["SUPER_ADMIN<br/>Desarrollador"]

    SA --> M["Monitoreo de Plataforma"]
    SA --> T["Gestión de Tenants"]
    SA --> R["Reportes Globales"]

    M --> M1["Ver métricas globales<br/>total tenants, usuarios,<br/>productos, pedidos"]
    M --> M2["Ver tenants recientes"]
    M --> M3["Ver reportes agregados<br/>de TODOS los tenants"]

    T --> T1["Listar tenants con stats"]
    T --> T2["Crear nuevo tenant<br/>slug, config, WhatsApp"]
    T --> T3["Editar tenant<br/>nombre, logo, color"]
    T --> T4["Desactivar tenant"]

    R --> R1["Comparación de ventas<br/>entre tenants"]
    R --> R2["Top productos<br/>de la plataforma"]
    R --> R3["Métricas de uso"]

    style SA fill:#e8eaf6,stroke:#283593
```

### 4.2 ADMIN — Gestión del Tenant

```mermaid
graph TD
    AD["ADMIN<br/>Dueño del Tenant"]

    AD --> C["Configuración Tienda"]
    AD --> U["Gestión de Usuarios"]
    AD --> I["Gestión de Inventario"]
    AD --> V["Ventas y Pedidos"]
    AD --> RP["Reportes"]

    C --> C1["Editar nombre, logo,<br/>color de la tienda"]
    C --> C2["Configurar WhatsApp"]
    C --> C3["Configurar dominio"]
    C --> C4["Vista previa tienda web"]

    U --> U1["Listar usuarios del tenant"]
    U --> U2["Crear usuario<br/>ADMIN / BRANCH_MGR / SELLER"]
    U --> U3["Asignar sucursal"]
    U --> U4["Activar / desactivar"]

    I --> I1["Crear / editar productos<br/>y variantes"]
    I --> I2["Gestionar stock por sucursal"]
    I --> I3["Ajustar stock"]
    I --> I4["Transferir entre sucursales"]

    V --> V1["Crear ventas manuales"]
    V --> V2["Gestionar pedidos<br/>del carrito público"]
    V --> V3["Procesar pedidos de WhatsApp"]
    V --> V4["Ver historial de ventas"]

    RP --> RP1["Ventas por período y sucursal"]
    RP --> RP2["Top productos"]
    RP --> RP3["Comparación entre sucursales"]

    style AD fill:#e3f2fd,stroke:#1565c0
```

### 4.3 BRANCH_MANAGER — Gestión de Sucursal

```mermaid
graph TD
    BM["BRANCH_MANAGER<br/>Gerente de Sucursal"]

    BM --> S["Stock de Mi Sucursal"]
    BM --> V["Ventas y Pedidos"]
    BM --> R["Reportes de Sucursal"]

    S --> S1["Ver stock por variante"]
    S --> S2["Ajustar stock — entradas manuales"]
    S --> S3["Solicitar transferencias"]
    S --> S4["Recibir transferencias"]
    S --> S5["Ver historial de movimientos"]

    V --> V1["Crear ventas en mi sucursal"]
    V --> V2["Gestionar pedidos asignados"]
    V --> V3["Cambiar estados de pedido"]
    V --> V4["Confirmar pedidos — descontar stock"]

    R --> R1["Ventas de mi sucursal"]
    R --> R2["Stock actual"]
    R --> R3["Movimientos de inventario"]

    style BM fill:#e8f5e9,stroke:#2e7d32
```

### 4.4 SELLER — Venta y Pedidos

```mermaid
graph TD
    SE["SELLER<br/>Vendedor"]

    SE --> V["Ventas"]
    SE --> W["Pedidos WhatsApp"]
    SE --> D["Dashboard"]

    V --> V1["Crear venta rápida<br/>producto + variante + cantidad"]
    V --> V2["Registrar método de pago"]
    V --> V3["Imprimir comprobante"]

    W --> W1["Ver pedidos por WhatsApp"]
    W --> W2["Procesar pedido"]
    W --> W3["Marcar completado"]

    D --> D1["Resumen de ventas del día"]
    D --> D2["Pedidos pendientes"]

    style SE fill:#fff3e0,stroke:#ef6c00
```

---

## 5. Flujo de la Tienda Web (Catálogo Público)

```mermaid
sequenceDiagram
    participant C as Cliente
    participant FE as Frontend
    participant BE as Backend
    participant DB as PostgreSQL
    participant WA as WhatsApp

    Note over C,WA: 1. Catálogo
    C->>FE: Visita /t/demo
    FE->>BE: GET /api/catalog/products
    BE->>DB: SELECT products WHERE tenantId AND active
    DB-->>BE: Productos del tenant
    BE-->>FE: Lista de productos
    FE-->>C: Muestra catálogo

    Note over C,WA: 2. Selección
    C->>FE: Click en producto
    FE->>BE: GET /api/catalog/products/:id
    BE-->>FE: Producto con variantes
    FE-->>C: Detalle con variantes y precios

    Note over C,WA: 3. Carrito
    C->>FE: Agregar al carrito
    FE->>BE: POST /api/carts/:id/items
    BE->>DB: Validar stock en sucursal
    DB-->>BE: Stock OK
    BE-->>FE: Item agregado

    Note over C,WA: 4. Checkout
    C->>FE: Seleccionar sucursal + Comprar por WhatsApp
    FE->>BE: POST /api/orders
    BE->>DB: Crear Order + snapshot precios
    BE-->>FE: Order creada + whatsappUrl
    FE->>WA: Abrir wa.me con mensaje pre-armado
    WA-->>C: Chat con representante

    Note over C,WA: 5. Gestión interna
    Note right of BE: Vendedor ve pedido en /orders
    Note right of BE: Confirma → descuenta stock
```

---

## 6. Flujo de Pedidos WhatsApp (Legacy)

```mermaid
sequenceDiagram
    participant C as Cliente
    participant WA as WhatsApp
    participant BE as Backend
    participant V as Vendedor

    C->>WA: Envía mensaje al número del tenant
    WA->>BE: Captura el mensaje
    BE->>BE: Almacena en WhatsappOrder status: pending

    V->>BE: GET /api/whatsapp/orders
    BE-->>V: Lista de pedidos
    V->>V: Lee mensaje crudo del cliente

    V->>BE: PUT status: processing
    V->>WA: Contacta al cliente
    C->>WA: Confirma cantidades

    V->>BE: PUT status: completed
    BE-->>V: Pedido completado
```

### Diferencia: Orders vs WhatsApp Orders

| Característica | Orders (Nuevo) | WhatsApp Orders (Legacy) |
|---------------|----------------|--------------------------|
| Origen | Carrito web → checkout | Mensaje directo de WhatsApp |
| Estructura | Items, variantes, precios snapshot | Texto crudo del mensaje |
| Stock | Validado y descontado al confirmar | No valida stock automáticamente |
| Trazabilidad | Order → Sale con items detallados | Solo mensaje y total estimado |
| Uso actual | Flujo principal de compra | Compatibilidad con mensajes existentes |

---

## 7. Estructura del Código

```
whatsapp-catalog/
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma          # Modelo de datos
│   │   └── migrations/            # Migraciones versionadas
│   ├── src/
│   │   ├── app/api/               # Route Handlers (App Router)
│   │   │   ├── auth/              # Login, refresh, me, tenants
│   │   │   ├── platform/          # SUPER_ADMIN: tenants, stats
│   │   │   ├── products/          # CRUD productos/variantes
│   │   │   ├── catalog/           # Catálogo público
│   │   │   ├── branches/          # CRUD sucursales
│   │   │   ├── stock/             # Stock, ajustes, transferencias
│   │   │   ├── sales/             # Ventas
│   │   │   ├── orders/            # Pedidos (carrito → WhatsApp)
│   │   │   ├── carts/             # Carrito server-side
│   │   │   ├── whatsapp/          # Pedidos WhatsApp (legacy)
│   │   │   ├── reports/           # Reportes y gráficos
│   │   │   ├── users/             # Gestión de usuarios
│   │   │   └── tenants/           # Configuración de tenant
│   │   ├── modules/               # Lógica de negocio
│   │   │   ├── platform/          # platform.service.ts
│   │   │   ├── users/             # user.service.ts
│   │   │   ├── branches/          # branch.service.ts
│   │   │   ├── stock/             # stock.service.ts
│   │   │   ├── sales/             # sale.service.ts
│   │   │   ├── orders/            # order.service.ts
│   │   │   ├── cart/              # cart.service.ts
│   │   │   ├── whatsapp/          # whatsapp.service.ts
│   │   │   ├── products/          # product.service.ts
│   │   │   ├── variants/          # variant.service.ts
│   │   │   ├── reports/           # report.service.ts
│   │   │   └── catalog/           # catalog.service.ts
│   │   ├── lib/                   # Utilidades compartidas
│   │   │   ├── auth.ts            # JWT, hash, requireTenantId
│   │   │   ├── prisma.ts          # Cliente Prisma
│   │   │   ├── errors.ts          # AppError, handleError
│   │   │   └── permissions.ts     # rolePermissions, hasPermission
│   │   ├── middlewares/           # Middleware de auth/permisos
│   │   │   ├── auth.middleware.ts
│   │   │   ├── permission.middleware.ts
│   │   │   └── tenant.middleware.ts
│   │   └── validators/            # Schemas Zod
│   │       ├── user.schema.ts
│   │       ├── sale.schema.ts
│   │       ├── branch.schema.ts
│   │       └── ...
│   └── tests/                     # Tests Vitest
│
├── frontend/
│   └── src/
│       ├── app/                   # Router y layouts
│       │   ├── router.tsx
│       │   └── routes/web/        # Rutas públicas
│       ├── features/              # Páginas por feature
│       │   ├── auth/              # LoginPage
│       │   ├── dashboard/         # Home, Dashboard
│       │   ├── platform/          # TenantsPage, PlatformDashboard
│       │   ├── products/          # ProductsPage
│       │   ├── stock/             # StockPage
│       │   ├── sales/             # SalesListPage, CreateSalePage
│       │   ├── orders/            # OrdersPage, OrderDetailPage
│       │   ├── whatsapp/          # WhatsAppOrdersPage
│       │   ├── reports/           # ReportsPage
│       │   ├── users/             # UsersPage
│       │   └── settings/          # TenantSettingsPage
│       ├── components/            # Componentes reutilizables
│       │   ├── cart/              # CartDrawer, CartItem, CartSummary
│       │   ├── product/           # ProductCard, ProductActions
│       │   ├── header/            # Header, CartButton
│       │   └── dashboard/         # Layout, Sidebar, ProtectedRoute
│       ├── hooks/                 # Hooks React Query
│       ├── services/              # Clientes API (Axios)
│       ├── store/                 # Zustand (auth, cart)
│       ├── types/                 # Tipos TypeScript
│       ├── config/                # Sidebar, rolePermissions
│       └── lib/                   # Utilidades (whatsapp.ts)
│
├── seed-docker.sql                # Datos de prueba
├── reset-docker.sh                # Reset del entorno Docker
├── development-plan.md            # Plan de desarrollo por slices
├── AUTH_ROLES.md                  # Documentación de autenticación
├── FIXES.md                       # Issues y fixes pendientes
└── DESArN_ARQ.md                  # Este documento
```

---

## 8. Stack Tecnológico

| Capa | Tecnología | Versión |
|------|-----------|---------|
| Frontend | React | 19.2.x |
| Frontend | TypeScript | 5.9.x |
| Frontend | Vite | 7.2.x |
| Frontend | Tailwind CSS | 4.1.x |
| Frontend | React Router | 7.x |
| Frontend | TanStack React Query | 5.x |
| Frontend | Zustand | 5.x |
| Frontend | React Hook Form + Zod | - |
| Frontend | Axios | - |
| Backend | Next.js (App Router) | 16.1.1 |
| Backend | TypeScript | 5.x |
| Backend | Zod | 4.x |
| Backend | JWT (jsonwebtoken) | - |
| Backend | bcryptjs | - |
| ORM | Prisma | 5.22.x |
| DB | PostgreSQL | 16 (Docker) |
| Testing | Vitest (backend) | - |
| Testing | MSW (frontend mocks) | - |

---

## 9. Convenciones de Desarrollo

### Flujo para crear una nueva feature

```mermaid
graph LR
    S1["1. Schema<br/>prisma/schema.prisma"] --> S2["2. Migración<br/>prisma migrate dev"]
    S2 --> S3["3. Service<br/>modules/feat/feat.service.ts"]
    S3 --> S4["4. Validator<br/>validators/feat.schema.ts"]
    S4 --> S5["5. Route<br/>app/api/feat/route.ts"]
    S5 --> S6["6. API Client<br/>services/feat.api.ts"]
    S6 --> S7["7. Hooks<br/>hooks/useFeat.ts"]
    S7 --> S8["8. Page<br/>features/feat/FeatPage.tsx"]
    S8 --> S9["9. Router<br/>router.tsx"]
    S9 --> S10["10. Sidebar<br/>sidebar.config.ts"]
    S10 --> S11["11. Tests<br/>tests/feat.test.ts"]

    style S1 fill:#e8eaf6,stroke:#283593
    style S2 fill:#e8eaf6,stroke:#283593
    style S3 fill:#e3f2fd,stroke:#1565c0
    style S4 fill:#e3f2fd,stroke:#1565c0
    style S5 fill:#e8f5e9,stroke:#388e3c
    style S6 fill:#f3e5f5,stroke:#7b1fa2
    style S7 fill:#f3e5f5,stroke:#7b1fa2
    style S8 fill:#f3e5f5,stroke:#7b1fa2
    style S9 fill:#f3e5f5,stroke:#7b1fa2
    style S10 fill:#f3e5f5,stroke:#7b1fa2
    style S11 fill:#fff3e0,stroke:#f57c00
```

### Contrato de respuesta API

```json
// Éxito:
{ "success": true, "data": T, "meta": { "page": 1, "total": 100 } }

// Error:
{ "success": false, "error": { "code": "VALIDATION_ERROR", "message": "..." } }
```

### Reglas de multitenant

- `tenantId` se resuelve en el servidor desde el JWT
- Nunca enviar `tenantId` desde el frontend en rutas autenticadas
- Todas las queries de negocio incluyen filtro `tenantId`
- SUPER_ADMIN opera sin tenantId (acceso global)
