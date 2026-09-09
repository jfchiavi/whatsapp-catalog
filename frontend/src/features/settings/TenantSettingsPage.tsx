import { useState, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/store/auth.store';
import { getTenantSettings, updateTenantSettings, type TenantSettings } from '@/services/tenants.api';

export default function TenantSettingsPage() {
  const user = useAuthStore((s) => s.user);
  const queryClient = useQueryClient();

  const { data: settings, isLoading } = useQuery({
    queryKey: ['tenant-settings', user?.tenantId],
    queryFn: () => getTenantSettings(user!.tenantId!),
    enabled: !!user?.tenantId,
  });

  const mutation = useMutation({
    mutationFn: (data: Partial<TenantSettings>) =>
      updateTenantSettings(user!.tenantId!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tenant-settings'] });
      queryClient.invalidateQueries({ queryKey: ['tenant-config'] });
    },
  });

  const [form, setForm] = useState({
    name: '',
    slug: '',
    domain: '',
    logoUrl: '',
    primaryColor: '#000000',
    description: '',
    whatsappNumber: '',
  });

  useEffect(() => {
    if (settings) {
      setForm({
        name: settings.name || '',
        slug: settings.slug || '',
        domain: settings.domain || '',
        logoUrl: settings.logoUrl || '',
        primaryColor: settings.primaryColor || '#000000',
        description: settings.description || '',
        whatsappNumber: settings.whatsappNumber || '',
      });
    }
  }, [settings]);

  if (isLoading) return <p>Cargando configuración...</p>;

  const handleSubmit = () => {
    mutation.mutate({
      ...form,
      domain: form.domain || null,
      logoUrl: form.logoUrl || null,
      description: form.description || null,
      whatsappNumber: form.whatsappNumber || null,
    });
  };

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-semibold">Configuración de la Tienda</h1>

      {mutation.isError && (
        <div className="p-3 bg-red-100 text-red-700 rounded">
          Error al guardar: {(mutation.error as Error).message}
        </div>
      )}

      {mutation.isSuccess && (
        <div className="p-3 bg-green-100 text-green-700 rounded">
          Configuración guardada correctamente
        </div>
      )}

      <div className="space-y-4 bg-white p-6 rounded-lg border">
        <div>
          <label className="block text-sm font-medium mb-1">Nombre de la tienda</label>
          <input
            type="text"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="w-full border rounded px-3 py-2"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Slug (URL)</label>
          <input
            type="text"
            value={form.slug}
            onChange={(e) => setForm({ ...form, slug: e.target.value })}
            className="w-full border rounded px-3 py-2"
            placeholder="mi-tienda"
          />
          <p className="text-xs text-gray-500 mt-1">
            Se usa en la URL: /t/{form.slug || 'slug'}
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Dominio custom (opcional)</label>
          <input
            type="text"
            value={form.domain}
            onChange={(e) => setForm({ ...form, domain: e.target.value })}
            className="w-full border rounded px-3 py-2"
            placeholder="mitienda.com"
          />
          <p className="text-xs text-gray-500 mt-1">
            Dejar vacío si usa subdominio de la plataforma
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">URL del logo (opcional)</label>
          <input
            type="url"
            value={form.logoUrl}
            onChange={(e) => setForm({ ...form, logoUrl: e.target.value })}
            className="w-full border rounded px-3 py-2"
            placeholder="https://ejemplo.com/logo.png"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Color primario</label>
          <div className="flex items-center gap-3">
            <input
              type="color"
              value={form.primaryColor}
              onChange={(e) => setForm({ ...form, primaryColor: e.target.value })}
              className="w-12 h-10 border rounded cursor-pointer"
            />
            <input
              type="text"
              value={form.primaryColor}
              onChange={(e) => setForm({ ...form, primaryColor: e.target.value })}
              className="w-32 border rounded px-3 py-2 font-mono"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Descripción (opcional)</label>
          <textarea
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            className="w-full border rounded px-3 py-2"
            rows={3}
            placeholder="Descripción de tu tienda..."
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Número de WhatsApp (opcional)</label>
          <input
            type="tel"
            value={form.whatsappNumber}
            onChange={(e) => setForm({ ...form, whatsappNumber: e.target.value })}
            className="w-full border rounded px-3 py-2"
            placeholder="5491122334455"
          />
          <p className="text-xs text-gray-500 mt-1">
            Incluir código de país sin + (ej: 5491122334455)
          </p>
        </div>
      </div>

      {/* Preview */}
      <div className="bg-white p-6 rounded-lg border">
        <h2 className="text-lg font-medium mb-4">Preview</h2>
        <div
          className="rounded-lg p-4"
          style={{ backgroundColor: `${form.primaryColor}10`, borderLeft: `4px solid ${form.primaryColor}` }}
        >
          <div className="flex items-center gap-3">
            {form.logoUrl ? (
              <img src={form.logoUrl} alt={form.name} className="w-10 h-10 rounded-full object-cover" />
            ) : (
              <div
                className="w-10 h-10 rounded-full"
                style={{ backgroundColor: form.primaryColor }}
              />
            )}
            <div>
              <p className="font-semibold">{form.name || 'Nombre de tienda'}</p>
              {form.description && (
                <p className="text-sm text-gray-600">{form.description}</p>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <button
          onClick={handleSubmit}
          disabled={mutation.isPending || !form.name || !form.slug}
          className="px-6 py-2 bg-black text-white rounded-lg disabled:opacity-50"
        >
          {mutation.isPending ? 'Guardando...' : 'Guardar configuración'}
        </button>
      </div>
    </div>
  );
}
