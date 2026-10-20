import { useState } from 'react';
import { X } from 'lucide-react';
import type { DiscountPayload, DiscountType } from '@/services/discounts.api';
import { useProducts } from '@/hooks/useProducts';
import { useVariantsByProduct } from '@/hooks/useVariants';

const toDateInput = (date: Date) => date.toISOString().slice(0, 10);

const DEFAULT_START_DATE = toDateInput(new Date());
const DEFAULT_END_DATE = toDateInput(new Date(Date.now() + 30 * 86_400_000));

interface Props {
  onClose: () => void;
  onSubmit: (payload: DiscountPayload) => void;
  isSubmitting: boolean;
}

export const CreateDiscountModal = ({ onClose, onSubmit, isSubmitting }: Props) => {
  const { data: products } = useProducts();
  const [name, setName] = useState('');
  const [type, setType] = useState<DiscountType>('PERCENTAGE');
  const [value, setValue] = useState('10');
  const [productId, setProductId] = useState('');
  const [variantId, setVariantId] = useState('');
  const [startDate, setStartDate] = useState(DEFAULT_START_DATE);
  const [endDate, setEndDate] = useState(DEFAULT_END_DATE);

  const { data: variants } = useVariantsByProduct(productId);

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    onSubmit({
      name,
      type,
      value: Number(value),
      productId: productId || null,
      variantId: variantId || null,
      startDate: new Date(startDate).toISOString(),
      endDate: new Date(endDate).toISOString(),
    });
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-lg w-full max-w-lg p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Crear descuento</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-800">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-sm text-gray-600 mb-1">Nombre</label>
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              minLength={2}
              required
              className="w-full border rounded-lg px-3 py-2"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm text-gray-600 mb-1">Tipo</label>
              <select
                value={type}
                onChange={(event) => setType(event.target.value as DiscountType)}
                className="w-full border rounded-lg px-3 py-2"
              >
                <option value="PERCENTAGE">Porcentaje</option>
                <option value="FIXED">Monto fijo</option>
              </select>
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">
                Valor {type === 'PERCENTAGE' ? '(%)' : '($)'}
              </label>
              <input
                type="number"
                min="0.01"
                max={type === 'PERCENTAGE' ? 100 : undefined}
                step="0.01"
                value={value}
                onChange={(event) => setValue(event.target.value)}
                required
                className="w-full border rounded-lg px-3 py-2"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm text-gray-600 mb-1">Producto (opcional)</label>
              <select
                value={productId}
                onChange={(event) => {
                  setProductId(event.target.value);
                  setVariantId('');
                }}
                className="w-full border rounded-lg px-3 py-2"
              >
                <option value="">Todo el catálogo</option>
                {(products ?? []).map((product) => (
                  <option key={product.id} value={product.id}>
                    {product.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">Variante (opcional)</label>
              <select
                value={variantId}
                onChange={(event) => setVariantId(event.target.value)}
                disabled={!productId}
                className="w-full border rounded-lg px-3 py-2"
              >
                <option value="">Todas las variantes</option>
                {(variants ?? []).map((variant) => (
                  <option key={variant.id} value={variant.id}>
                    {variant.sku}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm text-gray-600 mb-1">Inicio</label>
              <input
                type="date"
                value={startDate}
                onChange={(event) => setStartDate(event.target.value)}
                required
                className="w-full border rounded-lg px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">Fin</label>
              <input
                type="date"
                value={endDate}
                onChange={(event) => setEndDate(event.target.value)}
                required
                className="w-full border rounded-lg px-3 py-2"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg border text-gray-600 hover:bg-gray-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {isSubmitting ? 'Guardando...' : 'Crear descuento'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
