# CONTEXTO DEL PROYECTO
Sistema de catálogo multi-tenant. Frontend: Vite + React + TS + Tailwind. Backend: Next.js App Router + REST.
Ya tengo implementado:
- Home Marketplace en `/` (muestra productos de todos los tenants).
- Ruteo de tienda: `/t/:tenantSlug` (ej: `/t/athelnova`).
- Ruteo de producto: `/t/:tenantSlug/product/:productId`.
- Un campo `baseAttributes` (JSON) en la tabla `Product` con datos como:
  `{"medida": "60x60 cm", "material": "Porcelanato Vitrificado", "item_code": "6122"}`

# OBJETIVO
Transformar la página de catálogo del tenant (`/t/:tenantSlug`) para que tenga una experiencia de usuario similar a la referencia visual de `https://mundopiso.com.ar/catalogo/`. Específicamente, necesito:
1. Agregar una **barra lateral de filtros dinámicos** que lea los `baseAttributes` de los productos del tenant.
2. Rediseñar las **tarjetas de producto** para que muestren los atributos técnicos y badges de oferta.
3. Mejorar la página de **detalle de producto** para mostrar una ficha técnica basada en `baseAttributes`.

# ARCHIVOS A MODIFICAR / CREAR (NO rehacer los que ya existen)

## 1. `frontend/src/app/routes/web/TenantCatalog.tsx` (La página `/t/:tenantSlug`)
- **Layout**: Implementar un layout de dos columnas. Sidebar izquierdo (~250px) y Grilla de productos a la derecha.
- **Header del Catálogo**: Título "Catálogo", subtítulo con la cantidad de diseños y texto legal ("Precios por m² con IVA incluido", "Retirás en el local o depósito"). (Este header va debajo del header general de la tienda que ya existe).
- **Barra de Búsqueda y Ordenamiento**: Input de búsqueda y dropdown para ordenar por "Importancia", "Precio: Menor a Mayor", "Precio: Mayor a Menor".
- **Sidebar de Filtros (¡NUEVO!)**: Crear un componente `TenantFilterSidebar.tsx`.
    - Debe recibir los productos del tenant.
    - **Lógica dinámica**: Extraer todas las claves únicas de `baseAttributes` (ej: "material", "medida", "tipo"). Para cada clave, extraer los valores únicos y renderizar checkboxes con contadores (ej: "Porcelanato (5)", "Cerámico (2)").
    - Incluir filtro fijo de "Solo ofertas" (asumiendo que existe un campo `isOffer` o similar, o simulándolo).
    - Incluir filtro de rango de precio.
- **Grilla de Productos**: Renderizar el `TenantProductCard` en una grilla responsive (1 col en móvil, 2 en tablet, 3 en desktop).

## 2. `src/components/tenant/TenantProductCard.tsx` (Nuevo componente)
- **Imagen**: Ocupar el ancho completo, altura fija (ej: 200px). Si no hay imagen, usar un placeholder.
- **Badges**: Superpuestos en la esquina superior izquierda. Si el producto tiene `isOpportunity` o `isTrending` o `isFeatured`, mostrar etiquetas con colores (Naranja para Oportunidad, Verde para Destacado).
- **Información del Producto**:
    - Título: Nombre del producto.
    - **Subtítulo (¡NUEVO!)**: Extraer de `baseAttributes`. Mostrar en texto pequeño y gris los valores de `material` y `medida` (ej: "Porcelanato Vitrificado · 60x60 cm").
    - Precio: Mostrar el precio principal (ej: **$21.000** /m²). Si hay precio de lista, mostrar el precio tachado al lado en gris (ej: ~~$28.000~~).
- **Acción**: Mantener el botón "Agregar al carrito" actual.

## 3. `src/routes/web/ProductDetail.tsx` (La página `/t/:tenantSlug/product/:productId`)
- **Ficha Técnica (¡NUEVO!)**: Agregar una sección debajo del precio que recorra `baseAttributes` y muestre una tabla o lista de "Características: [Clave]: [Valor]".
- **Badges**: Mostrar las etiquetas de oferta/destacado cerca del título.

## 4. Tipos y Lógica de Filtros
- Revisar que el tipo `Product` tiene la estructura actual + `baseAttributes` es un JSON ejemplo: {"medida": "60x60 cm", "material": "Porcelanato Vitrificado", "item_code": "6002"} . y el tipo `Variant` tiene la relacion con el producto y el campo `attributes` (es un JSON) ejemplo: {"codigo": "YESO-CURVAS-21", "medida": "0.60 x 0.60 m"}.
- Crear un hook `useTenantFilters(products)` que devuelva la estructura de filtros para el sidebar.

# REFERENCIA VISUAL
Adjunto capturas de mi app actual (Marketplace, Tienda del Tenant, Detalle del Producto) y de la referencia de Mundo Piso.
- Mi app actual: `http://localhost/` (Marketplace), `http://localhost/t/athelnova` (Tienda actual), `http://localhost/t/athelnova/product/...` (Detalle actual).
- Referencia a imitar: `https://mundopiso.com.ar/catalogo/` (Fijarse en la barra lateral de filtros, las tarjetas con subtítulos técnicos, y los precios tachados).

# INSTRUCCIONES PARA LA IA
1.  **NO modifiques** las rutas ni la Home (`/`). Solo trabaja en la tienda del tenant (`/t/:slug`) y sus componentes asociados.
2.  **NO rompas** la lógica actual del carrito (`useCartStore`).
3.  **Utiliza** `baseAttributes` para renderizar los filtros dinámicos. Si un atributo no existe en ningún producto, no mostrar ese filtro.
4.  **Entrega** el código completo de `TenantCatalog.tsx`, `TenantProductCard.tsx`, `TenantFilterSidebar.tsx` y el hook `useTenantFilters.ts`.