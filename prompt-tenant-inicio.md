# Recomendación: página de inicio por tenant

## Objetivo

Cuando una persona entra a la tienda de un tenant, debe llegar a una portada comercial propia de esa marca, no directamente a la grilla del catálogo. Desde esa portada podrá entender qué vende la tienda, descubrir líneas o campañas y pasar al catálogo para buscar, filtrar y comprar.

La portada y el catálogo son experiencias complementarias:

- **Inicio** inspira, orienta y comunica por qué comprar en esa tienda.
- **Catálogo** permite encontrar y comparar productos con búsqueda, filtros, ordenamiento y acceso al carrito.
- **Detalle del producto** resuelve dudas técnicas y permite continuar la compra.

## Hallazgos del proyecto actual

- El frontend es React, TypeScript, Vite y React Router; el backend es Next.js App Router, REST, Prisma y PostgreSQL.
- La ruta actual `/t/:tenantSlug` renderiza `TenantCatalog`. El detalle ya vive en `/t/:tenantSlug/product/:id`.
- `TenantProvider` resuelve la configuración pública del tenant por slug y hoy expone `id`, `name`, `slug`, `logoUrl`, `primaryColor`, `description` y `whatsappNumber`.
- El modelo `Tenant` tiene esos datos de identidad, pero todavía no tiene rubro, contenido de portada, categorías, campañas ni configuración de secciones.
- La portada global `/` es el marketplace. Debe conservarse como tal; no confundirla con la home de un tenant.
- Ya existe configuración de tenant en el panel, que puede ser el punto de entrada para ampliar la administración.

## Referencia observada

Mundo Piso separa claramente su inicio de `/catalogo/`. La portada dirige la compra con un mensaje principal, acceso por tipo de producto, una campaña destacada, una selección de ofertas, argumentos de confianza, pasos para comprar, un llamado a consultar y datos de contacto. El catálogo concentra el listado completo y la búsqueda facetada.

Tomar ese patrón de jerarquía y separación como referencia, no replicar su contenido o diseño literalmente. Las secciones deben responder a las necesidades y datos reales de cada rubro.

## Recomendación de producto

Construir una **plantilla de tienda multi-tenant configurable**, compuesta por bloques predefinidos y un tema por tenant. No crear una página completamente distinta por tenant ni un constructor visual libre al principio.

La plantilla compartida mantiene consistentes navegación, accesibilidad, comportamiento responsive, SEO, carrito y enlaces. La configuración por tenant cambia marca, rubro, contenido, imágenes, orden y selección de productos. Los bloques controlados reducen el riesgo de que un administrador rompa el diseño o publique contenido incompatible.

No conviene imponer una portada universal con las mismas categorías o filtros para todos. Construcción, electrónica, belleza y moda tienen vocabulario, atributos y formas de decidir diferentes. Compartir el motor y los tipos de bloque, pero permitir un perfil de rubro y secciones opcionales apropiadas para cada tienda.

## Estructura recomendada de la tienda

### Header compartido

- Logo y nombre del tenant.
- Navegación: **Inicio**, **Catálogo** y, si se implementa, páginas como Contacto o Ayuda.
- Acciones de búsqueda, carrito y WhatsApp según capacidades existentes.
- En móvil, menú compacto y acciones esenciales accesibles.
- El enlace del catálogo apunta a `/t/:tenantSlug/catalogo` en rutas por slug. En dominios propios o subdominios, el equivalente será `/catalogo`.

### Secciones de portada

Orden recomendado; cada sección podrá habilitarse, deshabilitarse y reordenarse:

