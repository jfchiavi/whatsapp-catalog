import { useCartStore } from "../../store/cart.store";
import { Button } from "../common/Button";
import type { Product, Variant } from "../../types/product";
import { ShoppingCart } from "lucide-react";

interface Props {
  product: Product;
  variant: Variant;
  quantity: number;
}

export const ProductActions = ({ variant, quantity }: Props) => {
  const { add } = useCartStore();

  return (
    <div className="space-y-3">
      <Button
        onClick={() => add(variant.id, quantity)}
        className="w-full flex items-center justify-center gap-2 bg-primary text-white py-3 rounded-lg"
      >
        <ShoppingCart size={18} />
        Agregar al carrito
      </Button>
    </div>
  );
};
