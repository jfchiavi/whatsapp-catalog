import { useState } from 'react';
import { isAxiosError } from 'axios';
import { Download, Search } from 'lucide-react';
import { useAuthStore } from '@/store/auth.store';
import { useExportReconciliation, useReconciliation } from '@/hooks/usePayments';

const DAY_MS = 24 * 60 * 60 * 1000;

const toISODate = (date: Date) => date.toISOString().slice(0, 10);

const describeError = (error: unknown): string => {
  if (isAxiosError(error)) {
    const code = error.response?.data?.error?.code as string | undefined;
    const messages: Record<string, string> = {
      PAYMENT_NOT_CONFIGURED:
        'Esta tienda no tiene un medio de pago activo; configurá las credenciales primero.',
      RECONCILIATION_NOT_SUPPORTED:
        'El medio de pago activo no soporta conciliación de pagos.',
      RANGE_TOO_LONG: 'El rango consultado no puede superar los 90 días.',
      INVALID_RANGE: 'La fecha de inicio debe ser anterior a la fecha de fin.',
      GATEWAY_ERROR: 'La pasarela de pagos respondió con un error. Intentá más tarde.',
      GATEWAY_UNREACHABLE: 'No se pudo contactar a la pasarela de pagos.',
    };
    if (code && messages[code]) return messages[code];
    if (!error.response) return 'No se pudo conectar con el servidor.';
  }
  return 'No se pudo cargar la conciliación.';
};

export default function ReconciliationPage() {
  const user = useAuthStore((s) => s.user);
  const tenantId = user?.tenantId ?? null;

  const [from, setFrom] = useState(() => toISODate(new Date(Date.now() - 30 * DAY_MS)));
  const [to, setTo] = useState(() => toISODate(new Date()));
  const [page, setPage] = useState(1);

  const reconciliation = useReconciliation(from, to, page);
  const exportMutation = useExportReconciliation();

  const records = reconciliation.data?.records ?? [];
  const meta = reconciliation.data?.meta ?? { page: 1, pageSize: 20, total: 0 };
  const totalPages = Math.max(1, Math.ceil(meta.total / meta.pageSize));

  const handleRangeChange = (setter: (value: string) => void) => (value: string) => {
    setter(value);
    setPage(1);
  };

  if (!tenantId) {
    return <div>Sesión sin tenant activo.</div>;
  }

  return (
    <div className="p-6 space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold">Conciliación de pagos</h1>
          <p className="text-sm text-gray-500">
            Movimientos pagados en la pasarela (máximo 90 días por consulta).
          </p>
        </div>
        <button
          onClick={() => exportMutation.mutate({ from, to })}
          disabled={exportMutation.isPending || reconciliation.isFetching}
          className="flex items-center gap-2 px-4 py-2 rounded-lg border hover:bg-gray-50 disabled:opacity-50"
        >
          <Download size={16} />
          {exportMutation.isPending ? 'Exportando...' : 'Exportar CSV'}
        </button>
      </header>

      <div className="bg-white border rounded-lg p-4 flex flex-wrap items-end gap-4">
        <label className="text-sm space-y-1">
          <span className="block text-gray-500">Desde</span>
          <input
            type="date"
            value={from}
            max={to}
            onChange={(e) => handleRangeChange(setFrom)(e.target.value)}
            className="border rounded px-3 py-2"
          />
        </label>
        <label className="text-sm space-y-1">
          <span className="block text-gray-500">Hasta</span>
          <input
            type="date"
            value={to}
            min={from}
            onChange={(e) => handleRangeChange(setTo)(e.target.value)}
            className="border rounded px-3 py-2"
          />
        </label>
        <button
          onClick={() => reconciliation.refetch()}
          className="flex items-center gap-2 px-4 py-2 bg-black text-white rounded-lg hover:bg-zinc-800 disabled:opacity-50"
          disabled={reconciliation.isFetching}
        >
          <Search size={16} />
          {reconciliation.isFetching ? 'Buscando...' : 'Consultar'}
        </button>
      </div>

      {reconciliation.isError && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">
          {describeError(reconciliation.error)}
        </div>
      )}

      {exportMutation.isError && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">
          {describeError(exportMutation.error)}
        </div>
      )}

      <div className="bg-white border rounded-lg overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-gray-50">
              <th className="text-left p-3">Transacción</th>
              <th className="text-left p-3">Orden</th>
              <th className="text-left p-3">Fecha de pago</th>
              <th className="text-right p-3">Monto</th>
              <th className="text-left p-3">Forma de pago</th>
            </tr>
          </thead>
          <tbody>
            {records.map((record) => (
              <tr key={record.transactionId || record.identifier} className="border-b">
                <td className="p-3 font-mono text-xs">{record.transactionId || '—'}</td>
                <td className="p-3 font-mono text-xs">
                  {record.identifier ? record.identifier.slice(0, 8) : '—'}
                </td>
                <td className="p-3">{record.paidAt ?? '—'}</td>
                <td className="p-3 text-right">${record.amountPaid.toLocaleString()}</td>
                <td className="p-3">{record.paymentMethod}</td>
              </tr>
            ))}
            {!reconciliation.isLoading && records.length === 0 && !reconciliation.isError && (
              <tr>
                <td colSpan={5} className="p-6 text-center text-gray-500">
                  Sin movimientos en el rango seleccionado.
                </td>
              </tr>
            )}
            {reconciliation.isLoading && (
              <tr>
                <td colSpan={5} className="p-6 text-center text-gray-500">
                  Cargando movimientos...
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between text-sm">
        <span className="text-gray-500">
          {meta.total} movimiento{meta.total === 1 ? '' : 's'} en el rango
        </span>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setPage((current) => Math.max(1, current - 1))}
            disabled={page <= 1 || reconciliation.isFetching}
            className="px-3 py-1 border rounded disabled:opacity-40"
          >
            Anterior
          </button>
          <span>
            Página {meta.page} de {totalPages}
          </span>
          <button
            onClick={() => setPage((current) => current + 1)}
            disabled={meta.page >= totalPages || reconciliation.isFetching}
            className="px-3 py-1 border rounded disabled:opacity-40"
          >
            Siguiente
          </button>
        </div>
      </div>
    </div>
  );
}
