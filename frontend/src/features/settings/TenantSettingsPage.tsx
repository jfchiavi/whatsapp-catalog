import { useState } from 'react';
import { useTenants, useDeleteTenant } from '../../hooks/useTenants';
import { CreateTenantModal } from '../platform/CreateTenantModal';
import { Pencil, Trash2, Plus } from 'lucide-react';

export default function TenantSettingsPage() {
  const { data: tenants, isLoading } = useTenants();
  const deleteTenant = useDeleteTenant();
  const [showCreate, setShowCreate] = useState(false);
  const [editingTenant, setEditingTenant] = useState<string | null>(null);

  if (isLoading) return <div>Cargando tenants...</div>;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-xl font-bold">Configuración — Tenants</h1>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
        >
          <Plus size={18} />
          Crear Tenant
        </button>
      </div>

      {!tenants || tenants.length === 0 ? (
        <div className="text-gray-500">No hay tenants creados</div>
      ) : (
        <table className="w-full border">
          <thead>
            <tr className="bg-gray-100">
              <th className="p-2 text-left">Nombre</th>
              <th className="p-2 text-left">Slug</th>
              <th className="p-2 text-center">Usuarios</th>
              <th className="p-2 text-center">Productos</th>
              <th className="p-2 text-center">Sucursales</th>
              <th className="p-2 text-center">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {tenants.map((tenant) => (
              <tr key={tenant.id} className="border-t">
                <td className="p-2">
                  <div className="flex items-center gap-2">
                    {tenant.logoUrl && (
                      <img src={tenant.logoUrl} className="w-8 h-8 rounded" />
                    )}
                    <div>
                      <p className="font-medium">{tenant.name}</p>
                      {tenant.domain && (
                        <p className="text-xs text-gray-400">{tenant.domain}</p>
                      )}
                    </div>
                  </div>
                </td>
                <td className="p-2 text-sm text-gray-500">{tenant.slug}</td>
                <td className="p-2 text-center">{tenant._count?.users ?? 0}</td>
                <td className="p-2 text-center">{tenant._count?.products ?? 0}</td>
                <td className="p-2 text-center">{tenant._count?.branches ?? 0}</td>
                <td className="p-2 text-center space-x-1">
                  <button
                    onClick={() => setEditingTenant(tenant.id)}
                    className="p-1 text-gray-500 hover:text-blue-600"
                  >
                    <Pencil size={16} />
                  </button>
                  <button
                    onClick={() => {
                      if (confirm('¿Eliminar este tenant?')) {
                        deleteTenant.mutate(tenant.id);
                      }
                    }}
                    className="p-1 text-gray-500 hover:text-red-600"
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
        <CreateTenantModal onClose={() => setShowCreate(false)} />
      )}
      {editingTenant && (
        <CreateTenantModal
          tenantId={editingTenant}
          onClose={() => setEditingTenant(null)}
        />
      )}
    </div>
  );
}
