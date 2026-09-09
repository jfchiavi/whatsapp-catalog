# Pruebas manuales - Slice 1

## Aislamiento de catálogo entre tenants

### Setup

```bash
# Ejecutar reset (borrar volumen para seed limpio)
./reset-docker.sh
```

### Datos del seed

| Tenant | ID | Productos |
|---|---|---|
| Demo Tenant | `0b95f160-f948-5ac3-921a-56029e130fa9` | Remera Oversize, Pantalón Jean, Zapatillas Urban |
| Fashion Tenant | `b63747fe-2573-5214-b490-32828299d672` | Campera de Cuero, Bufanda de Lana |

### Credenciales

| Tenant | Email | Password |
|---|---|---|
| Demo Tenant | `admin@demo.com` | `123456` |
| Fashion Tenant | `admin@fashion.com` | `123456` |

### Prueba 1: Catálogo Demo Tenant

```bash
curl -H "X-Tenant-ID: 0b95f160-f948-5ac3-921a-56029e130fa9" \
  http://localhost:3000/api/catalog/products | jq
```

**Esperado:** Solo productos de Demo Tenant (Remera, Jean, Zapatillas). Atributos: talles, colores de ropa casual.

### Prueba 2: Catálogo Fashion Tenant

```bash
curl -H "X-Tenant-ID: b63747fe-2573-5214-b490-32828299d672" \
  http://localhost:3000/api/catalog/products | jq
```

**Esperado:** Solo productos de Fashion Tenant (Campera, Bufanda). Atributos: material cuero/lana, estilo biker/invierno.

### Prueba 3: Sin header X-Tenant-ID

```bash
curl http://localhost:3000/api/catalog/products | jq
```

**Esperado:** Error `401` con `code: "TENANT_REQUIRED"`.

### Prueba 4: Tenant inexistente

```bash
curl -H "X-Tenant-ID: 00000000-0000-0000-0000-000000000000" \
  http://localhost:3000/api/catalog/products | jq
```

**Esperado:** Error `401` con `code: "TENANT_REQUIRED"`.

### Prueba 5: SKU repetido cross-tenant

```bash
# Crear variante con SKU "REM-NEG-S" en Fashion Tenant (ya existe en Demo)
curl -X POST http://localhost:3000/api/products/7b40b931-e52f-5b77-aa0f-9db18a4bc122/variants \
  -H "Authorization: Bearer <token-admin-fashion>" \
  -H "Content-Type: application/json" \
  -d '{"sku": "REM-NEG-S", "price": 99999, "cost": 50000}'
```

**Esperado:** `201 Created` (el mismo SKU es válido en otro tenant).

### Prueba 6: Producto desactivado no aparece en catálogo

```bash
# Desactivar un producto vía API (con auth)
curl -X PUT http://localhost:3000/api/products/0aa15edc-d718-5385-9e43-75b42902d59e \
  -H "Authorization: Bearer <token-admin-demo>" \
  -H "Content-Type: application/json" \
  -d '{"active": false}'

# Verificar que no aparece en catálogo público
curl -H "X-Tenant-ID: 0b95f160-f948-5ac3-921a-56029e130fa9" \
  http://localhost:3000/api/catalog/products | jq '.data | length'
```

**Esperado:** La Remera Oversize no debe aparecer en el catálogo público.

### Prueba 7: Reactivar producto

```bash
curl -X PUT http://localhost:3000/api/products/0aa15edc-d718-5385-9e43-75b42902d59e \
  -H "Authorization: Bearer <token-admin-demo>" \
  -H "Content-Type: application/json" \
  -d '{"active": true}'
```

**Esperado:** La Remera vuelve a aparecer en el catálogo.
