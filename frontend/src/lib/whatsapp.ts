interface CartItem {
  productName: string;
  variantSku: string;
  variantAttributes: Record<string, string>;
  unitPriceSnapshot: number;
  quantity: number;
}

interface TenantConfig {
  name: string;
  whatsappNumber: string | null;
}

export const whatsappUrl = (items: CartItem[], tenantConfig?: TenantConfig) => {
  const text = items
    .map(
      (i) =>
        `📦 ${i.productName} (${Object.entries(i.variantAttributes).map(([k, v]) => `${k}: ${v}`).join(', ')})
SKU: ${i.variantSku}
Cantidad: ${i.quantity}
Subtotal: $${(i.unitPriceSnapshot * i.quantity).toFixed(2)}`
    )
    .join("\n\n");

  const total = items.reduce((a, i) => a + i.unitPriceSnapshot * i.quantity, 0);

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
        `📦 ${i.productName} (${Object.entries(i.variantAttributes).map(([k, v]) => `${k}: ${v}`).join(', ')})
SKU: ${i.variantSku}
Cantidad: ${i.quantity}
Subtotal: $${(i.unitPriceSnapshot * i.quantity).toFixed(2)}`
    )
    .join("\n\n");

  const total = items.reduce((a, i) => a + i.unitPriceSnapshot * i.quantity, 0);

  return `Hola! Quiero comprar de ${tenantName || "la tienda"}:

${text}

Total: $${total.toFixed(2)}`;
};
