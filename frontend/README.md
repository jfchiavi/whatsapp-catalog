# React + TypeScript + Vite

## 1 - Estructura base del proyecto
```
- Configuración inicial:
- React + Vite + TS estricto
- Tailwind v4
- React Router v6 (rutas protegidas)
- Zustand (auth)
- React Query (client + provider)
- MSW (mocks)
```

## 2 - Sistema de autenticacion completo
```
- useAuth() con Zustand
- Login real con React Hook Form + Zod
- Manejo de JWT mock
- Roles + permisos
- Expiración de sesión
- Rutas protegidas
- Sidebar que se adapta al rol
```
## 3 – Módulo crítico de Stock (core del sistema)
```
- Tipos TS para stock multi-sucursal
- Vista /stock
- Transferencias entre sucursales
- Sucursal virtual web
- Alertas de stock bajo
- Hooks:
  - useStock
  - useStockManagement
- Integración con React Query + optimistic updates
```
##  4 – Ventas + generación de PDF
```
- Flujo completo de venta
- Ticket interactivo
- Validación de stock en tiempo real
- Generación de PDF con pdf-lib
- Preview + descarga
- Hook useSales
```
## 5 – Pedidos WhatsApp
```
- Parser de mensajes
- Vista /whatsapp-orders
- Estados del pedido
- Acciones rápidas
- Simulación WhatsApp Business API
```

## 6 – Todo el dashboard, iterativo
módulo por módulo en orden profesional:
```
Auth + Layout
Productos
Stock
Ventas
WhatsApp
Reportes
```
# Base del Dashboard Administrativo

Este documento define la **estructura inicial del proyecto**, configuraciones base y componentes fundamentales para comenzar el desarrollo del dashboard de gestión de stock y ventas.

---

## 1. Inicialización del proyecto

```bash
npm create vite@latest dashboard -- --template react-ts
cd dashboard
npm install
```

### Dependencias principales

```bash
npm install react-router-dom @tanstack/react-query zustand axios
npm install react-hook-form zod @hookform/resolvers
npm install @tanstack/react-table
npm install lucide-react date-fns pdf-lib
npm install msw
```

### Dev dependencies

```bash
npm install -D tailwindcss @tailwindcss/vite postcss autoprefixer
```

---

## 2. Estructura de carpetas recomendada

```txt
src/
├── app/                # Configuración global
│   ├── router.tsx
│   ├── queryClient.ts
│   └── providers.tsx
│
├── components/         # Componentes reutilizables
│   ├── layout/
│   │   ├── DashboardLayout.tsx
│   │   ├── Sidebar.tsx
│   │   └── Topbar.tsx
│   ├── ui/
│   │   ├── Button.tsx
│   │   ├── Badge.tsx
│   │   └── Loader.tsx
│   └── auth/
│       ├── ProtectedRoute.tsx
│       └── RoleBasedRender.tsx
│
├── features/           # Módulos del sistema
│   ├── auth/
│   ├── products/
│   ├── stock/
│   ├── sales/
│   ├── whatsapp/
│   └── reports/
│
├── hooks/
│   ├── useAuth.ts
│   └── useSessionTimeout.ts
│
├── services/
│   ├── api.ts
│   └── http.ts
│
├── stores/
│   └── auth.store.ts
│
├── mocks/
│   ├── data.ts
│   ├── handlers.ts
│   └── browser.ts
│
├── types/
│   ├── auth.ts
│   ├── user.ts
│   └── common.ts
│
├── utils/
│   ├── permissions.ts
│   └── formatters.ts
│
├── main.tsx
└── index.css
```

---

## 3. Configuración de Tailwind v4

### index.css

```css
@import "tailwindcss";

@theme {
  --color-primary: #000000;
}
```

---

## 4. React Query

### src/app/queryClient.ts

```ts
import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});
```

---

## 5. Providers globales

### src/app/providers.tsx

```tsx
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from './queryClient';

export const AppProviders = ({ children }: { children: React.ReactNode }) => (
  <QueryClientProvider client={queryClient}>
    {children}
  </QueryClientProvider>
);
```

---

## 6. Router principal

### src/app/router.tsx

```tsx
import { createBrowserRouter } from 'react-router-dom';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';

export const router = createBrowserRouter([
  {
    path: '/login',
    lazy: () => import('@/features/auth/LoginPage'),
  },
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <DashboardLayout />,
        children: [
          { path: '/dashboard', lazy: () => import('@/features/dashboard/Home') },
          { path: '/products', lazy: () => import('@/features/products/ProductsPage') },
          { path: '/stock', lazy: () => import('@/features/stock/StockPage') },
        ],
      },
    ],
  },
]);
```

