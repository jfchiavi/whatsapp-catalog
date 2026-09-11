import { useState } from 'react';
import { useAuthStore } from '@/store/auth.store';
import { useBranches } from '../../hooks/useBranches';
import { useStockByBranch, usePendingTransfers, useCancelTransfer } from '../../hooks/useStock';
import { StockBadge } from '../../components/dashboard/ui/StockBadge';
import { AdjustStockModal } from './AdjustStockModal';
import { TransferStockModal } from './TransferStockModal';
import { ReceiveTransferModal } from './ReceiveTransferModal';
import { StockHistoryModal } from './StockHistoryModal';
import type { StockByBranch, StockMovement } from '@/types/stock';

export default function StockPage() {
  const user = useAuthStore((s) => s.user);
  const isBranchManager = user?.role === 'BRANCH_MANAGER';
  const userBranchId = user?.branchId || '';

  const { data: branches, isLoading: loadingBranches } = useBranches();
  const [selectedBranchId, setSelectedBranchId] = useState(
    isBranchManager ? userBranchId : ''
  );
  const [activeTab, setActiveTab] = useState<'stock' | 'transfers'>('stock');

  const { data: stock, isLoading: loadingStock } = useStockByBranch(selectedBranchId);
  const { data: pendingTransfers, isLoading: loadingTransfers } = usePendingTransfers(
    isBranchManager ? userBranchId : undefined
  );
  const cancelTransfer = useCancelTransfer();

  const [adjustModal, setAdjustModal] = useState<{ open: boolean; item?: StockByBranch }>({
    open: false,
  });
  const [transferModal, setTransferModal] = useState<{ open: boolean; item?: StockByBranch }>({
    open: false,
  });
  const [receiveModal, setReceiveModal] = useState<{ open: boolean; movement?: StockMovement }>({
    open: false,
  });
  const [historyModal, setHistoryModal] = useState<{ open: boolean; variantId?: string }>({
    open: false,
  });

  if (loadingBranches) return <div>Cargando...</div>;

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">Gestión de Stock</h1>

      <div className="flex items-center gap-4">
        <label className="text-sm font-medium">Sucursal:</label>
        <select
          value={selectedBranchId}
          onChange={(e) => setSelectedBranchId(e.target.value)}
          disabled={isBranchManager}
          className="border rounded px-3 py-1 disabled:bg-gray-100"
        >
          <option value="">Seleccionar sucursal</option>
          {branches?.map((b) => (
            <option key={b.id} value={b.id}>
              {b.name} ({b.type})
            </option>
          ))}
        </select>
      </div>

      <div className="flex gap-2 border-b">
        <button
          onClick={() => setActiveTab('stock')}
          className={`px-4 py-2 font-medium ${
            activeTab === 'stock' ? 'border-b-2 border-black' : 'text-gray-500'
          }`}
        >
          Stock por Sucursal
        </button>
        <button
          onClick={() => setActiveTab('transfers')}
          className={`px-4 py-2 font-medium ${
            activeTab === 'transfers' ? 'border-b-2 border-black' : 'text-gray-500'
          }`}
        >
          Transferencias Pendientes
          {pendingTransfers && pendingTransfers.length > 0 && (
            <span className="ml-1 bg-red-500 text-white text-xs rounded-full px-1.5">
              {pendingTransfers.length}
            </span>
          )}
        </button>
      </div>

      {activeTab === 'stock' && (
        <>
          {loadingStock ? (
            <div>Cargando stock...</div>
          ) : !selectedBranchId ? (
            <div className="text-gray-500">Seleccioná una sucursal para ver el stock</div>
          ) : !stock || stock.length === 0 ? (
            <div className="text-gray-500">No hay stock en esta sucursal</div>
          ) : (
            <table className="w-full border">
              <thead>
                <tr className="bg-gray-100">
                  <th className="p-2 text-left">Producto</th>
                  <th className="p-2 text-left">SKU</th>
                  <th className="p-2 text-left">Atributos</th>
                  <th className="p-2 text-center">Stock</th>
                  <th className="p-2 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {stock.map((item) => (
                  <tr key={item.id} className="border-t">
                    <td className="p-2">{item.variant.product.name}</td>
                    <td className="p-2 font-mono text-sm">{item.variant.sku}</td>
                    <td className="p-2 text-sm">
                      {Object.entries(item.variant.attributes)
                        .map(([k, v]) => `${k}: ${v}`)
                        .join(', ')}
                    </td>
                    <td className="p-2 text-center">
                      <StockBadge quantity={item.quantity} />
                    </td>
                    <td className="p-2 text-center space-x-1">
                      <button
                        onClick={() => setAdjustModal({ open: true, item })}
                        className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                      >
                        Ajustar
                      </button>
                      <button
                        onClick={() => setTransferModal({ open: true, item })}
                        className="px-2 py-1 text-xs bg-green-100 text-green-700 rounded hover:bg-green-200"
                      >
                        Transferir
                      </button>
                      <button
                        onClick={() => setHistoryModal({ open: true, variantId: item.variantId })}
                        className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
                      >
                        Historial
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </>
      )}

      {activeTab === 'transfers' && (
        <>
          {loadingTransfers ? (
            <div>Cargando transferencias...</div>
          ) : !pendingTransfers || pendingTransfers.length === 0 ? (
            <div className="text-gray-500">No hay transferencias pendientes</div>
          ) : (
            <table className="w-full border">
              <thead>
                <tr className="bg-gray-100">
                  <th className="p-2 text-left">Fecha</th>
                  <th className="p-2 text-left">Variante</th>
                  <th className="p-2 text-left">Origen</th>
                  <th className="p-2 text-left">Destino</th>
                  <th className="p-2 text-center">Cantidad</th>
                  <th className="p-2 text-left">Solicitado por</th>
                  <th className="p-2 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {pendingTransfers.map((m) => (
                  <tr key={m.id} className="border-t">
                    <td className="p-2 text-sm">
                      {new Date(m.createdAt).toLocaleDateString()}
                    </td>
                    <td className="p-2">
                      {m.variant.product.name} ({m.variant.sku})
                    </td>
                    <td className="p-2">{m.fromBranch?.name}</td>
                    <td className="p-2">{m.toBranch?.name}</td>
                    <td className="p-2 text-center">{m.quantity}</td>
                    <td className="p-2 text-sm">{m.user?.name}</td>
                    <td className="p-2 text-center space-x-1">
                      {m.toBranchId === userBranchId && (
                        <button
                          onClick={() => setReceiveModal({ open: true, movement: m })}
                          className="px-2 py-1 text-xs bg-green-100 text-green-700 rounded hover:bg-green-200"
                        >
                          Recibir
                        </button>
                      )}
                      {m.fromBranchId === userBranchId && (
                        <button
                          onClick={() => {
                            if (confirm('Cancelar esta transferencia?')) {
                              cancelTransfer.mutate(m.id);
                            }
                          }}
                          className="px-2 py-1 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200"
                        >
                          Cancelar
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </>
      )}

      {adjustModal.open && adjustModal.item && (
        <AdjustStockModal
          item={adjustModal.item}
          branchId={selectedBranchId}
          onClose={() => setAdjustModal({ open: false })}
        />
      )}

      {transferModal.open && transferModal.item && (
        <TransferStockModal
          item={transferModal.item}
          fromBranchId={selectedBranchId}
          branches={branches?.filter((b) => b.id !== selectedBranchId && b.active) || []}
          onClose={() => setTransferModal({ open: false })}
        />
      )}

      {receiveModal.open && receiveModal.movement && (
        <ReceiveTransferModal
          movement={receiveModal.movement}
          onClose={() => setReceiveModal({ open: false })}
        />
      )}

      {historyModal.open && historyModal.variantId && (
        <StockHistoryModal
          variantId={historyModal.variantId}
          onClose={() => setHistoryModal({ open: false })}
        />
      )}
    </div>
  );
}
