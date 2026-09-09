import { businessConfig } from "../config/business.config";
import type { CartItem } from "../store/cart.store";

export const whatsappUrl = (items: CartItem[]) => {
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

  const message = `Hola! Quiero comprar:

${text}

Total: $${total.toFixed(2)}`;

  return `https://wa.me/${businessConfig.whatsappNumber}?text=${encodeURIComponent(message)}`;
};
