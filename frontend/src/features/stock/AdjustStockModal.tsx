import { useState } from 'react';
import { useAdjustStock } from '../../hooks/useStock';
import type { StockByBranch } from '@/types/stock';

export function AdjustStockModal({
  item,
  branchId,
  onClose,
}: {
  item: StockByBranch;
  branchId: string;
  onClose: () => void;
}) {
  const [quantity, setQuantity] = useState(0);
  const adjustStock = useAdjustStock();

  const handleSubmit = () => {
    if (quantity === 0) return;
    adjustStock.mutate(
      {
        variantId: item.variantId,
        branchId,
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
        <h2 className="text-lg font-semibold">Ajustar Stock</h2>

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
            <span className="font-medium">Stock actual:</span> {item.quantity}
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">
            Cantidad (+ para agregar, - para quitar)
          </label>
          <input
            type="number"
            value={quantity}
            onChange={(e) => setQuantity(parseInt(e.target.value) || 0)}
            className="w-full border rounded p-2"
          />
          {item.quantity + quantity < 0 && (
            <p className="text-red-500 text-xs mt-1">
              El stock no puede quedar negativo
            </p>
          )}
        </div>

        <div className="flex justify-end gap-2">
          <button onClick={onClose} className="px-3 py-1 border rounded">
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            disabled={quantity === 0 || adjustStock.isPending}
            className="px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-50"
          >
            {adjustStock.isPending ? 'Ajustando...' : 'Ajustar'}
          </button>
        </div>

        {adjustStock.isError && (
          <p className="text-red-500 text-sm">
            Error al ajustar stock. Verificá los datos e intentá de nuevo.
          </p>
        )}
      </div>
    </div>
  );
}
