import { Link, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useCustomer, useCustomerOrders } from '@/hooks/useCustomers';

export default function CustomerDetailPage() {
  const { id = '' } = useParams();
  const { data: customer, isLoading } = useCustomer(id);
  const { data: orders, isLoading: ordersLoading } = useCustomerOrders(id);

  if (isLoading) return <div>Cargando cliente...</div>;
  if (!customer) return <div className="text-gray-500">Cliente no encontrado</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link to="/customers" className="text-gray-500 hover:text-gray-800">
          <ArrowLeft size={20} />
        </Link>
        <h1 className="text-xl font-bold">{customer.name}</h1>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-4 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <p className="text-sm text-gray-500">Teléfono</p>
          <p className="font-medium">{customer.phone}</p>
        </div>
        <div>
          <p className="text-sm text-gray-500">Email</p>
          <p className="font-medium">{customer.email || '-'}</p>
        </div>
        <div>
          <p className="text-sm text-gray-500">Notas</p>
          <p className="font-medium">{customer.notes || '-'}</p>
        </div>
      </div>

      <div className="space-y-3">
        <h2 className="font-semibold">Historial de pedidos</h2>

        {ordersLoading ? (
          <div>Cargando pedidos...</div>
        ) : !orders || orders.length === 0 ? (
          <div className="text-gray-500">Este cliente todavía no tiene pedidos</div>
        ) : (
          <table className="w-full border">
            <thead>
              <tr className="bg-gray-100">
                <th className="p-2 text-left">Fecha</th>
                <th className="p-2 text-left">Sucursal</th>
                <th className="p-2 text-left">Estado</th>
                <th className="p-2 text-center">Ítems</th>
                <th className="p-2 text-right">Total</th>
                <th className="p-2 text-center">Detalle</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order.id} className="border-t">
                  <td className="p-2 text-sm">{new Date(order.createdAt).toLocaleString()}</td>
                  <td className="p-2 text-sm">{order.branch?.name || '-'}</td>
                  <td className="p-2">
                    <span className="px-2 py-0.5 rounded text-xs bg-gray-100 text-gray-700">
                      {order.status}
                    </span>
                  </td>
                  <td className="p-2 text-center">{order.items.length}</td>
                  <td className="p-2 text-right">${order.totalSnapshot.toFixed(2)}</td>
                  <td className="p-2 text-center">
                    <Link
                      to={`/orders/${order.id}`}
                      className="text-blue-600 hover:underline text-sm"
                    >
                      Ver
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
