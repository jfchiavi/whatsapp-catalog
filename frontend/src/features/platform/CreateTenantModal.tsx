import { useState, useEffect } from 'react';
import { useCreateTenant, useUpdateTenant, useTenant } from '../../hooks/useTenants';
import { X } from 'lucide-react';

interface Props {
  tenantId?: string;
  onClose: () => void;
}

export const CreateTenantModal = ({ tenantId, onClose }: Props) => {
  const isEditing = !!tenantId;
  const { data: existingTenant } = useTenant(tenantId || '');
  const createTenant = useCreateTenant();
  const updateTenant = useUpdateTenant();

  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [domain, setDomain] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [primaryColor, setPrimaryColor] = useState('#000000');
  const [description, setDescription] = useState('');
  const [whatsappNumber, setWhatsappNumber] = useState('');

  useEffect(() => {
    if (existingTenant) {
      setName(existingTenant.name);
      setSlug(existingTenant.slug);
      setDomain(existingTenant.domain || '');
      setLogoUrl(existingTenant.logoUrl || '');
      setPrimaryColor(existingTenant.primaryColor || '#000000');
      setDescription(existingTenant.description || '');
      setWhatsappNumber(existingTenant.whatsappNumber || '');
    }
  }, [existingTenant]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const payload = {
      name,
      slug,
      domain: domain || undefined,
      logoUrl: logoUrl || undefined,
      primaryColor,
      description: description || undefined,
      whatsappNumber: whatsappNumber || undefined,
    };

    if (isEditing && tenantId) {
      updateTenant.mutate(
        { id: tenantId, data: payload },
        { onSuccess: onClose }
      );
    } else {
      createTenant.mutate(payload, { onSuccess: onClose });
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center">
      <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-bold">
            {isEditing ? 'Editar Tenant' : 'Crear Tenant'}
          </h2>
          <button onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-sm font-medium mb-1">Nombre *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full border rounded-lg px-3 py-2"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Slug *</label>
            <input
              type="text"
              value={slug}
              onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-'))}
              className="w-full border rounded-lg px-3 py-2"
              pattern="^[a-z0-9-]+$"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Dominio</label>
            <input
              type="text"
              value={domain}
              onChange={(e) => setDomain(e.target.value)}
              className="w-full border rounded-lg px-3 py-2"
              placeholder="ej: mitienda.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Logo URL</label>
            <input
              type="url"
              value={logoUrl}
              onChange={(e) => setLogoUrl(e.target.value)}
              className="w-full border rounded-lg px-3 py-2"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Color primario</label>
            <input
              type="color"
              value={primaryColor}
              onChange={(e) => setPrimaryColor(e.target.value)}
              className="w-full h-10 border rounded-lg"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Descripción</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full border rounded-lg px-3 py-2"
              rows={3}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">WhatsApp Number</label>
            <input
              type="text"
              value={whatsappNumber}
              onChange={(e) => setWhatsappNumber(e.target.value)}
              className="w-full border rounded-lg px-3 py-2"
              placeholder="ej: 5491112345678"
            />
          </div>

          <div className="flex gap-2 pt-2">
            <button
              type="submit"
              disabled={createTenant.isPending || updateTenant.isPending}
              className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {isEditing ? 'Guardar cambios' : 'Crear tenant'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 border py-2 rounded-lg"
            >
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
