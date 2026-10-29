[x] al acceder a http://localhost/dashboard/storefront aparece el error: Algo salió mal
Cannot read properties of undefined (reading 'title')

  Resuelto: el reporte venía de un bundle viejo (era `content.hero.title` cuando el
  backend ya devuelve contenido v2 con `sections`). El rework del Slice 1.3 lo
  eliminó. Verificado con navegador headless sobre el build actual: la página carga
  completa con cero excepciones de JS.

[x] errores en la consola del browser:
  index-BMfcuxk5.js:14 
 GET http://localhost/api/branches 401 (Unauthorized)
index-BMfcuxk5.js:14 
 GET http://localhost/api/branches 401 (Unauthorized)
index-BMfcuxk5.js:14 
 POST http://localhost/api/carts 500 (Internal Server Error)

index-BMfcuxk5.js:14 
 GET http://localhost/api/branches 401 (Unauthorized)
index-BMfcuxk5.js:14 
 GET http://localhost/api/carts/fc9fb0d6-b0ac-46e7-9449-87a85d3e9fa0?tenantId=0b95f160-f948-5ac3-921a-56029e130fa9 404 (Not Found)

  Resuelto:
  - 401 en /api/branches: el carrito público ahora usa el endpoint nuevo
    GET /api/catalog/branches (solo X-Tenant-ID, sin auth).
  - 500 en POST /api/carts: `getOrCreateCart` reescrito (reactiva carritos
    expirados, limpia los enviados y maneja la carrera por unique (tenantId,
    sessionId)). Verificado con curl: expirado → mismo id; enviado → carrito nuevo;
    3 creaciones en paralelo → mismo id.
  - 404 en GET /api/carts/:id: el id almacenado ahora se limpia al fallar y se
    crea uno nuevo. Además se eliminó el `GET /carts/` con id vacío que tiraba 405
    en la primera carga.
  E2E anónimo en navegador: traza sin ningún 401/404/405/500.

[x] el boton agregar al carrito no funciona

  Resuelto: la raíz era que el carrito tomaba el tenant solo de la sesión de login
  (en tiendas públicas no hay usuario → tenantId null → el click se ignoraba).
  Ahora el tenant resuelve desde el contexto público de la tienda (TenantProvider)
  y, si el carrito todavía no existe o la query falló, `add()` lo crea bajo demanda
  en vez de hacer un no-op silencioso. Verificado E2E: click → POST /items 201 →
  badge "1" → producto en el drawer.

[x] al seleccionar el icono del carrito no muestra nada seleccionado, y en cambio muestra un selector que dice seleccionar sucursal. eso deberia ser automatico segun donde estoy parado deberia saber a que carrito esta cargando los productos.

  Resuelto: la sucursal se auto-selecciona (primera activa del tenant) apenas
  carga el carrito; con una sola sucursal se muestra como texto y con varias el
  selector aparece ya preseleccionado (sin "Seleccionar sucursal..."). Arreglado de
  paso un loop que reenviaba PATCH /branch en cada render y cancelaba el refetch
  del carrito. Verificado E2E: select con valor seteado y solo un ciclo de
  requests.

---

Verificación final: 86 tests backend pasan, builds frontend/backend OK, Docker
reconstruido (frontend + backend). Pendiente solo de tu re-test manual en browser.
