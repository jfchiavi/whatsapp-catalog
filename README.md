# Arquitectura moderna y muy común: 

- Frontend rápido con Vite + React + Tailwind (para la UI) y 
- Backend potente con Next.js + TypeScript (para API routes, renderizado, etc.), comunicándose vía REST/GraphQL, ideal para aplicaciones full-stack, aunque Next.js también puede servir como frontend completo, 

esta combinación es perfectamente válida y eficiente. 

## Recomendaciones adicionales (para prod)

- HTTPS obligatorio
- Secrets fuera del repo
- Rate limit (middleware)
- CORS controlado
- Logs centralizados

### Preparación para deploy
📄 .env.production
```env
NODE_ENV=production
DATABASE_URL=postgresql://...
JWT_ACCESS_SECRET=super_secret
JWT_REFRESH_SECRET=super_secret
```

📦 Build
```bash
npm run build
npm start
```

### Docker (opcional pero recomendado)
📄 Dockerfile
```Dockerfile
FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

EXPOSE 3000
CMD ["npm", "start"]
```

### Checklist final de producción

#### Backend

 - Auth segura

 - RBAC

 - Transacciones

 - Validaciones

 - Reportes

 - Logout

 - Hardening

 - Tipado fuerte

#### Frontend

 - React Query

 - Guards por permisos

 - Dashboard

 - Reportes

 - WhatsApp flow

## NOTAS

- tener en cuenta el lote con una fecha de vencimiento, el lote se puede distribuir o ir a un solo deposito
el lote sirve para identificar si algun producto tiene fallas y demas, se puede identificar donde se vendio
a quien se vendio, etc.
- Tener en cuenta que pueden haber productos que se venzan.
- ej pigmento, si el perfume tiene vencimiento.

# 📡 Backend API – Endpoints

Backend desarrollado con **Next.js + TypeScript + PostgreSQL + Prisma**, siguiendo arquitectura modular, RBAC y buenas prácticas de producción.

---

## 🔐 Autenticación

| Método | Endpoint | Descripción |
|------|---------|-------------|
| POST | `/api/auth/login` | Login de usuario. Devuelve access y refresh token |
| POST | `/api/auth/refresh` | Genera un nuevo access token usando refresh token |
| POST | `/api/auth/logout` | Revoca el refresh token (logout real) |
| GET | `/api/auth/me` | Devuelve información del usuario autenticado |

---

## 👤 Usuarios

Gestión de usuarios del sistema con control de roles (RBAC).

| Método | Endpoint | Descripción |
|------|---------|-------------|
| GET | `/api/users` | Lista usuarios (filtrado por rol y sucursal) |
| POST | `/api/users` | Crear usuario (solo SUPER_ADMIN) |
| PUT | `/api/users/:id` | Actualizar usuario |
| DELETE | `/api/users/:id` | Eliminar usuario (solo SUPER_ADMIN) |

---

## 🏬 Sucursales

| Método | Endpoint | Descripción |
|------|---------|-------------|
| GET | `/api/branches` | Lista todas las sucursales |
| POST | `/api/branches` | Crear sucursal (solo SUPER_ADMIN) |
| PUT | `/api/branches/:id` | Actualizar sucursal |

---

## 📦 Productos

| Método | Endpoint | Descripción |
|------|---------|-------------|
| GET | `/api/products` | Lista todos los productos |
| POST | `/api/products` | Crear producto |
| GET | `/api/products/:id` | Obtener producto por ID |
| PUT | `/api/products/:id` | Actualizar producto |
| DELETE | `/api/products/:id` | Eliminar producto |

---

## 📊 Stock (Multi-Sucursal)

Gestión de stock con transacciones seguras en PostgreSQL.

| Método | Endpoint | Descripción |
|------|---------|-------------|
| GET | `/api/stock/product/:productId` | Stock de un producto por sucursal |
| POST | `/api/stock/adjust` | Ajuste manual de stock |
| POST | `/api/stock/transfer` | Transferencia de stock entre sucursales |

---

## 💰 Ventas

Las ventas descuentan stock automáticamente en una transacción.

| Método | Endpoint | Descripción |
|------|---------|-------------|
| GET | `/api/sales` | Lista de ventas |
| GET | `/api/sales/:id` | Detalle de una venta |
| POST | `/api/sales` | Crear venta (descuenta stock) |

---

## 📲 Pedidos WhatsApp

Pedidos generados desde WhatsApp que pueden convertirse en ventas.

| Método | Endpoint | Descripción |
|------|---------|-------------|
| GET | `/api/whatsapp/orders` | Lista pedidos de WhatsApp |
| POST | `/api/whatsapp/orders` | Crear pedido desde WhatsApp |
| PUT | `/api/whatsapp/orders/:id/status` | Actualizar estado del pedido |
| POST | `/api/whatsapp/orders/:id/convert-to-sale` | Convertir pedido en venta |

---

## 📈 Reportes

Endpoints optimizados para dashboards y gráficos.

| Método | Endpoint | Descripción |
|------|---------|-------------|
| GET | `/api/reports/sales?from&to` | Ventas por período |
| GET | `/api/reports/products` | Productos más vendidos |
| GET | `/api/reports/inventory` | Valorización del inventario |
| GET | `/api/reports/branches` | Comparativa de ventas por sucursal |

---

## 🔐 Seguridad & Convenciones

- Autenticación: **JWT (Access + Refresh Token)**
- Autorización: **RBAC (roles y permisos)**
- Validaciones: **Zod**
- ORM: **Prisma**
- Base de datos: **PostgreSQL**
- API: **REST**
- Transacciones críticas: **PostgreSQL**

---

## ✅ Estado del Backend

- ✔ Producción ready  
- ✔ Seguro  
- ✔ Escalable  
- ✔ Tipado fuerte  
- ✔ Integración directa con el frontend  

---

## NOTAS: para hacer el sistema multitentant

- agregar subdominios por tenant
- implementar middleware tenant-aware
- se puede comenzar con una unica DB con tentantID para todas las tablas
- luego si es necesario crear schemas por tentant

## Notas de implementacion Codigo deuda tecnica
- la tabla tentant deberia tener un campo con el dominio
- las tablas relacionadas a tentant deberian estar en una DB separada, tentant, tentantUser, etc
- la tabla productos debe tener dos o tres campos para cargar imagenes de los mismos
- la tabla de productos tambien deberia tener campos lote y vencimiento para que soporte productos con vencimiento
- las imagenes se deberian guardar en algun repositorio cloud para ello con una carpeta por tentant o dominio
- la tabla Branch debe tener los campos direccion y horarios de atencion
- convertir tu seed SQL a seed.ts
- agregar rate limit al login
- agregar búsqueda + filtros
- paginación real
- edición inline
- permisos por rol (editar / eliminar)
- tablas con shadcn/ui
- manejo de errores + toasts

### login seguro con JWT accessToken y refreshToken
- Login (OK)
- proteger rutas (RequireAuth) proteger rutas por rol, route guards
- sidebar por permisos (RBAC)
- refresh token automático (OK)
- logout global
- mejorar UX del login (loading, errors)


## para ver los enums en SQL
```sql
SELECT unnest(enum_range(NULL::"Role")) AS roles;
```

## 🔐 IMPORTANTE (camino a producción)

Backend
- Refresh token → cookie httpOnly
- /auth/refresh lee la cookie

Frontend
- ❌ No usar localStorage para refresh
- Axios → withCredentials: true

