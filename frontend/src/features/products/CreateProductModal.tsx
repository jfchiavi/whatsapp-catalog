import { useState } from 'react';
import type { CreateProductInput } from '@/types/product';

export function CreateProductModal({
  onClose,
  onSubmit,
}: {
  onClose: () => void;
  onSubmit: (data: CreateProductInput) => void;
}) {
  const [form, setForm] = useState<CreateProductInput>({
    name: '',
    imageUrl: '',
    batch: '',
    active: true,
  });

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
        <h2 className="text-lg font-semibold">Nuevo producto</h2>

        <input
          placeholder="Nombre"
          className="w-full border rounded p-2"
          value={form.name}
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
            Crear
          </button>
        </div>
      </div>
    </div>
  );
}
