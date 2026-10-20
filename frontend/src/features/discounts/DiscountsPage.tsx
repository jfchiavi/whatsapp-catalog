import { useState } from 'react';
import { Plus, Trash2, ToggleLeft, ToggleRight } from 'lucide-react';
import {
  useCreateDiscount,
  useDeleteDiscount,
  useDiscounts,
  useUpdateDiscount,
} from '@/hooks/useDiscounts';
import { CreateDiscountModal } from './CreateDiscountModal';

export default function DiscountsPage() {
  const { data: discounts, isLoading } = useDiscounts();
  const createDiscount = useCreateDiscount();
  const updateDiscount = useUpdateDiscount();
  const deleteDiscount = useDeleteDiscount();
  const [showCreate, setShowCreate] = useState(false);

  const scopeLabel = (discount: {
    product?: { name: string } | null;
    variant?: { sku: string } | null;
    productId: string | null;
    variantId: string | null;
  }) => {
    if (discount.variant?.sku) return `Variante ${discount.variant.sku}`;
    if (discount.product?.name) return `Producto ${discount.product.name}`;
    return 'Todo el catálogo';
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-xl font-bold">Descuentos</h1>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
        >
          <Plus size={18} />
          Crear Descuento
        </button>
      </div>

      {isLoading ? (
        <div>Cargando descuentos...</div>
      ) : !discounts || discounts.length === 0 ? (
        <div className="text-gray-500">No hay descuentos configurados</div>
      ) : (
        <table className="w-full border">
          <thead>
            <tr className="bg-gray-100">
              <th className="p-2 text-left">Nombre</th>
              <th className="p-2 text-left">Tipo</th>
              <th className="p-2 text-left">Valor</th>
              <th className="p-2 text-left">Ámbito</th>
              <th className="p-2 text-left">Vigencia</th>
              <th className="p-2 text-center">Estado</th>
              <th className="p-2 text-center">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {discounts.map((discount) => (
              <tr key={discount.id} className="border-t">
                <td className="p-2 font-medium">{discount.name}</td>
                <td className="p-2 text-sm">{discount.type === 'PERCENTAGE' ? 'Porcentaje' : 'Fijo'}</td>
                <td className="p-2 text-sm">
                  {discount.type === 'PERCENTAGE' ? `${discount.value}%` : `$${discount.value.toFixed(2)}`}
                </td>
                <td className="p-2 text-sm">{scopeLabel(discount)}</td>
                <td className="p-2 text-xs text-gray-500">
                  {new Date(discount.startDate).toLocaleDateString()} —{' '}
                  {new Date(discount.endDate).toLocaleDateString()}
                </td>
                <td className="p-2 text-center">
                  <span
                    className={`px-2 py-0.5 rounded text-xs font-medium ${
                      discount.active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                    }`}
                  >
                    {discount.active ? 'Activo' : 'Inactivo'}
                  </span>
                </td>
                <td className="p-2 text-center space-x-1">
                  <button
                    onClick={() =>
                      updateDiscount.mutate({ id: discount.id, data: { active: !discount.active } })
                    }
                    className="text-gray-600 hover:text-gray-900"
                    title={discount.active ? 'Desactivar' : 'Activar'}
                  >
                    {discount.active ? <ToggleRight size={18} /> : <ToggleLeft size={18} />}
                  </button>
                  <button
                    onClick={() => deleteDiscount.mutate(discount.id)}
                    className="text-red-600 hover:text-red-800"
                    title="Eliminar"
                  >
                    <Trash2 size={16} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {showCreate && (
        <CreateDiscountModal
          onClose={() => setShowCreate(false)}
          onSubmit={(payload) =>
            createDiscount.mutate(payload, {
              onSuccess: () => setShowCreate(false),
            })
          }
          isSubmitting={createDiscount.isPending}
        />
      )}
    </div>
  );
}
