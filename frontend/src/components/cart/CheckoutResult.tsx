import { useState } from 'react';
import { Button } from '../common/Button';
import { useCheckoutStatus } from '@/hooks/useCheckout';
import type { CheckoutPaymentResult } from '@/services/checkout.api';

interface Props {
  result: CheckoutPaymentResult;
  tenantId: string;
  onClose: () => void;
}

const describeStatus = (
  status: string | undefined,
  gatewayStatus: string | null | undefined
): { label: string; className: string } => {
  if (status === 'cancelled') {
    return { label: 'Pedido cancelado', className: 'bg-red-100 text-red-700' };
  }
  if (gatewayStatus === 'paid') {
    return { label: 'Pago confirmado', className: 'bg-green-100 text-green-700' };
  }
  if (gatewayStatus === 'failed') {
    return { label: 'Pago fallido', className: 'bg-red-100 text-red-700' };
  }
  return { label: 'Pendiente de pago', className: 'bg-yellow-100 text-yellow-800' };
};

export const CheckoutResult = ({ result, tenantId, onClose }: Props) => {
  const { data: status, isFetching } = useCheckoutStatus(tenantId, result.orderId);
  const [copied, setCopied] = useState(false);

  const gatewayStatus = status?.gatewayStatus ?? result.gatewayStatus;
  const statusView = describeStatus(status?.status, gatewayStatus);
  const paymentUrl = status?.paymentUrl ?? result.paymentUrl;
  const qrUrl = status?.qrUrl ?? result.qrUrl;
  const isPaid = gatewayStatus === 'paid';

  const copyLink = async () => {
    if (!paymentUrl) return;
    try {
      await navigator.clipboard.writeText(paymentUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // El navegador no permite portapapeles: el enlace sigue visible abajo.
    }
  };

  return (
    <div className="border-t pt-4 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">Pago en línea</h3>
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusView.className}`}>
          {statusView.label}
        </span>
      </div>

      {qrUrl && (
        <div className="text-center space-y-1">
          {/* QR servido por la pasarela (Libélula); se muestra tal cual. */}
          <img src={qrUrl} alt="Código QR de pago" className="mx-auto w-48 h-48 object-contain" />
          <p className="text-xs text-zinc-500">Escaneá el QR con tu app de pago bancaria.</p>
        </div>
      )}

      {paymentUrl && (
        <div className="space-y-2">
          <a
            href={paymentUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="block w-full text-center bg-black text-white py-3 rounded-lg text-sm hover:bg-zinc-800"
          >
            Ir a la pasarela de pagos
          </a>
          <button
            onClick={copyLink}
            className="w-full border py-2 rounded text-sm hover:bg-zinc-50"
          >
            {copied ? 'Enlace copiado' : 'Copiar enlace de pago'}
          </button>
        </div>
      )}

      <p className="text-xs text-zinc-500">
        El QR y el enlace de pago pueden expirar sin aviso. Si deja de funcionar,
        coordiná el pedido por WhatsApp con la tienda.
      </p>

      {isPaid ? (
        status?.billingInvoiceUrl ? (
          <a
            href={status.billingInvoiceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="block w-full text-center border border-green-600 text-green-700 py-2 rounded text-sm hover:bg-green-50"
          >
            Ver factura
          </a>
        ) : (
          <p className="text-xs text-zinc-500">
            Tu pago está confirmado. La factura, si corresponde, estará disponible en breve.
          </p>
        )
      ) : (
        <p className="text-xs text-zinc-500">
          {isFetching
            ? 'Actualizando el estado del pago…'
            : 'Estado del pedido: sin confirmar todavía. Podés revisarlo cuando quieras.'}
        </p>
      )}

      <Button onClick={onClose} className="w-full border py-2 rounded">
        Volver a la tienda
      </Button>
    </div>
  );
};
