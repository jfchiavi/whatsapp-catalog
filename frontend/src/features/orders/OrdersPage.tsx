import { useAuthStore } from '@/store/auth.store';
import { useOrders, useUpdateOrderStatus, useConfirmOrder } from '../../hooks/useCart';

export default function OrdersPage() {
  const user = useAuthStore((s) => s.user);
  const tenantId = user?.tenantId || '';
  const branchId = user?.branchId || undefined;

  const { data: orders, isLoading } = useOrders(tenantId, branchId);
  const updateStatus = useUpdateOrderStatus();
  const confirmOrderMutation = useConfirmOrder();

  const statusBadge = (status: string) => {
    const styles: Record<string, string> = {
      pending: 'bg-yellow-100 text-yellow-700',
      contacted: 'bg-blue-100 text-blue-700',
      confirmed: 'bg-green-100 text-green-700',
      completed: 'bg-gray-100 text-gray-700',
      cancelled: 'bg-red-100 text-red-700',
    };
    return (
      <span className={`px-2 py-0.5 rounded text-xs font-medium ${styles[status] || ''}`}>
        {status}
      </span>
    );
  };

  if (isLoading) return <div>Cargando pedidos...</div>;

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">Pedidos</h1>

      {!orders || orders.length === 0 ? (
        <div className="text-gray-500">No hay pedidos</div>
      ) : (
        <table className="w-full border">
          <thead>
            <tr className="bg-gray-100">
              <th className="p-2 text-left">Fecha</th>
              <th className="p-2 text-left">Cliente</th>
              <th className="p-2 text-left">Teléfono</th>
              <th className="p-2 text-left">Sucursal</th>
              <th className="p-2 text-center">Total</th>
              <th className="p-2 text-center">Estado</th>
              <th className="p-2 text-center">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => (
              <tr key={order.id} className="border-t">
                <td className="p-2 text-sm">
                  {new Date(order.createdAt).toLocaleDateString()}
                </td>
                <td className="p-2">{order.customerName}</td>
                <td className="p-2 text-sm">{order.customerPhone}</td>
                <td className="p-2 text-sm">{order.branch.name}</td>
                <td className="p-2 text-center">${order.totalSnapshot.toFixed(2)}</td>
                <td className="p-2 text-center">{statusBadge(order.status)}</td>
                <td className="p-2 text-center space-x-1">
                  {order.status === 'pending' && (
                    <button
                      onClick={() =>
                        updateStatus.mutate({
                          tenantId,
                          orderId: order.id,
                          status: 'contacted',
                        })
                      }
                      className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                    >
                      Contactar
                    </button>
                  )}
                  {order.status === 'contacted' && (
                    <button
                      onClick={() =>
                        updateStatus.mutate({
                          tenantId,
                          orderId: order.id,
                          status: 'confirmed',
                        })
                      }
                      className="px-2 py-1 text-xs bg-green-100 text-green-700 rounded hover:bg-green-200"
                    >
                      Confirmar
                    </button>
                  )}
                  {order.status === 'confirmed' && user && (
                    <button
                      onClick={() =>
                        confirmOrderMutation.mutate({
                          tenantId,
                          orderId: order.id,
                          userId: user.id,
                        })
                      }
                      className="px-2 py-1 text-xs bg-purple-100 text-purple-700 rounded hover:bg-purple-200"
                    >
                      Completar
                    </button>
                  )}
                  {['pending', 'contacted', 'confirmed'].includes(order.status) && (
                    <button
                      onClick={() =>
                        updateStatus.mutate({
                          tenantId,
                          orderId: order.id,
                          status: 'cancelled',
                        })
                      }
                      className="px-2 py-1 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200"
                    >
                      Cancelar
                    </button>
                  )}
                  {order.whatsappUrl && (
                    <a
                      href={order.whatsappUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-2 py-1 text-xs bg-green-100 text-green-700 rounded hover:bg-green-200 inline-block"
                    >
                      WhatsApp
                    </a>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
