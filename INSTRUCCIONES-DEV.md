Utilizalos como tres capas distintas:

## 1. `agent.md`: contexto permanente

Indica a OpenCode Go cómo debe trabajar dentro del repositorio:

- Stack y versiones reales.
- Estructura de carpetas.
- Convenciones de nombres.
- Reglas Prisma y multitenancy.
- Reglas de seguridad y validación.
- Forma de trabajo por slices.

Antes de comenzar, verifica cómo OpenCode Go carga instrucciones. Si requiere `AGENTS.md`, puedes duplicar o renombrar este archivo:

```bash
cp agent.md AGENTS.md
```

No lo uses para marcar progreso ni para describir tareas concretas.

## 2. `sdd.md`: diseño y contratos

Consultalo antes de implementar funcionalidades importantes. Allí defines:

- Arquitectura general.
- Modelo de datos actual y futuro.
- Endpoints existentes y planificados.
- Flujo de autenticación.
- Flujo objetivo de carrito, sucursal, stock y WhatsApp.

Cuando vayas a desarrollar una funcionalidad, primero verifica si está en la sección **Estado implementado** o en la arquitectura **Objetivo**. No debes pedirle a la IA que implemente directamente una sección objetivo sin convertirla antes en un slice ejecutable.

## 3. `development-plan.md`: ejecución diaria

Es el archivo operativo. Trabaja un slice por vez.

Ejemplo para comenzar:

```text
Lee agent.md, sdd.md y development-plan.md.
Quiero continuar con el Slice 0.
Audita primero el estado actual del código relacionado con tenant middleware,
RBAC y respuestas API. No implementes funcionalidades de otros slices.
Luego propón y ejecuta el primer corte vertical pequeño.
Actualiza development-plan.md solo con evidencia verificable.
```

El flujo recomendado para cada slice es:

1. Leer los tres documentos.
2. Elegir un único objetivo pendiente.
3. Auditar el código relacionado.
4. Definir criterios de aceptación.
5. Implementar backend, frontend, migración y tests necesarios.
6. Ejecutar validaciones.
7. Probar manualmente con navegador o Postman.
8. Marcar únicamente los checks demostrados como `[x]`.
9. Actualizar la sección `Progreso`.

## Orden recomendado para tu proyecto

### Paso inicial: cerrar Slice 0

Comenzaría con:

1. Corregir la aplicación efectiva de `permissionMiddleware`.
2. Auditar todas las queries para aislamiento por `tenantId`.
3. Implementar tenant context/middleware.
4. Definir el mecanismo temporal de `X-Tenant-ID`.
5. Normalizar las respuestas API.
6. Agregar tests de aislamiento entre Tenant A y Tenant B.

No comenzaría todavía con Cart/Order, porque dependerán de contratos de tenant, permisos y variantes más estables.

## Comandos de trabajo

Frontend:

```bash
cd frontend
npm run lint
npm run build
```

Backend:

```bash
cd backend
npm run lint
npm run test
npm run build
```

Prisma, desde `backend`:

```bash
npx prisma generate
npx prisma migrate dev --name nombre_del_cambio
npx prisma migrate deploy
```

## Regla para actualizar progreso

Cuando termines una tarea, pídele a la IA:

```text
Actualizar progreso del Slice 0.
Lee el código actual, ejecuta las validaciones disponibles y marca solo
los checks que estén comprobados. No marques validaciones manuales sin evidencia.
```

Para continuar:

```text
Continuar con el Slice 0.
Trabaja solo en el siguiente check pendiente relacionado con tenant/RBAC.
No avances a Slice 1 ni agregues Cart/Order todavía.
```

La idea es que `agent.md` defina **cómo trabajar**, `sdd.md` defina **qué arquitectura construir** y `development-plan.md` defina **qué hacer ahora**.