1. **Hero/campaña principal:** imagen real del rubro, título breve, texto de apoyo y CTA. Comenzar con una imagen estática. Usar carrusel solo si el tenant administra al menos dos campañas vigentes; no rotar automáticamente contenido sin una necesidad clara.
2. **Explorar categorías o necesidades:** accesos visuales que llevan al catálogo ya filtrado. Ejemplos: porcelanatos, pisos flotantes y cerámicos; celulares, audio y computación; cuidado facial, maquillaje y cabello; carteras, perfumes y accesorios.
3. **Promoción prioritaria:** una campaña con vigencia y CTA, cuando exista. No mostrar un bloque vacío ni inventar descuentos.
4. **Productos destacados:** selección curada o automática de productos activos del tenant; cada tarjeta reutiliza componentes y reglas del catálogo.
5. **Ofertas:** solo si hay productos con precio promocional válido. La oferta debe proceder de datos reales de precio/estado, no de un badge editable desconectado del precio.
6. **Beneficios y confianza:** retiro/envío, medios de pago, garantía, asesoría u otros datos que el tenant pueda respaldar.
7. **Cómo comprar o pedir asesoramiento:** pasos ajustados al flujo real de la tienda; integrar WhatsApp solo con el número público válido del tenant.
8. **Contacto y pie de página:** ubicación, horarios, canales, políticas y enlaces legales disponibles.

No todos los bloques deben aparecer en todos los rubros. Una tienda puede comenzar con hero, categorías, destacados, beneficios y contacto; promociones, ofertas y pasos de compra se activan cuando tienen contenido útil.

### Diferencias por rubro

- **Construcción (Athelnova):** explorar por tipo de producto, ambiente o uso; destacar especificaciones, precio por unidad de venta, disponibilidad/retiro y asesoramiento. No afirmar stock en tiempo real si no está conectado a la portada.
- **Electrónica:** explorar por categoría y uso; destacar marca/modelo, especificaciones clave, garantía, financiación o disponibilidad solo cuando estén configuradas.
- **Belleza:** explorar por categoría, marca, tipo de piel/cabello o necesidad; destacar ingredientes o modo de uso solo con información revisada.
- **Carteras y perfumes:** explorar por tipo, marca, colección, ocasión o familia olfativa cuando esos datos existan; usar fotografía de producto y campañas estacionales.

El perfil de rubro sirve para sugerir etiquetas, orden inicial y bloques pertinentes; no debe limitar al tenant a una estructura rígida. Los filtros técnicos siguen perteneciendo principalmente al catálogo.

## Administración recomendada

Sí, tiene sentido administrar la portada desde el panel, pero como un **gestor de contenido estructurado**, no como un page builder libre tipo lienzo.

### Alcance mínimo del gestor

- Editar identidad básica existente y agregar el perfil de rubro.
- Editar título, texto, imagen y CTA del hero.
- Elegir y ordenar categorías o enlaces al catálogo.
- Seleccionar productos para destacados y campaña, siempre del tenant actual.
- Activar/desactivar secciones y cambiar su orden.
- Configurar texto, imagen, enlace y fechas de inicio/fin de una promoción.
- Previsualizar borrador y publicar cambios.
- Usar imágenes propias del tenant con validaciones de formato y tamaño; no depender de URL arbitrarias como único mecanismo.
- Mostrar campos opcionales, no obligatorios, para beneficios, contacto, horarios, políticas y redes.

### Lo que no recomiendo en la primera versión

- Editor visual drag-and-drop con posiciones y estilos arbitrarios.
- CSS/HTML personalizado por tenant.
- Duplicar páginas React para cada comercio.
- Crear una herramienta de CMS genérica con permisos, versionado avanzado y múltiples páginas antes de validar el uso.
- Hacer que todo el contenido se derive de `baseAttributes`: esos atributos son datos de producto, no una taxonomía editorial estable.

### Modelo de contenido

Para un MVP, se puede persistir una configuración versionada de portada asociada al tenant, con una lista ordenada de bloques de tipos conocidos. Validar toda lectura y escritura con Zod en el backend; no aceptar `tenantId` del cliente como autoridad. Para productos, categorías y campañas, guardar referencias o criterios y resolverlos dentro del tenant, verificando ownership al publicar.

Si el contenido requiere programación de campañas, historial de publicación, reutilización de colecciones, analítica o cambios por varios administradores, evolucionar a entidades propias como `TenantHomePage`, `HomeSection`, `Campaign` y `FeaturedCollection`, todas con `tenantId`, estado borrador/publicado, timestamps e índices adecuados. Evitar almacenar copias manuales de precio o stock en los bloques.

Mantener el esquema de secciones discriminado y versionado incluso si al principio se persiste como JSON. El backend debe filtrar productos inactivos y ofertas inválidas; las consultas de portada deben quedar aisladas por tenant.

