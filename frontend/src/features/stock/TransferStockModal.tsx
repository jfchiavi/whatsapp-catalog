import { useState } from 'react';
import { useCreateTransfer } from '../../hooks/useStock';
import type { StockByBranch, Branch } from '@/types/stock';

export function TransferStockModal({
  item,
  fromBranchId,
  branches,
  onClose,
}: {
  item: StockByBranch;
  fromBranchId: string;
  branches: Branch[];
  onClose: () => void;
}) {
  const [toBranchId, setToBranchId] = useState('');
  const [quantity, setQuantity] = useState(1);
  const createTransfer = useCreateTransfer();

  const handleSubmit = () => {
    if (!toBranchId || quantity <= 0) return;
    createTransfer.mutate(
      {
        variantId: item.variantId,
        fromBranchId,
        toBranchId,
        quantity,
      },
      {
        onSuccess: () => onClose(),
      }
    );
  };

  const attributes = Object.entries(item.variant.attributes)
    .map(([k, v]) => `${k}: ${v}`)
    .join(', ');

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl w-full max-w-md p-6 space-y-4">
        <h2 className="text-lg font-semibold">Transferir Stock</h2>

        <div className="bg-gray-50 rounded p-3 space-y-1">
          <p className="text-sm">
            <span className="font-medium">Producto:</span> {item.variant.product.name}
          </p>
          <p className="text-sm">
            <span className="font-medium">SKU:</span> {item.variant.sku}
          </p>
          <p className="text-sm">
            <span className="font-medium">Atributos:</span> {attributes}
          </p>
          <p className="text-sm">
            <span className="font-medium">Stock disponible:</span> {item.quantity}
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Sucursal destino</label>
          <select
            value={toBranchId}
            onChange={(e) => setToBranchId(e.target.value)}
            className="w-full border rounded p-2"
          >
            <option value="">Seleccionar destino</option>
            {branches.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Cantidad</label>
          <input
            type="number"
            min={1}
            max={item.quantity}
            value={quantity}
            onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
            className="w-full border rounded p-2"
          />
          {quantity > item.quantity && (
            <p className="text-red-500 text-xs mt-1">
              No hay suficiente stock disponible
            </p>
          )}
        </div>

        <div className="flex justify-end gap-2">
          <button onClick={onClose} className="px-3 py-1 border rounded">
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            disabled={!toBranchId || quantity <= 0 || quantity > item.quantity || createTransfer.isPending}
            className="px-4 py-2 bg-green-600 text-white rounded disabled:opacity-50"
          >
            {createTransfer.isPending ? 'Transfiriendo...' : 'Transferir'}
          </button>
        </div>

        {createTransfer.isError && (
          <p className="text-red-500 text-sm">
            Error al transferir. Verificá los datos e intentá de nuevo.
          </p>
        )}
      </div>
    </div>
  );
}