---

## 7. Layout base

### DashboardLayout.tsx

* Sidebar dinámico por rol
* Topbar con usuario
* `<Outlet />` para contenido

---

## 8. ProtectedRoute

### src/components/auth/ProtectedRoute.tsx

```tsx
import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '@/stores/auth.store';

export const ProtectedRoute = () => {
  const isAuthenticated = useAuthStore(s => s.isAuthenticated);
  return isAuthenticated ? <Outlet /> : <Navigate to="/login" replace />;
};
```

---

## 9. Zustand – Auth Store

### src/stores/auth.store.ts

```ts
import { create } from 'zustand';

interface AuthState {
  user: any | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (user: any, token: string) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  isAuthenticated: false,
  login: (user, token) => set({ user, token, isAuthenticated: true }),
  logout: () => set({ user: null, token: null, isAuthenticated: false }),
}));
```

---

## 10. MSW setup

### src/mocks/browser.ts

```ts
import { setupWorker } from 'msw/browser';
import { handlers } from './handlers';

export const worker = setupWorker(...handlers);
```

### main.tsx

```tsx
if (import.meta.env.VITE_USE_MOCKS === 'true') {
  const { worker } = await import('./mocks/browser');
  worker.start();
}
```

---

## Resultado

Con esta base tenés:

* Proyecto escalable
* Auth + routing protegido
* Layout profesional
* React Query listo
* MSW integrado

---



This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) (or [oxc](https://oxc.rs) when used in [rolldown-vite](https://vite.dev/guide/rolldown)) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...

      // Remove tseslint.configs.recommended and replace with this
      tseslint.configs.recommendedTypeChecked,
      // Alternatively, use this for stricter rules
      tseslint.configs.strictTypeChecked,
      // Optionally, add this for stylistic rules
      tseslint.configs.stylisticTypeChecked,

      // Other configs...
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```

# DASHBOARD
## Sistema de Autenticación
  Este módulo implementa autenticación completa con roles y permisos, alineada al dashboard multi-sucursal.

## Flujo actual

- Usuario hace login

- Se guarda user + token

- Router protege rutas

- Sidebar se adapta automáticamente

- El rol define qué puede ver y hacer

## Módulo de Stock Multi‑Sucursal

Este módulo implementa el core del sistema: gestión de stock por producto y sucursal, incluyendo sucursal virtual web, transferencias, alertas y movimientos con React Query + optimistic updates.

6. Reposición de Stock Web (concepto)

Flujo recomendado:

Sucursal Física → Transferencia → Sucursal Web (virtual)

Condición:

Si stock_web <= minWebStock

Mostrar alerta + botón Reponer desde sucursal

Esta acción reutiliza transferStock.

## Resultado

Con este módulo ya tenés:

Stock multi‑sucursal real

Sucursal virtual web separada

Alertas visuales

Transferencias con optimistic updates

Base sólida para ventas y WhatsApp

Qué quedó resuelto

✅ Stock por producto y sucursal

✅ Sucursal virtual web como stock independiente

✅ Alertas de stock bajo (visual + lógica)

✅ Transferencias entre sucursales

✅ Optimistic updates con React Query

✅ Base para historial de movimientos

✅ API layer mock-ready → backend real sin refactor

Este diseño evita conflictos online/offline, escala bien y es exactamente el patrón que se usa en retail real.

## Flujo clave ya implementado

El catálogo web consume solo stock de branch-web

Ventas físicas descuentan stock de sucursal física

Cuando branch-web baja del mínimo → alerta

Reposición = transferencia controlada

Todo queda trazable por movimientos

# Módulo de Ventas

Este módulo implementa el flujo completo de ventas, integrado con stock multi‑sucursal y generación de comprobantes en PDF.

# Módulo de Pedidos WhatsApp

Este módulo conecta el catálogo público con el dashboard, permitiendo gestionar pedidos recibidos por WhatsApp, procesarlos y convertirlos en ventas reales.

Es el puente entre:

Catálogo público

Ventas

Stock web

Ahí cerramos el círculo:

Mensaje → pedido → venta → stock → comprobante


## La ProductsPage va a tener:
```text
✅ Tabla profesional

columnas claras

acciones por fila

loading / empty / error states

responsive

✅ ABM completo

Crear producto (modal)

Editar producto (modal)

Eliminar producto (confirmación)

✅ Buenas prácticas

React Query

invalidación de cache

optimistic UX

backend real
```