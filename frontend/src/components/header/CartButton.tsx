import { ShoppingCart } from "lucide-react";
import { useCartStore } from "../../store/cart.store";
import { useState } from "react";
import { CartDrawer } from "../cart/CartDrawer";

export const CartButton = () => {
  const total = useCartStore(s => s.totalItems());
  const [open, setOpen] = useState(false);

  return (
    <>
    <button onClick={() => setOpen(true)} className="relative">
      <ShoppingCart />
      {total > 0 && (
        <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full px-1">
          {total}
        </span>
      )}
    </button>
    <CartDrawer open={open} onClose={() => setOpen(false)} />
    </>
  );
};
