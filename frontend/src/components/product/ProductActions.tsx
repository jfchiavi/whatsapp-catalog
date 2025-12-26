import { useCartStore } from "../../store/cart.store";
import { whatsappUrl } from "../../lib/whatsapp";
import {Button, WhatsappButton} from "../common/Button";
import type { Product } from "../../types";
import { ShoppingCart } from "lucide-react";

interface Props {
  product: Product;
  quantity: number;
}

export const ProductActions = ({ product, quantity }: Props) => {
  const add = useCartStore(s => s.add);
  const items = useCartStore(s => s.items);

  const buyNow = () => {
    const url = whatsappUrl([
      {
        id: crypto.randomUUID(),
        product,
        quantity,
      } as any,
    ]);
    window.open(url, "_blank");
  };

  return (
    <div className="space-y-3">
      <Button
        onClick={() => add(product, quantity)}
        className="w-full flex items-center justify-center gap-2 bg-primary text-white py-3 rounded-lg"
      >
        <ShoppingCart size={18} />
        Agregar al carrito
      </Button>

      <WhatsappButton
        onClick={buyNow}
        className="w-full flex items-center justify-center gap-2 bg-whatsapp text-white py-3 rounded-lg"
      >
        Comprar por WhatsApp
      </WhatsappButton>
    </div>
  );
};
