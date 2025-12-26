import { businessConfig } from "../config/business.config";
import type { CartItem } from "../store/cart.store";

export const whatsappUrl = (items: CartItem[]) => {
  const text = items.map(i => `
📦 ${i.product.name}
Cantidad: ${i.quantity}
Subtotal: $${i.quantity * i.product.price}
`).join("");

  const total = items.reduce(
    (a, i) => a + i.quantity * i.product.price, 0
  );

  const message = `
Hola! Quiero comprar:

${text}

Total: $${total}
`.trim();

  return `https://wa.me/${businessConfig.whatsappNumber}?text=${encodeURIComponent(message)}`;
};
