import { useState } from "react";
import { useCartStore } from "../../store/cart.store";
import { Button, WhatsappButton } from "../common/Button";
import { CheckoutResult } from "./CheckoutResult";
import { useInitiatePayment } from "@/hooks/useCheckout";
import {
  describeCheckoutError,
  type CheckoutPaymentResult,
} from "@/services/checkout.api";
import type { OrderData } from "@/services/cart.api";

type Step = "options" | "whatsapp-form" | "online-form" | "result";

export const CartSummary = ({ onClose }: { onClose: () => void }) => {
  const { subtotal, pricing, submitOrder, isSubmitting, branchId, tenantId } =
    useCartStore();
  const initiatePayment = useInitiatePayment();

  const [step, setStep] = useState<Step>("options");
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [createdOrder, setCreatedOrder] = useState<OrderData | null>(null);
  const [payment, setPayment] = useState<CheckoutPaymentResult | null>(null);

  const discountTotal = pricing?.discountTotal ?? 0;
  const total = pricing ? pricing.total : subtotal();

  const formValid = customerName.trim().length > 0 && customerPhone.trim().length > 0;
  const onlineValid = formValid && customerEmail.trim().length > 0;
  const busy = isSubmitting || initiatePayment.isPending;

  const startWhatsApp = () => {
    setErrorMessage(null);
    setStep("whatsapp-form");
  };

  const startOnline = () => {
    setErrorMessage(null);
    setStep("online-form");
  };

  const handleWhatsApp = async () => {
    if (step === "options") {
      startWhatsApp();
      return;
    }
    if (!formValid || busy) return;

    try {
      const order = await submitOrder(customerName, customerPhone);
      if (order?.whatsappUrl) {
        window.open(order.whatsappUrl, "_blank");
      }
      onClose();
    } catch {
      // El error lo maneja la mutación del carrito.
    }
  };

  const handleOnline = async () => {
    if (step === "options") {
      startOnline();
      return;
    }
    if (!onlineValid || !tenantId || busy) return;

    let order: OrderData | null = createdOrder;
    if (!order) {
      let created: OrderData | undefined;
      try {
        created = await submitOrder(customerName, customerPhone);
      } catch {
        setErrorMessage("No se pudo crear el pedido. Verificá la sucursal y el stock.");
        return;
      }
      if (!created) {
        setErrorMessage("No se pudo crear el pedido. Volvé a intentarlo.");
        return;
      }
      order = created;
      setCreatedOrder(created);
    }

    try {
      const result = await initiatePayment.mutateAsync({
        tenantId,
        orderId: order.id,
        customerEmail,
      });
      setPayment(result);
      setStep("result");
    } catch (error) {
      setErrorMessage(describeCheckoutError(error));
    }
  };

  const whatsappDisabled =
    isSubmitting || !branchId || (step === "whatsapp-form" && !formValid);
  const onlineDisabled =
    busy ||
    !branchId ||
    !tenantId ||
    (step === "online-form" && !onlineValid);

  return (
    <div className="border-t pt-4 space-y-3">
      <div className="space-y-1 text-sm">
        <div className="flex justify-between">
          <span>Subtotal</span>
          <span>${subtotal().toLocaleString()}</span>
        </div>
        {discountTotal > 0 && (
          <div className="flex justify-between text-green-600">
            <span>Descuentos</span>
            <span>-${discountTotal.toLocaleString()}</span>
          </div>
        )}
        <div className="flex justify-between font-semibold text-base">
          <span>Total</span>
          <span>${total.toLocaleString()}</span>
        </div>
      </div>

      {step === "result" && payment && tenantId && (
        <CheckoutResult result={payment} tenantId={tenantId} onClose={onClose} />
      )}

      {step !== "result" && (
        <>
          {(step === "whatsapp-form" || step === "online-form") && (
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
              {step === "online-form" && (
                <input
                  type="email"
                  placeholder="Tu email (para la factura y el pago)"
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                  className="w-full border rounded-lg px-3 py-2 text-sm"
                />
              )}
            </div>
          )}

          {errorMessage && (
            <p className="text-sm text-red-600" role="alert">
              {errorMessage}
            </p>
          )}

          {step === "options" && (
            <div className="space-y-2">
              <Button
                onClick={startOnline}
                disabled={onlineDisabled}
                className="w-full bg-black text-white py-3 rounded-lg disabled:opacity-50 hover:bg-zinc-800"
              >
                Pagar en línea ahora
              </Button>
              <WhatsappButton
                onClick={startWhatsApp}
                disabled={whatsappDisabled}
                className="w-full flex items-center justify-center gap-2 bg-whatsapp text-white py-3 rounded-lg disabled:opacity-50"
              >
                Coordinar pedido por WhatsApp
              </WhatsappButton>
            </div>
          )}

          {step === "whatsapp-form" && (
            <div className="space-y-2">
              <WhatsappButton
                onClick={handleWhatsApp}
                disabled={whatsappDisabled}
                className="w-full flex items-center justify-center gap-2 bg-whatsapp text-white py-3 rounded-lg disabled:opacity-50"
              >
                {isSubmitting ? "Procesando..." : "Confirmar pedido"}
              </WhatsappButton>
              <button
                onClick={() => setStep("options")}
                disabled={isSubmitting}
                className="w-full text-sm text-zinc-500 hover:underline disabled:opacity-50"
              >
                Volver
              </button>
            </div>
          )}

          {step === "online-form" && (
            <div className="space-y-2">
              <Button
                onClick={handleOnline}
                disabled={onlineDisabled}
                className="w-full bg-black text-white py-3 rounded-lg disabled:opacity-50 hover:bg-zinc-800"
              >
                {busy ? "Procesando..." : createdOrder ? "Intentar pago de nuevo" : "Continuar al pago"}
              </Button>
              {createdOrder && (
                <WhatsappButton
                  onClick={() => {
                    if (createdOrder.whatsappUrl) {
                      window.open(createdOrder.whatsappUrl, "_blank");
                    }
                    onClose();
                  }}
                  className="w-full flex items-center justify-center gap-2 bg-whatsapp text-white py-3 rounded-lg"
                >
                  Coordinar este pedido por WhatsApp
                </WhatsappButton>
              )}
              <button
                onClick={() => setStep("options")}
                disabled={busy}
                className="w-full text-sm text-zinc-500 hover:underline disabled:opacity-50"
              >
                Volver
              </button>
            </div>
          )}
        </>
      )}

      {step !== "result" && (
        <Button onClick={onClose} className="w-full border py-2 rounded">
          Seguir comprando
        </Button>
      )}
    </div>
  );
};
