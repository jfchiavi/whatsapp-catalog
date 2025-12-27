# React + TypeScript + Vite

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