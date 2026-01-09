import { useState, useEffect } from 'react';
import type { Product } from '@/types/product';

export function UpdateProductModal({
  product,
  onClose,
  onSubmit,
}: {
  product: Product;
  onClose: () => void;
  onSubmit: (data: Partial<Product>) => void;
}) {
  const [form, setForm] = useState({
    sku: '',
    name: '',
    price: 0,
    cost: 0,
    active: true,
  });

  useEffect(() => {
    if (product) {
      setForm({
        sku: product.sku,
        name: product.name,
        price: product.price,
        cost: product.cost,
        active: product.active,
      });
    }
  }, [product]);

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center">
      <div className="bg-white rounded-xl w-full max-w-md p-6 space-y-4">
        <h2 className="text-lg font-semibold">Editar producto</h2>

        {['sku', 'name'].map((field) => (
          <input
            key={field}
            placeholder={field.toUpperCase()}
            className="w-full border rounded p-2"
            value={(form as any)[field]}
            onChange={(e) =>
              setForm({ ...form, [field]: e.target.value })
            }
          />
        ))}

        <input
          type="number"
          placeholder="Precio"
          className="w-full border rounded p-2"
          value={form.price}
          onChange={(e) =>
            setForm({ ...form, price: Number(e.target.value) })
          }
        />

        <input
          type="number"
          placeholder="Costo"
          className="w-full border rounded p-2"
          value={form.cost}
          onChange={(e) =>
            setForm({ ...form, cost: Number(e.target.value) })
          }
        />

        <div className="flex justify-end gap-2">
          <button onClick={onClose} className="px-3 py-1">
            Cancelar
          </button>
          <button
            onClick={() => onSubmit(form)}
            className="px-4 py-2 bg-black text-white rounded"
          >
            Guardar cambios
          </button>
        </div>
      </div>
    </div>
  );
}
