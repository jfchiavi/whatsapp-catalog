import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSales } from '@/hooks/useSales';
import { useProducts } from '@/hooks/useProducts';
import { useAuthStore } from '@/store/auth.store';

interface SaleItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
}

export default function CreateSalePage() {
  const navigate = useNavigate();
  const { create } = useSales();
  const productsQuery = useProducts();
  const user = useAuthStore(s => s.user);
  
  const [selectedProductId, setSelectedProductId] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [items, setItems] = useState<SaleItem[]>([]);

  const products = productsQuery.data || [];
  

  const selectedProduct = products.find(
    (p: any) => p.id === selectedProductId
  );

  const total = items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  const handleAddItem = () => {
    if (!selectedProduct) return;

    const existing = items.find(
      i => i.productId === selectedProduct.id
    );

    if (existing) {
      setItems(items.map(i =>
        i.productId === selectedProduct.id
          ? { ...i, quantity: i.quantity + quantity }
          : i
      ));
    } else {
      setItems([
        ...items,
        {
          productId: selectedProduct.id,
          name: selectedProduct.name,
          price: selectedProduct.price,
          quantity,
        },
      ]);
    }

    setSelectedProductId('');
    setQuantity(1);
  };

  const handleRemoveItem = (productId: string) => {
    setItems(items.filter(i => i.productId !== productId));
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

      {/* Selector */}
      <div className="flex gap-2 items-end">
        <select
          value={selectedProductId}
          onChange={e => setSelectedProductId(e.target.value)}
          className="border rounded px-2 py-1 w-64"
        >
          <option value="">Seleccionar producto</option>
          {products.map((p: any) => (
            <option key={p.id} value={p.id}>
              {p.name} (${p.price})
            </option>
          ))}
        </select>

        <input
          type="number"
          min={1}
          value={quantity}
          onChange={e => setQuantity(Number(e.target.value))}
          className="border rounded px-2 py-1 w-24"
          placeholder="Cantidad"
        />

        <button
          onClick={handleAddItem}
          disabled={!selectedProduct}
          className="bg-black text-white px-4 py-1 rounded"
        >
          Agregar
        </button>
      </div>

      {/* Tabla de items */}
      <div className="bg-white rounded-xl shadow-sm overflow-x-auto">
        <table className="w-full border-collapse">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-2 text-left">Producto</th>
              <th className="p-2 text-center">Precio</th>
              <th className="p-2 text-center">Cantidad</th>
              <th className="p-2 text-center">Subtotal</th>
              <th className="p-2 text-center"></th>
            </tr>
          </thead>
          <tbody>
            {items.map(item => (
              <tr key={item.productId} className="border-t">
                <td className="p-2">{item.name}</td>
                <td className="p-2 text-center">${item.price}</td>
                <td className="p-2 text-center">
                  {item.quantity}
                </td>
                <td className="p-2 text-center">
                  ${item.price * item.quantity}
                </td>
                <td className="p-2 text-center">
                  <button
                    onClick={() =>
                      handleRemoveItem(item.productId)
                    }
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

      {/* Total */}
      <div className="flex justify-end">
        <div className="text-lg font-semibold">
          Total: ${total}
        </div>
      </div>

      {/* Acciones */}
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
