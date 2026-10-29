Al tener ya la base del sistema construida, integrar estos módulos agénticos y de pagos en un entorno multi-tenant requiere acoplamiento suelto (loose coupling) para no romper tu arquitectura actual.
Dado que usas VS Code con Open WebUI / Open Code (extensiones y entornos agénticos locales o conectados a modelos mediante APIs abiertas), podemos estructurar el diseño de datos y prompts para que puedas pegarlos directamente en tus archivos o pasárselos a tu asistente de IA en el IDE para que genere el código exacto adaptado a tus controladores de Node.js.
Aquí tienes la arquitectura de datos para PostgreSQL y la estrategia de prompts estructurada para tu stack.

1. Extensión del Esquema PostgreSQL (Multi-tenant Isolation)

Para soportar credenciales de pago por tenant y darle contexto impositivo/comercial al Agente de IA sin mezclar datos, añade estas tablas y columnas a tu base de datos actual.
```sql
-- 1. Extensión de la tabla de Tenants para Pagos e IA
ALTER TABLE tenants 
ADD COLUMN payment_credentials JSONB DEFAULT '{}'::jsonb, -- Almacena API Keys de Libélula/ATC por tenant
ADD COLUMN billing_credentials JSONB DEFAULT '{}'::jsonb, -- Parámetros SIAT v2 cifrados
ADD COLUMN ai_business_profile TEXT,                      -- Descripción detallada del negocio para el prompt
ADD COLUMN whatsapp_settings JSONB DEFAULT '{}'::jsonb;   -- Token de Meta, PhoneID, WABA ID

-- 2. Tabla para almacenar las sesiones de chat de WhatsApp (Historial para la IA)
CREATE TABLE whatsapp_chats (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    customer_phone VARCHAR(20) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(tenant_id, customer_phone)
);

-- Indexación crítica para rendimiento del RAG / Consultas del Bot
CREATE INDEX idx_whatsapp_chats_lookup ON whatsapp_chats(tenant_id, customer_phone);

-- 3. Historial de Mensajes (Contexto de Ventana para el LLM)
CREATE TABLE whatsapp_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    chat_id UUID NOT NULL REFERENCES whatsapp_chats(id) ON DELETE CASCADE,
    sender VARCHAR(10) NOT NULL, -- 'user' o 'assistant'
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```
Usa el código con precaución.

2. Estrategia de Prompts para Node.js (Aislamiento de Contexto)

Para evitar que la IA confunda inventarios o políticas entre tiendas, el prompt del sistema debe armarse dinámicamente en tu backend de Node.js inyectando los datos específicos del tenant tras interceptar el webhook de WhatsApp.
Cuando uses tu asistente de IA en VS Code, pídele que te implemente la función de generación de contexto usando esta plantilla estructural:

```typescript
// Copia esta estructura en tu prompt de Open Code para implementar el generador de prompts
interface TenantContext {
  name: string;
  profile: string;
  currency: string;
}

export function generateSystemPrompt(tenant: TenantContext, catalogJson: string): string {
  return `
    Eres un asistente de ventas experto y automatizado para la tienda "${tenant.name}".
    Tu objetivo es ayudar al usuario a elegir productos, armar su carrito y cerrar su pedido de forma amable y eficiente.

    === PERFIL DE LA TIENDA ===
    ${tenant.profile}

    === REGLAS CRÍTICAS DE OPERACIÓN ===
    1. Responde siempre en español con un tono cálido, educado y usando modismos sutiles de Bolivia si corresponde (ej. "¡Claro que sí!", "Buenas tardes").
    2. Usa única y exclusivamente los productos del catálogo provisto abajo. Si el cliente pide algo que no está, indica amablemente que no cuentas con ese stock por el momento.
    3. Todos los precios están expresados en ${tenant.currency}.
    4. Cuando el cliente confirme que desea comprar los productos seleccionados, DEBES invocar la herramienta (tool/function calling) 'crear_pedido' para procesar la orden en nuestro sistema y generar el QR de pago. No inventes enlaces de pago.

    === CATÁLOGO DISPONIBLE (JSON) ===
    ${catalogJson}

    === INSTRUCCIONES DE FLUJO ===
    - Si el usuario tiene dudas, asesóralo.
    - Si el usuario decide pagar en línea, explícale que generarás un código QR dinámico.
    - Si la conversación se torna compleja (quejas o solicitudes especiales), indica que transferirás el chat a un operador humano.
  `.trim();
}
```
Usa el código con precaución.

3. Cómo integrarlo y trabajar en tu IDE (VS Code + Open Code)

Para optimizar el desarrollo de estos dos agregados utilizando tus herramientas de IA integradas en el editor, te recomiendo seguir este flujo de trabajo en tu espacio de trabajo:
1. Definición de Contratos (Tools/Function Calling): Como el agente interactuará con tu Postgres y con la API de pagos, debes declarar las funciones que la IA puede ejecutar. Abre tu chat de Open Code/Open WebUI en VS Code, selecciona tus archivos de controladores de productos y checkout existentes, y usa el siguiente prompt de desarrollo:"Basándote en estos controladores de mi backend, genera una estructura de Function Calling (herramientas para LLM) en TypeScript para que un agente de IA pueda: 1) Buscar productos por nombre, 2) Crear un carrito/pedido en PostgreSQL, y 3) Solicitar un QR dinámico a la pasarela pasando el ID del pedido."
2. Uso de .cursorrules / Archivos de Contexto: Aunque uses Open Code, puedes crear un archivo llamado .cursorrules o un archivo de markdown AI-CONTEXT.md en la raíz de tu proyecto. Escribe allí las reglas de tu multi-tenancy (por ejemplo: "Todos los modelos y consultas a la base de datos DEBEN filtrar obligatoriamente por tenant_id enviado en el contexto/token"). Tu extensión de IA leerá este archivo automáticamente y evitará escribir código que mezcle datos de los clientes.
3. Despliegue del Webhook de WhatsApp: Pídele a tu IA en el IDE que te genere un endpoint /api/v1/whatsapp/webhook en tu servidor de Node.js que:
	• Valide el token de Meta.
	• Identifique al tenant por el número de teléfono receptor.
	• Busque o cree el chat en whatsapp_chats.
	• Recupere los últimos 10 mensajes de whatsapp_messages para darle memoria al modelo.
	• Ejecute la llamada al LLM con el prompt del sistema aislado.
Si quieres avanzar con la codificación, avísame y te proporciono:
• El código del controlador en Node.js para procesar el webhook de WhatsApp y manejar la memoria del chat.
• El diseño exacto del payload JSON para interactuar con la herramienta de creación de pedidos desde la IA.
