import { useStockHistory } from '../../hooks/useStock';

export function StockHistoryModal({
  variantId,
  onClose,
}: {
  variantId: string;
  onClose: () => void;
}) {
  const { data: history, isLoading } = useStockHistory(variantId);

  const statusBadge = (status: string) => {
    const styles: Record<string, string> = {
      PENDING: 'bg-yellow-100 text-yellow-700',
      COMPLETED: 'bg-green-100 text-green-700',
      CANCELLED: 'bg-red-100 text-red-700',
    };
    return (
      <span className={`px-2 py-0.5 rounded text-xs font-medium ${styles[status] || ''}`}>
        {status}
      </span>
    );
  };

  const typeLabel = (type: string) => {
    const labels: Record<string, string> = {
      ADJUST: 'Ajuste',
      TRANSFER: 'Transferencia',
      SALE: 'Venta',
    };
    return labels[type] || type;
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl w-full max-w-2xl max-h-[80vh] flex flex-col p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">Historial de Movimientos</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            ✕
          </button>
        </div>

        {isLoading ? (
          <div className="text-center py-8 text-gray-500">Cargando historial...</div>
        ) : !history || history.length === 0 ? (
          <div className="text-center py-8 text-gray-500">No hay movimientos registrados</div>
        ) : (
          <div className="overflow-auto flex-1">
            <table className="w-full border">
              <thead>
                <tr className="bg-gray-100 sticky top-0">
                  <th className="p-2 text-left text-sm">Fecha</th>
                  <th className="p-2 text-left text-sm">Tipo</th>
                  <th className="p-2 text-left text-sm">Estado</th>
                  <th className="p-2 text-left text-sm">Origen</th>
                  <th className="p-2 text-left text-sm">Destino</th>
                  <th className="p-2 text-center text-sm">Cantidad</th>
                  <th className="p-2 text-center text-sm">Recibida</th>
                  <th className="p-2 text-left text-sm">Usuario</th>
                </tr>
              </thead>
              <tbody>
                {history.map((m) => (
                  <tr key={m.id} className="border-t">
                    <td className="p-2 text-sm">
                      {new Date(m.createdAt).toLocaleDateString()}{' '}
                      {new Date(m.createdAt).toLocaleTimeString()}
                    </td>
                    <td className="p-2 text-sm">{typeLabel(m.type)}</td>
                    <td className="p-2">{statusBadge(m.status)}</td>
                    <td className="p-2 text-sm">{m.fromBranch?.name || '-'}</td>
                    <td className="p-2 text-sm">{m.toBranch?.name || '-'}</td>
                    <td className="p-2 text-center text-sm">{m.quantity}</td>
                    <td className="p-2 text-center text-sm">{m.receivedQuantity ?? '-'}</td>
                    <td className="p-2 text-sm">{m.user?.name || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="flex justify-end mt-4">
          <button onClick={onClose} className="px-4 py-2 border rounded">
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}
