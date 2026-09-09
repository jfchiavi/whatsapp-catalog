import { useCartStore } from "../../store/cart.store";
import { whatsappUrl } from "../../lib/whatsapp";
import { Button, WhatsappButton } from "../common/Button";
import type { Product, Variant } from "../../types/product";
import { ShoppingCart } from "lucide-react";

interface Props {
  product: Product;
  variant: Variant;
  quantity: number;
}

export const ProductActions = ({ product, variant, quantity }: Props) => {
  const add = useCartStore((s) => s.add);

  const buyNow = () => {
    const url = whatsappUrl([
      {
        id: crypto.randomUUID(),
        product,
        variant,
        quantity,
      },
    ]);
    window.open(url, "_blank");
  };

  return (
    <div className="space-y-3">
      <Button
        onClick={() => add(product, variant, quantity)}
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
