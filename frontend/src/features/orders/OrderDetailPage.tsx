import { useParams, useNavigate } from "react-router-dom";
import { useAuthStore } from "@/store/auth.store";
import { useOrder, useUpdateOrderStatus, useConfirmOrder } from "../../hooks/useCart";
import { useSyncPayment } from "@/hooks/usePayments";
import { RoleBasedRender } from "@/components/dashboard/auth/RoleBasedRender";
import { ArrowLeft } from "lucide-react";

export default function OrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const tenantId = user?.tenantId || "";

  const { data: order, isLoading } = useOrder(tenantId, id || "");
  const updateStatus = useUpdateOrderStatus();
  const confirmOrderMutation = useConfirmOrder();
  const syncPayment = useSyncPayment();

  const gatewayBadge = (gatewayStatus: string) => {
    const styles: Record<string, string> = {
      initiated: "bg-yellow-100 text-yellow-800",
      paid: "bg-green-100 text-green-700",
      failed: "bg-red-100 text-red-700",
    };
    const labels: Record<string, string> = {
      initiated: "Pago iniciado",
      paid: "Pagado",
      failed: "Pago fallido",
    };
    return (
      <span className={`px-2 py-1 rounded text-xs font-medium ${styles[gatewayStatus] || "bg-gray-100 text-gray-600"}`}>
        {labels[gatewayStatus] || gatewayStatus}
      </span>
    );
  };

  const statusBadge = (status: string) => {
    const styles: Record<string, string> = {
      pending: "bg-yellow-100 text-yellow-700",
      contacted: "bg-blue-100 text-blue-700",
      confirmed: "bg-green-100 text-green-700",
      completed: "bg-gray-100 text-gray-700",
      cancelled: "bg-red-100 text-red-700",
    };
    return (
      <span className={`px-2 py-1 rounded text-xs font-medium ${styles[status] || ""}`}>
        {status}
      </span>
    );
  };

  if (isLoading) return <div>Cargando pedido...</div>;
  if (!order) return <div>Pedido no encontrado</div>;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button onClick={() => navigate("/orders")} className="p-2 hover:bg-gray-100 rounded">
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className="text-xl font-bold">Pedido #{order.id.slice(0, 8)}</h1>
          <p className="text-sm text-gray-500">
            {new Date(order.createdAt).toLocaleString()}
          </p>
        </div>
        <div className="ml-auto">{statusBadge(order.status)}</div>
      </div>

      {/* Customer Info */}
      <div className="bg-white border rounded-lg p-4">
        <h2 className="font-semibold mb-2">Cliente</h2>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-gray-500">Nombre:</span> {order.customerName}
          </div>
          <div>
            <span className="text-gray-500">Teléfono:</span> {order.customerPhone}
          </div>
          {order.customerNotes && (
            <div className="col-span-2">
              <span className="text-gray-500">Notas:</span> {order.customerNotes}
            </div>
          )}
        </div>
      </div>

      {/* Branch */}
      <div className="bg-white border rounded-lg p-4">
        <h2 className="font-semibold mb-2">Sucursal</h2>
        <p className="text-sm">{order.branch.name}</p>
      </div>

      {/* Items */}
      <div className="bg-white border rounded-lg p-4">
        <h2 className="font-semibold mb-2">Productos</h2>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b">
              <th className="text-left py-2">Producto</th>
              <th className="text-left py-2">SKU</th>
              <th className="text-center py-2">Cantidad</th>
              <th className="text-right py-2">Precio</th>
              <th className="text-right py-2">Subtotal</th>
            </tr>
          </thead>
          <tbody>
            {order.items.map((item) => (
              <tr key={item.id} className="border-b">
                <td className="py-2">
                  <div className="flex items-center gap-2">
                    {item.variant.product.imageUrl && (
                      <img
                        src={item.variant.product.imageUrl}
                        className="w-10 h-10 object-cover rounded"
                      />
                    )}
                    <div>
                      <p>{item.variant.product.name}</p>
                      {Object.keys(item.attributesSnapshot).length > 0 && (
                        <p className="text-xs text-gray-400">
                          {Object.entries(item.attributesSnapshot)
                            .map(([k, v]) => `${k}: ${v}`)
                            .join(", ")}
                        </p>
                      )}
                    </div>
                  </div>
                </td>
                <td className="py-2 text-gray-500">{item.skuSnapshot}</td>
                <td className="py-2 text-center">{item.quantity}</td>
                <td className="py-2 text-right">${item.unitPriceSnapshot.toFixed(2)}</td>
                <td className="py-2 text-right font-medium">
                  ${(item.unitPriceSnapshot * item.quantity).toFixed(2)}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <td colSpan={4} className="text-right py-2 font-semibold">
                Total:
              </td>
              <td className="text-right py-2 font-bold text-lg">
                ${order.totalSnapshot.toFixed(2)}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Payment (solo órdenes con flujo de pago en línea) */}
      {(order.gatewayStatus || order.gatewayTransactionId) && (
        <div className="bg-white border rounded-lg p-4 space-y-3">
          <h2 className="font-semibold">Pago</h2>
          <div className="flex flex-wrap items-center gap-3 text-sm">
            {order.gatewayStatus && gatewayBadge(order.gatewayStatus)}
            {order.gatewayTransactionId && (
              <span className="font-mono text-xs text-gray-500">
                Transacción: {order.gatewayTransactionId}
              </span>
            )}
          </div>

          {syncPayment.data?.orderId === order.id && (
            <p
              className={`text-sm ${
                syncPayment.data.paid && syncPayment.data.changed
                  ? "text-green-700"
                  : syncPayment.data.paid
                    ? "text-gray-600"
                    : "text-yellow-700"
              }`}
            >
              {syncPayment.data.paid && syncPayment.data.changed
                ? "Pago sincronizado: la orden quedó confirmada."
                : syncPayment.data.paid
                  ? "La orden ya estaba pagada; no hubo cambios."
                  : "La pasarela todavía no reporta el pago de esta orden."}
            </p>
          )}

          {syncPayment.isError && syncPayment.variables === order.id && (
            <p className="text-sm text-red-600">No se pudo sincronizar el pago.</p>
          )}

          <div className="flex flex-wrap gap-2">
            <RoleBasedRender permission="settings">
              {order.gatewayTransactionId && order.gatewayStatus !== "paid" && (
                <button
                  onClick={() => syncPayment.mutate(order.id)}
                  disabled={syncPayment.isPending}
                  className="px-4 py-2 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 disabled:opacity-50"
                >
                  {syncPayment.isPending ? "Sincronizando..." : "Sincronizar pago"}
                </button>
              )}
            </RoleBasedRender>
            {order.billingInvoiceUrl && (
              <a
                href={order.billingInvoiceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 border rounded hover:bg-gray-50"
              >
                Ver factura
              </a>
            )}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="bg-white border rounded-lg p-4">
        <h2 className="font-semibold mb-4">Acciones</h2>
        <div className="flex flex-wrap gap-2">
          {order.status === "pending" && (
            <button
              onClick={() =>
                updateStatus.mutate({ tenantId, orderId: order.id, status: "contacted" })
              }
              className="px-4 py-2 bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
            >
              Marcar como Contactado
            </button>
          )}
          {order.status === "contacted" && (
            <button
              onClick={() =>
                updateStatus.mutate({ tenantId, orderId: order.id, status: "confirmed" })
              }
              className="px-4 py-2 bg-green-100 text-green-700 rounded hover:bg-green-200"
            >
              Confirmar Pedido
            </button>
          )}
          {order.status === "confirmed" && user && (
            <button
              onClick={() =>
                confirmOrderMutation.mutate({
                  tenantId,
                  orderId: order.id,
                  userId: user.id,
                })
              }
              className="px-4 py-2 bg-purple-100 text-purple-700 rounded hover:bg-purple-200"
            >
              Completar Venta
            </button>
          )}
          {["pending", "contacted", "confirmed"].includes(order.status) && (
            <button
              onClick={() =>
                updateStatus.mutate({ tenantId, orderId: order.id, status: "cancelled" })
              }
              className="px-4 py-2 bg-red-100 text-red-700 rounded hover:bg-red-200"
            >
              Cancelar
            </button>
          )}
          {order.whatsappUrl && (
            <a
              href={order.whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
            >
              Abrir en WhatsApp
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
