import { AlertTriangle, Boxes, ClipboardList, ShoppingCart, TrendingUp } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '@/store/auth.store';
import { useSalesReport, useProductsReport, useBranchComparison } from '@/hooks/useReports';
import { useOrders } from '@/hooks/useCart';
import { useNotifications } from '@/hooks/useNotifications';
import { useProducts } from '@/hooks/useProducts';

const Card = ({
  title,
  value,
  icon,
  accent = 'bg-gray-100',
}: {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  accent?: string;
}) => (
  <div className="bg-white rounded-xl shadow-sm p-4 flex items-center gap-4">
    <div className={`p-3 rounded-lg ${accent}`}>{icon}</div>
    <div>
      <p className="text-sm text-gray-500">{title}</p>
      <p className="text-xl font-bold">{value}</p>
    </div>
  </div>
);

const NOW = new Date();
const FROM_30 = new Date(NOW.getTime() - 30 * 86_400_000);
const FROM_7 = new Date(NOW.getTime() - 7 * 86_400_000);

const formatMoney = (value: number) =>
  value.toLocaleString('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 });

export default function DashboardHome() {
  const user = useAuthStore((s) => s.user);
  const tenantId = user?.tenantId || '';
  const branchId = user?.branchId || undefined;

  const from30 = FROM_30;
  const from7 = FROM_7;
  const to = NOW;

  const { data: sales30 } = useSalesReport(from30, to);
  const { data: sales7 } = useSalesReport(from7, to);
  const { data: topProducts } = useProductsReport();
  const { data: branchComparison } = useBranchComparison();
  const { data: orders } = useOrders(tenantId, branchId);
  const { data: notifications } = useNotifications({ pageSize: 50 });
  const { data: products } = useProducts();

  const total7 = (sales7 ?? []).reduce((sum, item) => sum + item.totalAmount, 0);
  const total30 = (sales30 ?? []).reduce((sum, item) => sum + item.totalAmount, 0);
  const pendingOrders = (orders ?? []).filter((order) => order.status === 'pending').length;
  const lowStockAlerts = (notifications ?? []).filter(
    (item) => item.type === 'LOW_STOCK' && !item.read
  );
  const activeProducts = (products ?? []).filter((product) => product.active).length;

  const maxDaily = Math.max(1, ...(sales30 ?? []).map((item) => item.totalAmount));

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Resumen general</h1>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card
          title="Ventas últimos 7 días"
          value={formatMoney(total7)}
          icon={<TrendingUp size={22} />}
          accent="bg-green-100"
        />
        <Card
          title="Ventas últimos 30 días"
          value={formatMoney(total30)}
          icon={<ShoppingCart size={22} />}
          accent="bg-blue-100"
        />
        <Card
          title="Pedidos pendientes"
          value={pendingOrders}
          icon={<ClipboardList size={22} />}
          accent="bg-yellow-100"
        />
        <Card
          title="Alertas de stock bajo"
          value={lowStockAlerts.length}
          icon={<AlertTriangle size={22} />}
          accent="bg-red-100"
        />
      </div>

      <div className="bg-white rounded-xl shadow-sm p-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold">Ventas de los últimos 30 días</h2>
          <span className="text-sm text-gray-500">{activeProducts} productos activos</span>
        </div>
        {(sales30 ?? []).length === 0 ? (
          <p className="text-sm text-gray-500">Sin ventas en el período</p>
        ) : (
          <div className="flex items-end gap-1 h-40">
            {(sales30 ?? []).map((item) => (
              <div
                key={item.date}
                className="flex-1 flex flex-col items-center justify-end gap-1"
                title={`${item.date}: ${formatMoney(item.totalAmount)}`}
              >
                <div
                  className="w-full bg-blue-500 rounded-t"
                  style={{ height: `${Math.max(4, (item.totalAmount / maxDaily) * 140)}px` }}
                />
                <span className="text-[9px] text-gray-400">{item.date.slice(5)}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white rounded-xl shadow-sm p-4">
          <h2 className="font-semibold mb-3">Productos más vendidos</h2>
          {(topProducts ?? []).length === 0 ? (
            <p className="text-sm text-gray-500">Sin datos de ventas</p>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="text-left text-xs text-gray-500">
                  <th className="pb-2">Producto</th>
                  <th className="pb-2 text-center">Unidades</th>
                  <th className="pb-2 text-right">Ingresos</th>
                </tr>
              </thead>
              <tbody>
                {(topProducts ?? []).slice(0, 5).map((product) => (
                  <tr key={product.productId} className="border-t">
                    <td className="py-2 text-sm">{product.name}</td>
                    <td className="py-2 text-sm text-center">{product.quantitySold}</td>
                    <td className="py-2 text-sm text-right">{formatMoney(product.totalRevenue)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="bg-white rounded-xl shadow-sm p-4">
          <h2 className="font-semibold mb-3">Comparación de sucursales</h2>
          {(branchComparison ?? []).length === 0 ? (
            <p className="text-sm text-gray-500">Sin datos por sucursal</p>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="text-left text-xs text-gray-500">
                  <th className="pb-2">Sucursal</th>
                  <th className="pb-2 text-center">Ventas</th>
                  <th className="pb-2 text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                {(branchComparison ?? []).map((branch) => (
                  <tr key={branch.branchId} className="border-t">
                    <td className="py-2 text-sm">{branch.branchName}</td>
                    <td className="py-2 text-sm text-center">{branch.totalSales}</td>
                    <td className="py-2 text-sm text-right">{formatMoney(branch.totalAmount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white rounded-xl shadow-sm p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold">Pedidos recientes</h2>
            <Link to="/orders" className="text-sm text-blue-600 hover:underline">
              Ver todos
            </Link>
          </div>
          {(orders ?? []).length === 0 ? (
            <p className="text-sm text-gray-500">No hay pedidos</p>
          ) : (
            (orders ?? []).slice(0, 5).map((order) => (
              <div key={order.id} className="flex items-center justify-between border-t py-2">
                <div>
                  <p className="text-sm font-medium">{order.customerName}</p>
                  <p className="text-xs text-gray-500">
                    {new Date(order.createdAt).toLocaleString()}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium">{formatMoney(order.totalSnapshot)}</p>
                  <span className="text-xs text-gray-500">{order.status}</span>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="bg-white rounded-xl shadow-sm p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold">Alertas de stock bajo</h2>
            <Link to="/notifications" className="text-sm text-blue-600 hover:underline">
              Ver todas
            </Link>
          </div>
          {lowStockAlerts.length === 0 ? (
            <p className="text-sm text-gray-500">Sin alertas pendientes</p>
          ) : (
            lowStockAlerts.slice(0, 5).map((alert) => (
              <div key={alert.id} className="flex items-start gap-2 border-t py-2">
                <AlertTriangle size={16} className="text-red-500 mt-0.5" />
                <div>
                  <p className="text-sm font-medium">{alert.title}</p>
                  <p className="text-xs text-gray-500">{alert.message}</p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 text-sm text-gray-500">
        <Boxes size={16} />
        <span>
          Los datos provienen de ventas confirmadas y pedidos registrados en el sistema.
        </span>
      </div>
    </div>
  );
}
