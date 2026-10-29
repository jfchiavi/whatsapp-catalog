# Documentación Técnica: Pasarela de Pagos Libélula (Bolivia)
Este documento resume los endpoints, payloads, respuestas y flujos clave extraídos del manual oficial de Libélula (Versión 2.145, abril 2023) para servir como contexto y guía de referencia rápida para agentes de desarrollo e IA en entornos Multitenant.

---

## 1. Registro de Deuda (Generación de QR y Links de Pago)
Permite registrar una cuenta pendiente en la plataforma de Libélula. El sistema devuelve un identificador transaccional y los medios para efectuar el cobro.

* **Servicio:** `REGISTRAR DEUDA`
* **Método:** `POST`
* **URL de Producción:** `https://api.libelula.bo/rest/deuda/registrar`
* **Canales Integrados:** Tarjetas (Visa/Mastercard vía Cybersource ATC), SimpleQR (BCP, BNB), Botón BCP, Tigo Money, BNBNet y Pago Express.

### Parámetros de Entrada (Payload JSON)
| Campo | Tipo | Requerido | Descripción |
| :--- | :--- | :--- | :--- |
| `appkey` | STRING | **Sí** | Identificador único provisto por Libélula por cada comercio/tenant. |
| `email_cliente` | STRING | **Sí** | Correo electrónico del comprador. |
| `identificador_deuda` | STRING | **Sí** | ID único de la orden o venta en tu base de datos (Trazabilidad). |
| `fecha_vencimiento` | STRING | Opcional | Formato `yyyy-MM-dd HH:mm`. Límite de tiempo para pagar el QR/Link. |
| `descripcion` | STRING | Opcional | Glosa o concepto general de la transacción. |
| `callback_url` | STRING | Opcional | **Punto Crítico:** URL de tu backend donde Libélula enviará la notificación de éxito (GET). Se recomienda enviar de forma dinámica en cada petición. |
| `url_retorno` | STRING | Opcional | URL donde redirigir al cliente final 5 segundos después del éxito. |
| `nombre_cliente` | STRING | Opcional | Nombre del pagador. |
| `apellido_cliente` | STRING | Opcional | Apellido del pagador. |
| `ci` | STRING | Opcional | Cédula de identidad. |
| `nit` | STRING | Opcional | NIT para propósitos de facturación. |
| `razon_social` | STRING | Opcional | Razón social asociada al NIT/CI. |
| `moneda` | STRING | Opcional | Formato ISO 4217. Soportados: `BOB` (predeterminado) y `USD`. |
| `lineas_detalle_deuda` | ARRAY | **Sí** | Matriz de objetos con el desglose de productos (ver abajo). |

#### Estructura de `lineas_detalle_deuda` (Array de Objetos)
Cada objeto interno debe contener:
* `concepto` (STRING, Requerido): Nombre del producto o servicio.
* `cantidad` (INTEGER, Requerido): Unidades.
* `costo_unitario` (DECIMAL, Requerido): Precio base.
* `descuento_unitario` (DECIMAL, Opcional).
* `codigo_producto` / `codigo_producto_sin` (STRING): Requeridos únicamente si se usa la facturación nativa SFE del SIN a través de Libélula.

### Parámetros de Salida (Respuesta JSON)
```json
{
  "error": false,
  "mensaje": "Deuda registrada con éxito...",
  "id_transaccion": "b33d3c21-1128-4d48-ac44-001c069c4725",
  "url_pasarela_pagos": "http://www.todotix.com:20888?id=64820cce...",
  "qr_simple_url": "https://..."
}
```
* **`id_transaccion`:** ID único asignado por Libélula. **Debe almacenarse de forma obligatoria en la tabla `Order`** (`gatewayTransactionId`) para la conciliación.
* **`qr_simple_url`:** URL directa a la imagen en formato PNG del código QR Simple listo para renderizar en el frontend (en caso de tener habilitado dicho canal).

---

## 2. Notificación Asíncrona de Pago Exitoso (Webhook)
Al completarse una transacción, Libélula realiza un llamado asíncrono en segundo plano al backend del sistema para notificar el cobro.

* **Servicio:** `PAGO EXITOSO` o `PAGO EXITOSO EN BACKGROUND`
* **Método:** `GET`
* **Sintaxis / Formato de Invocación:**
  Libélula invocará la `callback_url` enviada durante el registro, concatenando las variables en el QueryString.
  `https://api.tuplataforma.com/webhooks/libelula?transaction_id={id}&invoice_id={id}&invoice_url={url}`

### Parámetros Recibidos (`req.query`)
* `transaction_id` (STRING, Requerido): Corresponde al `id_transaccion` devuelto en el registro de deuda.
* `invoice_id` (STRING, Opcional): ID de la factura si fue emitida de forma nativa por Libélula.
* `invoice_url` (STRING, Opcional): Enlace al documento PDF fiscal de Libélula.

### Acción Requerida en tu Backend:
1. Capturar el `transaction_id`.
2. Buscar la orden asociada en PostgreSQL donde `gatewayTransactionId == transaction_id`.
3. Validar idempotencia (evitar reprocesar órdenes ya marcadas como `pagadas`).
4. Actualizar el estado de la orden a exitoso e iniciar flujos internos (ej. disparar de forma externa la API de **FactElec** si el inquilino configuró facturación desacoplada).
5. **Responder obligatoriamente con un código HTTP 200 y el cuerpo `"OK"`** para dar por confirmada la entrega del Webhook.

---

## 3. Consulta de Pagos (Conciliación Contable)
Permite auditar y verificar transacciones de forma masiva en un rango de fechas. Es crucial para tareas de conciliación programadas (Cron Jobs).

* **Servicio:** `CONSULTAR PAGOS`
* **Método:** `POST` o `GET`
* **URL de Producción:** `https://api.libelula.bo/rest/deuda/consultar_pagos`

### Payload JSON de Entrada
```json
{
  "appkey": "588e5e10-d794-4910-91d2-b3952b54df4d",
  "fecha_inicial": "2026-10-01 00:00:00",
  "fecha_final": "2026-10-28 23:59:59"
}
```

### Respuesta del Sistema
Retorna un array `datos` con información de todas las deudas liquidadas en el periodo, detallando campos clave como `monto_pagado`, `forma_pago` (ej. `TARJETA DE CRÉDITO`, `TIGO MONEY`), e información fiscal del comprador.

---

## 4. Consulta de Deudas por Identificador Único
Permite verificar el estado en tiempo real de una transacción específica usando tus propios IDs de control internos.

* **Servicio:** `CONSULTAR DEUDAS POR IDENTIFICADOR`
* **Método:** `POST` o `GET`
* **URL de Producción:** `https://api.libelula.bo/rest/deuda/consultar_deudas/por_identificador`

### Payload JSON de Entrada
Se requiere enviar al menos uno de los dos identificadores:
```json
{
  "appkey": "D9DB14B2-2345-47DD-89E4-BBF3E5B1E62A",
  "identificador": "3072192223311288" // Tu ID de orden interna
}
```

### Campos Clave en la Respuesta
* `pagado` (BOOLEAN): Indica si la deuda ya fue cancelada (`true` / `false`).
* `fecha_pago` (DATETIME): Fecha de liquidación en Libélula o `NULL` si sigue pendiente.
* `valor_total` (DECIMAL): Monto final cobrado.
