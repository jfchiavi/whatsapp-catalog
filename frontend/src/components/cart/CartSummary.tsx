import { useState } from "react";
import { useCartStore } from "../../store/cart.store";
import { Button, WhatsappButton } from "../common/Button";

export const CartSummary = ({ onClose }: { onClose: () => void }) => {
  const { subtotal, submitOrder, isSubmitting, branchId } = useCartStore();
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [showForm, setShowForm] = useState(false);

  const handleCheckout = async () => {
    if (!showForm) {
      setShowForm(true);
      return;
    }

    if (!customerName.trim() || !customerPhone.trim()) {
      return;
    }

    try {
      const order = await submitOrder(customerName, customerPhone);
      if (order?.whatsappUrl) {
        window.open(order.whatsappUrl, "_blank");
      }
      onClose();
    } catch {
      // Error is handled by the mutation
    }
  };

  return (
    <div className="border-t pt-4 space-y-3">
      <div className="flex justify-between font-semibold">
        <span>Total</span>
        <span>${subtotal().toLocaleString()}</span>
      </div>

      {showForm && (
        <div className="space-y-2">
          <input
            type="text"
            placeholder="Tu nombre"
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
            className="w-full border rounded-lg px-3 py-2 text-sm"
          />
          <input
            type="tel"
            placeholder="Tu teléfono (ej: +54 9 11 1234-5678)"
            value={customerPhone}
            onChange={(e) => setCustomerPhone(e.target.value)}
            className="w-full border rounded-lg px-3 py-2 text-sm"
          />
        </div>
      )}

      <WhatsappButton
        onClick={handleCheckout}
        disabled={isSubmitting || !branchId || (showForm && (!customerName.trim() || !customerPhone.trim()))}
        className="w-full flex items-center justify-center gap-2 bg-whatsapp text-white py-3 rounded-lg disabled:opacity-50"
      >
        {isSubmitting ? "Procesando..." : showForm ? "Confirmar pedido" : "Comprar por WhatsApp"}
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
