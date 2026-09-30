import { usePlatformStats } from '../../hooks/useTenants';
import { Building2, Users, Package, ShoppingCart } from 'lucide-react';

export default function PlatformDashboard() {
  const { data: stats, isLoading } = usePlatformStats();

  if (isLoading) return <div>Cargando estadísticas...</div>;
  if (!stats) return <div>Error al cargar estadísticas</div>;

  const cards = [
    { label: 'Tenants', value: stats.tenantCount, icon: Building2, color: 'bg-blue-500' },
    { label: 'Usuarios', value: stats.userCount, icon: Users, color: 'bg-green-500' },
    { label: 'Productos', value: stats.productCount, icon: Package, color: 'bg-purple-500' },
    { label: 'Pedidos', value: stats.orderCount, icon: ShoppingCart, color: 'bg-orange-500' },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold">Panel de Plataforma</h1>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <div key={card.label} className="bg-white border rounded-lg p-4">
              <div className="flex items-center gap-3">
                <div className={`${card.color} p-3 rounded-lg text-white`}>
                  <Icon size={24} />
                </div>
                <div>
                  <p className="text-sm text-gray-500">{card.label}</p>
                  <p className="text-2xl font-bold">{card.value}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Recent Tenants */}
      <div className="bg-white border rounded-lg p-4">
        <h2 className="font-semibold mb-3">Tenants recientes</h2>
        {stats.recentTenants.length === 0 ? (
          <p className="text-gray-500 text-sm">No hay tenants registrados</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2">Nombre</th>
                <th className="text-left py-2">Slug</th>
                <th className="text-center py-2">Usuarios</th>
                <th className="text-center py-2">Productos</th>
              </tr>
            </thead>
            <tbody>
              {stats.recentTenants.map((tenant) => (
                <tr key={tenant.id} className="border-b">
                  <td className="py-2 font-medium">{tenant.name}</td>
                  <td className="py-2 text-gray-500">{tenant.slug}</td>
                  <td className="py-2 text-center">{tenant._count?.users ?? 0}</td>
                  <td className="py-2 text-center">{tenant._count?.products ?? 0}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
