import type { CartItem } from "../store/cart.store";

interface TenantConfig {
  name: string;
  whatsappNumber: string | null;
}

export const whatsappUrl = (items: CartItem[], tenantConfig?: TenantConfig) => {
  const text = items
    .map(
      (i) =>
        `📦 ${i.product.name} (${Object.entries(i.variant.attributes).map(([k, v]) => `${k}: ${v}`).join(', ')})
SKU: ${i.variant.sku}
Cantidad: ${i.quantity}
Subtotal: $${(i.variant.price * i.quantity).toFixed(2)}`
    )
    .join("\n\n");

  const total = items.reduce((a, i) => a + i.variant.price * i.quantity, 0);

  const tenantName = tenantConfig?.name || "la tienda";
  const message = `Hola! Quiero comprar de ${tenantName}:

${text}

Total: $${total.toFixed(2)}`;

  const whatsappNumber = tenantConfig?.whatsappNumber || "5491112345678";
  return `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`;
};

export const buildWhatsAppMessage = (items: CartItem[], tenantName?: string) => {
  const text = items
    .map(
      (i) =>
        `📦 ${i.product.name} (${Object.entries(i.variant.attributes).map(([k, v]) => `${k}: ${v}`).join(', ')})
SKU: ${i.variant.sku}
Cantidad: ${i.quantity}
Subtotal: $${(i.variant.price * i.quantity).toFixed(2)}`
    )
    .join("\n\n");

  const total = items.reduce((a, i) => a + i.variant.price * i.quantity, 0);

  return `Hola! Quiero comprar de ${tenantName || "la tienda"}:

${text}

Total: $${total.toFixed(2)}`;
};
