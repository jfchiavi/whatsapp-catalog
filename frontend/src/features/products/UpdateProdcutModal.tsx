import { useState, useEffect } from 'react';
import type { Product, UpdateProductInput } from '@/types/product';

export function UpdateProductModal({
  product,
  onClose,
  onSubmit,
}: {
  product: Product;
  onClose: () => void;
  onSubmit: (data: UpdateProductInput) => void;
}) {
  const [form, setForm] = useState<UpdateProductInput>({
    name: '',
    imageUrl: '',
    batch: '',
    active: true,
  });

  useEffect(() => {
    if (product) {
      setForm({
        name: product.name,
        imageUrl: product.imageUrl ?? '',
        batch: product.batch ?? '',
        active: product.active,
      });
    }
  }, [product]);

  const handleSubmit = () => {
    onSubmit({
      ...form,
      imageUrl: form.imageUrl || undefined,
      batch: form.batch || undefined,
    });
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl w-full max-w-md p-6 space-y-4">
        <h2 className="text-lg font-semibold">Editar producto</h2>

        <input
          placeholder="Nombre"
          className="w-full border rounded p-2"
          value={form.name ?? ''}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
        />

        <input
          placeholder="URL de imagen (opcional)"
          className="w-full border rounded p-2"
          value={form.imageUrl ?? ''}
          onChange={(e) => setForm({ ...form, imageUrl: e.target.value || undefined })}
        />

        <input
          placeholder="Lote (opcional)"
          className="w-full border rounded p-2"
          value={form.batch ?? ''}
          onChange={(e) => setForm({ ...form, batch: e.target.value || undefined })}
        />

        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={form.active ?? true}
            onChange={(e) => setForm({ ...form, active: e.target.checked })}
          />
          <span>Activo</span>
        </label>

        <div className="flex justify-end gap-2">
          <button onClick={onClose} className="px-3 py-1 border rounded">
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            disabled={!form.name}
            className="px-4 py-2 bg-black text-white rounded disabled:opacity-50"
          >
            Guardar cambios
          </button>
        </div>
      </div>
    </div>
  );
}
