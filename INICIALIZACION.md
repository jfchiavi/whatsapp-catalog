# Inicialización del entorno Docker

## Levantando todo desde cero

```bash
./reset-docker.sh
```

El script pregunta:
1. **¿Eliminar volumen de PostgreSQL?** → Solo responder `y` si querés una base limpia
2. **¿Reseed database?** → Solo si no borraste el volumen y querés repoblar datos

## Flujo de inicialización

Cuando ejecutás `docker-compose up --build`:

```
1. PostgreSQL inicia
   └─ Si el volumen de datos está vacío → ejecuta seed-docker.sql automáticamente
   └─ Si el volumen tiene datos → no hace nada (los datos persisten)

2. Backend inicia
   └─ Espera a que PostgreSQL esté healthy
   └─ Ejecuta prisma migrate deploy (migraciones versionadas)
   └─ Ejecuta prisma generate (cliente Prisma)

3. Frontend inicia
   └─ Servido por nginx en puerto 80
```

## Scripts disponibles

### reset-docker.sh
Script principal. Detiene contenedores, pregunta por volumen y seed, rebuild y levanta todo.

### seed-data.sh
Seed standalone que se ejecuta **dentro** del contenedor backend:
```bash
docker exec catalog_backend sh seed-data.sh
```
Se ejecuta automáticamente si respondés `Y` a la pregunta de reseed.

## Estructura de datos inicial

El seed crea un tenant `Demo Tenant` (`tenant-demo`) con:

| Tabla | Cantidad | Notas |
|---|---|---|
| Branch | 2 | Sucursal Central (physical), Tienda Online (virtual) |
| User | 3 | admin@demo.com, manager@demo.com, seller@demo.com |
| Product | 3 | Remera Oversize, Pantalón Jean Slim, Zapatillas Urban Run |
| Variant | 8 | SKUs: REM-NEG-S/M/L, JEAN-SLIM-38/42, ZAP-URBAN-40/41/42 |
| Stock | 16 | 8 por sucursal |
| StockMovement | 16 | Movimientos iniciales de ADJUST |
| Sale | 3 | Histórico de ventas |
| SaleItem | 6 | Items de las ventas |
| WhatsappOrder | 2 | 1 pending, 1 contacted |
| RefreshToken | 1 | Token mock para desarrollo |

**Password de todos los usuarios:** `123456`

## URLs y puertos

| Servicio | URL |
|---|---|
| Frontend | http://localhost:80 |
| Backend (API) | http://localhost:3000 |
| PostgreSQL | localhost:5432 |

**Credenciales PostgreSQL:** `devuser / dev20141201`

## Login de prueba

```
Email:    admin@demo.com
Password: 123456
Rol:      SUPER_ADMIN (acceso total)
```

## Comandos útiles

```bash
# Ver logs del backend
docker logs -f catalog_backend

# Ver logs de postgres
docker logs -f catalog_postgres

# Conectar a postgres directamente
docker exec -it catalog_postgres psql -U devuser -d catalogdb

# Reseed manual
docker exec catalog_backend sh seed-data.sh

# Regenerar cliente Prisma
docker exec catalog_backend sh -c "npx prisma generate"

# Aplicar migraciones
docker exec catalog_backend sh -c "npx prisma migrate deploy"
```

## Volumen persistente

Los datos de PostgreSQL persisten en el volumen `whatsapp-catalog_postgres_data`.

Para ver los volúmenes:
```bash
docker volume ls | grep whatsapp
```

Para borrar el volumen y empezar de cero:
```bash
docker volume rm whatsapp-catalog_postgres_data
```

Para revisar logs
```bash
docker
```