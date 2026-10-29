Para lograr una arquitectura completamente desacoplada con Prisma ORM, utilizaremos el Patrón Strategy (Estrategia). Esto aislará la lógica de las pasarelas (Libélula) y de facturación (FactElec) mediante interfaces genéricas en TypeScript, permitiéndote añadir nuevos proveedores en el futuro cambiando solo una configuración en la base de datos.
Aquí tenés el prompt maestro estructurado como una guía técnica por etapas o vertical slices. Podés copiar y pegar este bloque directamente en tu entorno para que tu IA de código ("open code") comience la generación de archivos basándose en tus especificaciones y en la guía oficial de Libélula.

PROMPT DE DESARROLLO: INTEGRACIÓN DESACOPLADA DE PAGOS (LIBÉLULA) Y FACTURACIÓN (FACTELEC) CON PATRÓN STRATEGY

Actúa como un Ingeniero de Software Senior especialista en arquitecturas limpias con Node.js, TypeScript, Next.js (Backend) y Prisma ORM. Vamos a implementar un sistema de pagos y facturación completamente desacoplado (Patrón Strategy) en un e-commerce Multitenant.
Ya contamos con un archivo AGENTS.md y un SDD.md en el proyecto que definen las pautas del sistema. Basándote en ellos, en nuestras tablas actuales de Tenant y Order, y en las especificaciones oficiales de la API de Libélula (método POST /rest/deuda/registrar y Webhook GET callback_url), genera la solución dividida en las siguientes 4 Etapas estrictas.

ETAPA 1: EXTENSIÓN DEL ESQUEMA DE PRISMA (schema.prisma)

Modifica y añade al esquema actual las tablas necesarias para soportar múltiples pasarelas por tenant, configuraciones de facturación y logs de auditoría transaccional. Mantén compatibilidad estricta con las tablas Tenant y Order provistas.

Requerimientos para la IA:

• Añadir el ENUM PaymentGatewayType { LIBELULA, CUCU } y BillingProviderType { FACTELEC, LIBELULA_NATIVE }.
• Crear el modelo TenantPaymentConfig para guardar credenciales dinámicas encriptadas por tenant (ej. libelula_appkey), una bandera isActive, y configuraciones fiscales.
• Crear el modelo TenantBillingConfig para mapear las credenciales del inquilino para FactElec (ej. tokens de API, sucursales), con flags isEnabled y provider. Esto permitirá la opción de usar solo Libélula, Libélula + FactElec, o Libélula con su facturación nativa.
• Extender el modelo Order agregando los campos: gatewayTransactionId (String, opcional), gatewayStatus (String, opcional), billingInvoiceId (String, opcional), y billingInvoiceUrl (String, opcional).

ETAPA 2: ARQUITECTURA DE INTERFACES Y CONTEXTOS (PATRÓN STRATEGY)

Diseña la abstracción del sistema. Ningún controlador o servicio de aplicación debe conocer directamente a Libélula o FactElec. Todo debe procesarse a través de interfaces genéricas.

Requerimientos para la IA:

1. Interfaces Base (/src/interfaces/):
	• IPaymentStrategy: Métodos createPayment(order, config) (debe retornar URL del QR y pasarela) y processWebhook(queryString, headers).
	• IBillingStrategy: Método emitInvoice(order, config).
2. Fábricas y Contextos (/src/strategies/):
	• PaymentContext: Clase encargada de resolver qué estrategia de pago instanciar basándose en el registro activo del Tenant en la BD.
	• BillingContext: Clase encargada de resolver e instanciar la estrategia de facturación. Si la configuración del tenant indica que la facturación está apagada o delegada en Libélula, ejecutará un no-op o la lógica correspondiente.

ETAPA 3: IMPLEMENTACIÓN CONCRETA DE PROVEEDORES (LIBÉLULA & FACTELEC)

Desarrolla las clases concretas que implementan las interfaces creadas en la Etapa 2.

Requerimientos para la IA:

1. LibelulaPaymentStrategy:
	• Debe construir el payload HTTP POST exacto para https://libelula.bo utilizando los campos de la orden (customerName, totalSnapshot, etc.) y el appkey dinámico recuperado del tenant.
	• Debe inyectar como callback_url el endpoint genérico de nuestro webhook e inyectar el mapeo de lineas_detalle_deuda según la orden.
	• Debe capturar de la respuesta id_transaccion y qr_simple_url.
2. FactElecBillingStrategy:
	• Debe encapsular la llamada HTTP POST hacia la API externa de FactElec para emitir el documento fiscal digital enviando los datos del cliente que realizó la compra.

ETAPA 4: CONTROLADORES, WEBHOOKS ASÍNCRONOS Y FLUJO MULTITENANT

Construye los endpoints HTTP de Express/Next.js que exponen la funcionalidad hacia el frontend y hacia las plataformas externas.

Requerimientos para la IA:

1. Checkout Controller (POST /api/v1/checkout):
	• Recibe el orderId y tenantId. Invoca al PaymentContext para inicializar el pago dinámicamente según el proveedor del inquilino, actualiza los campos de la orden con el ID transaccional retornado de la pasarela y expone el QR al cliente.
2. Global Payment Webhook (GET /api/v1/webhooks/payments/:gateway):
	• Endpoint centralizado desacoplado. Para Libélula, debe capturar por query-string el transaction_id (a través de HTTP GET según indica su manual técnico).
	• Debe utilizar una transacción de Prisma para buscar la orden por su identificador de pasarela (gatewayTransactionId), verificar idempotencia (que no esté ya pagada), y actualizar el estado a exitoso en la tienda correspondiente.
	• Orquestación de Facturación: Inmediatamente después de confirmar el éxito del pago, el webhook debe verificar la configuración de facturación de ese tenant específico. Si está activado FactElec de manera desacoplada, invocará de forma asíncrona la estrategia de facturación para generar el documento fiscal, actualizando la orden con el invoiceUrl resultante.
	• Retornar obligatoriamente una respuesta HTTP 200 (un string "OK") para dar conformidad a la pasarela emisora.
Genera los archivos de código completos utilizando tipado estricto en TypeScript, manejo de errores robusto con try/catch y logs descriptivos.