## Rutas y compatibilidad

Evolución propuesta para rutas con slug:

- `/t/:tenantSlug` → portada del tenant.
- `/t/:tenantSlug/catalogo` → catálogo actual.
- `/t/:tenantSlug/product/:id` → detalle actual.

Con subdominio o dominio propio:

- `/` → portada del tenant identificado por dominio.
- `/catalogo` → catálogo de ese tenant.
- `/product/:id` → detalle de ese tenant, si se mantiene ese esquema de URL.

El marketplace raíz `/` en el dominio de la plataforma sigue intacto. Antes de cambiar el router, revisar cómo `TenantProvider` resuelve tenant por slug/dominio y cómo se construyen los enlaces de tarjetas, carrito y producto. En despliegue, los dominios de tenant deben resolver rutas del frontend con fallback de SPA. Mantener enlaces existentes a productos; no redirigir el detalle a otra tienda.

## Plan incremental sugerido

### Fase 1: escaparate funcional

- Separar la portada del catálogo sin cambiar la lógica del carrito ni el marketplace.
- Crear header público reutilizable con navegación Inicio/Catálogo.
- Renderizar portada desde datos mínimos existentes: marca, descripción, productos activos, destacados configurados o una selección segura y contacto disponible.
- Agregar secciones estructuradas iniciales: hero, categorías/enlaces, destacados, beneficios y contacto.
- Hacer que el catálogo tenga ruta hija y reutilizar en él el catálogo actual.
- Añadir estados de carga, tenant inexistente, contenido vacío e imágenes faltantes.

### Fase 2: administración

- Añadir perfil de rubro y configuración de bloques al panel de tenant.
- Incorporar selección de imágenes, productos, categorías y campaña con validación tenant-aware.
- Separar borrador y publicado para no exponer cambios incompletos.
- Añadir vista previa de escritorio y móvil.

### Fase 3: optimización comercial

- Programar campañas y promociones con vigencia.
- Colecciones y filtros de catálogo mediante URLs compartibles.
- SEO por tenant: título, descripción, imagen social, canonical y datos estructurados apropiados.
- Métricas de clic a catálogo, categorías, producto y WhatsApp para guiar qué secciones funcionan.

Implementar cada fase como corte vertical: schema/migración si aplica, API, permisos, frontend y pruebas del slice. Actualizar `development-plan.md` después de cambios implementados y dejar validaciones manuales pendientes hasta que haya evidencia.

## Decisiones recomendadas

1. Sí a una plantilla multi-tenant configurable; no a forks de frontend por tienda.
2. Sí a perfiles de rubro como presets; no a asumir que los atributos o categorías de un rubro sirven para todos.
3. Sí a un gestor de portada, limitado inicialmente a bloques conocidos, contenido y selecciones; no a un CMS visual general desde el MVP.
4. El catálogo conserva búsqueda, filtros, ordenamiento y compra. La portada destaca rutas de entrada y colecciones.
5. Promociones, precios, stock y productos deben derivarse de datos confiables del backend; el contenido editorial no puede inventar condiciones comerciales.
6. La navegación debe hacer evidente cómo volver a Inicio y cómo llegar a Catálogo desde cualquier página pública del tenant.

## Prompt de implementación para una siguiente tarea

Implementa la Fase 1 de esta recomendación en este proyecto. Antes de editar, inspecciona los componentes de navegación pública, `TenantProvider`, rutas, catálogo, tipos, API y pruebas existentes. No rehagas el catálogo ni la home marketplace: convierte `/t/:tenantSlug` en la portada del tenant, mueve el catálogo actual a `/t/:tenantSlug/catalogo` y conserva `/t/:tenantSlug/product/:id`. Reutiliza el carrito y los componentes de producto existentes. Diseña una portada responsive, con datos reales del tenant, sin contenido comercial inventado, y estados vacíos claros. Mantén aislamiento multi-tenant en todas las consultas. Añade/actualiza pruebas para el enrutamiento y el slice público afectado; ejecuta la validación más estrecha disponible y actualiza `development-plan.md` sin marcar verificaciones manuales no ejecutadas.
