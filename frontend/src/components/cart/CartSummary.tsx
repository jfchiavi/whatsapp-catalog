import { useCartStore } from "../../store/cart.store";
import { whatsappUrl } from "../../lib/whatsapp";
import {Button, WhatsappButton} from "../common/Button";

export const CartSummary = ({ onClose }: { onClose: () => void }) => {
  const items = useCartStore(s => s.items);
  const subtotal = useCartStore(s => s.subtotal);

  const checkout = () => {
    window.open(whatsappUrl(items), "_blank");
  };

  return (
    <div className="border-t pt-4 space-y-3">
      <div className="flex justify-between font-semibold">
        <span>Total</span>
        <span>${subtotal().toLocaleString()}</span>
      </div>

      <WhatsappButton
        onClick={checkout}
        className="w-full flex items-center justify-center gap-2 bg-whatsapp text-white py-3 rounded-lg"
      >
        Comprar por WhatsApp
      </WhatsappButton>

      <Button
        onClick={onClose}
        className="w-full border py-2 rounded"
      >
        Seguir comprando
      </Button>
    </div>
  );
};
