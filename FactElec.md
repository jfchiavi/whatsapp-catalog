Integra la Facturación en tu Software con un simple JSON
Olvídate de SOAP, XMLDSig y algoritmos de compresión. Tu backend solo envía un JSON limpio con los datos de la venta y FactElec devuelve el CUF y la factura validada en milisegundos.

✔ Autenticación con API Key: Solo envía tu encabezado x-api-token.
✔ Sandbox Piloto Gratuito: Prueba todos los escenarios sin costo ni impacto fiscal.
✔ Webhooks en Tiempo Real: Recibe notificaciones automáticas del estado de tus paquetes.

```cURL
# Emitir Factura Electrónica en Bolivia curl -X POST https://api.factelec-api.com/api/v1/facturas \ -H "Content-Type: application/json" \ -H "x-api-token: fct_live_98a72b14c3e..." \ -d '{ "cliente": { "nombreRazonSocial": "JUAN PEREZ", "numeroDocumento": "4892831", "codigoTipoDocumento": 1 }, "codigoMetodoPago": 1, "detalles": [ { "codigoProductoSin": "83141", "codigoProducto": "PROD-01", "descripcion": "Servicios de Consultoría", "cantidad": 1, "precioUnitario": 150.00, "subTotal": 150.00 } ] }'
```

```node
// Facturar con Node.js / Express const axios = require('axios'); const res = await axios.post('https://api.factelec-api.com/api/v1/facturas', { cliente: { nombreRazonSocial: 'JUAN PEREZ', numeroDocumento: '4892831', codigoTipoDocumento: 1 }, codigoMetodoPago: 1, detalles: [{ codigoProductoSin: '83141', codigoProducto: 'PROD-01', descripcion: 'Servicios de Consultoría', cantidad: 1, precioUnitario: 150.00, subTotal: 150.00 }] }, { headers: { 'x-api-token': 'fct_live_98a72b14c3e...' } }); console.log('Factura Emitida:', res.data.data.cuf);
```