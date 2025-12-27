import { useWhatsAppOrders } from '../../hooks/useWhatsAppOrders';

export default function WhatsAppOrdersPage() {
    const { orders, updateStatus } = useWhatsAppOrders();

    if (orders.isLoading) return <div>Cargando pedidos...</div>;

    return (
    <div className="space-y-4">
        <h1 className="text-xl font-bold">Pedidos WhatsApp</h1>
        <table className="w-full border">
            <thead>
                <tr className="bg-gray-100">
                    <th className="p-2 text-left">Cliente</th>
                    <th className="p-2">Total</th>
                    <th className="p-2">Estado</th>
                    <th className="p-2">Acciones</th>
                </tr>
            </thead>
            <tbody>
                {orders.data?.map(order => (
                <tr key={order.id} className="border-t">
                    <td className="p-2">{order.customerName}</td>
                    <td className="p-2 text-center">${order.total}</td>
                    <td className="p-2 text-center">{order.status}</td>
                    <td className="p-2 text-center space-x-2">
                        {order.status === 'pending' && (
                            <button
                            onClick={() => updateStatus.mutate({ id: order.id, status: 'processing' })}
                            >
                                Procesar
                            </button>
                        )}
                        {order.status === 'processing' && (
                            <button
                            onClick={() => updateStatus.mutate({ id: order.id, status: 'completed' })}
                            >
                                Completar
                            </button>
                        )}
                    </td>
                </tr>
                ))}
            </tbody>
        </table>
    </div>
    );
}