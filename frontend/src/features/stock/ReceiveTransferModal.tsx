import { useState } from 'react';
import { useReceiveTransfer } from '../../hooks/useStock';
import type { StockMovement } from '@/types/stock';

export function ReceiveTransferModal({
  movement,
  onClose,
}: {
  movement: StockMovement;
  onClose: () => void;
}) {
  const [receivedQuantity, setReceivedQuantity] = useState(movement.quantity);
  const receiveTransfer = useReceiveTransfer();

  const handleSubmit = () => {
    receiveTransfer.mutate(
      {
        movementId: movement.id,
        receivedQuantity,
      },
      {
        onSuccess: () => onClose(),
      }
    );
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl w-full max-w-md p-6 space-y-4">
        <h2 className="text-lg font-semibold">Recibir Transferencia</h2>

        <div className="bg-gray-50 rounded p-3 space-y-1">
          <p className="text-sm">
            <span className="font-medium">Producto:</span> {movement.variant.product.name}
          </p>
          <p className="text-sm">
            <span className="font-medium">SKU:</span> {movement.variant.sku}
          </p>
          <p className="text-sm">
            <span className="font-medium">Origen:</span> {movement.fromBranch?.name}
          </p>
          <p className="text-sm">
            <span className="font-medium">Destino:</span> {movement.toBranch?.name}
          </p>
          <p className="text-sm">
            <span className="font-medium">Cantidad enviada:</span> {movement.quantity}
          </p>
          <p className="text-sm">
            <span className="font-medium">Solicitado por:</span> {movement.user?.name}
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Cantidad recibida</label>
          <input
            type="number"
            min={0}
            max={movement.quantity}
            value={receivedQuantity}
            onChange={(e) => setReceivedQuantity(parseInt(e.target.value) || 0)}
            className="w-full border rounded p-2"
          />
          {receivedQuantity !== movement.quantity && (
            <p className="text-amber-600 text-xs mt-1">
              Recepción parcial: {receivedQuantity} de {movement.quantity}
            </p>
          )}
        </div>

        <div className="flex justify-end gap-2">
          <button onClick={onClose} className="px-3 py-1 border rounded">
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            disabled={receiveTransfer.isPending}
            className="px-4 py-2 bg-green-600 text-white rounded disabled:opacity-50"
          >
            {receiveTransfer.isPending ? 'Recibiendo...' : 'Confirmar Recepción'}
          </button>
        </div>

        {receiveTransfer.isError && (
          <p className="text-red-500 text-sm">
            Error al recibir. Verificá los datos e intentá de nuevo.
          </p>
        )}
      </div>
    </div>
  );
}
