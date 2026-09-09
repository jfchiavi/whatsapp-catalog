import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSales } from '@/hooks/useSales';
import { useProducts } from '@/hooks/useProducts';
import { useAuthStore } from '@/store/auth.store';

interface SaleItem {
  productId: string;
  variantId: string;
  name: string;
  sku: string;
  price: number;
  quantity: number;
}

export default function CreateSalePage() {
  const navigate = useNavigate();
  const { create } = useSales();
  const productsQuery = useProducts();
  const user = useAuthStore(s => s.user);

  const [selectedProductId, setSelectedProductId] = useState('');
  const [selectedVariantId, setSelectedVariantId] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [items, setItems] = useState<SaleItem[]>([]);

  const products = productsQuery.data || [];

  const selectedProduct = products.find((p) => p.id === selectedProductId);
  const selectedVariant = selectedProduct?.variants.find(
    (v) => v.id === selectedVariantId
  );

  const total = items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  const handleAddItem = () => {
    if (!selectedProduct || !selectedVariant) return;

    const existing = items.find(
      (i) => i.variantId === selectedVariant.id
    );

    if (existing) {
      setItems(
        items.map((i) =>
          i.variantId === selectedVariant.id
            ? { ...i, quantity: i.quantity + quantity }
            : i
        )
      );
    } else {
      setItems([
        ...items,
        {
          productId: selectedProduct.id,
          variantId: selectedVariant.id,
          name: selectedProduct.name,
          sku: selectedVariant.sku,
          price: selectedVariant.price,
          quantity,
        },
      ]);
    }

    setSelectedProductId('');
    setSelectedVariantId('');
    setQuantity(1);
  };

  const handleRemoveItem = (variantId: string) => {
    setItems(items.filter((i) => i.variantId !== variantId));
  };

  const handleConfirmSale = async () => {
    if (items.length === 0) return;

    await create.mutateAsync({
      date: new Date().toISOString(),
      branchId: user!.branchId!,
      sellerId: user!.id,
      items,
      subtotal: total,
      discount: 0,
      total,
      paymentMethod: 'cash',
      status: 'completed',
    });

    navigate('/sales');
  };

  if (productsQuery.isLoading) {
    return <div>Cargando productos...</div>;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold">Nueva venta</h1>

      <div className="flex gap-2 items-end">
        <select
          value={selectedProductId}
          onChange={(e) => {
            setSelectedProductId(e.target.value);
            setSelectedVariantId('');
          }}
          className="border rounded px-2 py-1 w-64"
        >
          <option value="">Seleccionar producto</option>
          {products.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>

        {selectedProduct && selectedProduct.variants.length > 0 && (
          <select
            value={selectedVariantId}
            onChange={(e) => setSelectedVariantId(e.target.value)}
            className="border rounded px-2 py-1 w-64"
          >
            <option value="">Seleccionar variante</option>
            {selectedProduct.variants.map((v) => (
              <option key={v.id} value={v.id}>
                {v.sku} — ${v.price.toFixed(2)}
                {Object.keys(v.attributes).length > 0 &&
                  ` (${Object.values(v.attributes).join(', ')})`}
              </option>
            ))}
          </select>
        )}

        <input
          type="number"
          min={1}
          value={quantity}
          onChange={(e) => setQuantity(Number(e.target.value))}
          className="border rounded px-2 py-1 w-24"
          placeholder="Cantidad"
        />

        <button
          onClick={handleAddItem}
          disabled={!selectedVariant}
          className="bg-black text-white px-4 py-1 rounded"
        >
          Agregar
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-x-auto">
        <table className="w-full border-collapse">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-2 text-left">Producto</th>
              <th className="p-2 text-left">SKU</th>
              <th className="p-2 text-center">Precio</th>
              <th className="p-2 text-center">Cantidad</th>
              <th className="p-2 text-center">Subtotal</th>
              <th className="p-2 text-center"></th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.variantId} className="border-t">
                <td className="p-2">{item.name}</td>
                <td className="p-2 font-mono text-xs">{item.sku}</td>
                <td className="p-2 text-center">${item.price.toFixed(2)}</td>
                <td className="p-2 text-center">{item.quantity}</td>
                <td className="p-2 text-center">
                  ${(item.price * item.quantity).toFixed(2)}
                </td>
                <td className="p-2 text-center">
                  <button
                    onClick={() => handleRemoveItem(item.variantId)}
                    className="text-red-600"
                  >
                    Quitar
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {items.length === 0 && (
          <div className="p-4 text-center text-gray-500">
            No hay productos agregados
          </div>
        )}
      </div>

      <div className="flex justify-end">
        <div className="text-lg font-semibold">
          Total: ${total.toFixed(2)}
        </div>
      </div>

      <div className="flex gap-2 justify-end">
        <button
          onClick={() => navigate('/sales')}
          className="px-4 py-2 border rounded"
        >
          Cancelar
        </button>

        <button
          onClick={handleConfirmSale}
          disabled={items.length === 0 || create.isPending}
          className="px-4 py-2 bg-black text-white rounded"
        >
          Confirmar venta
        </button>
      </div>
    </div>
  );
}
