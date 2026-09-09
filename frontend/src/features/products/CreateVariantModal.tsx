import { useState } from 'react';
import type { CreateVariantInput } from '@/types/product';

export function CreateVariantModal({
  productName,
  onClose,
  onSubmit,
}: {
  productName: string;
  onClose: () => void;
  onSubmit: (data: CreateVariantInput) => void;
}) {
  const [form, setForm] = useState<CreateVariantInput>({
    sku: '',
    price: 0,
    cost: 0,
    attributes: {},
  });

  const [attrKey, setAttrKey] = useState('');
  const [attrValue, setAttrValue] = useState('');

  const addAttribute = () => {
    if (!attrKey.trim()) return;
    setForm({
      ...form,
      attributes: { ...form.attributes, [attrKey.trim()]: attrValue },
    });
    setAttrKey('');
    setAttrValue('');
  };

  const removeAttribute = (key: string) => {
    const { [key]: _, ...rest } = form.attributes ?? {};
    setForm({ ...form, attributes: rest });
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl w-full max-w-md p-6 space-y-4">
        <h2 className="text-lg font-semibold">Nueva variante — {productName}</h2>

        <input
          placeholder="SKU"
          className="w-full border rounded p-2"
          value={form.sku}
          onChange={(e) => setForm({ ...form, sku: e.target.value })}
        />

        <input
          type="number"
          placeholder="Precio"
          className="w-full border rounded p-2"
          value={form.price || ''}
          onChange={(e) => setForm({ ...form, price: Number(e.target.value) })}
        />

        <input
          type="number"
          placeholder="Costo"
          className="w-full border rounded p-2"
          value={form.cost || ''}
          onChange={(e) => setForm({ ...form, cost: Number(e.target.value) })}
        />

        <div className="space-y-2">
          <span className="text-sm font-medium">Atributos</span>
          {Object.entries(form.attributes ?? {}).map(([key, value]) => (
            <div key={key} className="flex items-center gap-2 text-sm">
              <span className="font-mono">{key}:</span>
              <span>{String(value)}</span>
              <button
                onClick={() => removeAttribute(key)}
                className="text-red-500 hover:underline ml-auto"
              >
                x
              </button>
            </div>
          ))}
          <div className="flex gap-2">
            <input
              placeholder="Clave"
              className="flex-1 border rounded p-1 text-sm"
              value={attrKey}
              onChange={(e) => setAttrKey(e.target.value)}
            />
            <input
              placeholder="Valor"
              className="flex-1 border rounded p-1 text-sm"
              value={attrValue}
              onChange={(e) => setAttrValue(e.target.value)}
            />
            <button
              onClick={addAttribute}
              className="px-2 py-1 border rounded text-sm"
            >
              +
            </button>
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <button onClick={onClose} className="px-3 py-1 border rounded">
            Cancelar
          </button>
          <button
            onClick={() => onSubmit(form)}
            disabled={!form.sku || form.price <= 0}
            className="px-4 py-2 bg-black text-white rounded disabled:opacity-50"
          >
            Crear variante
          </button>
        </div>
      </div>
    </div>
  );
}
