import { useState } from 'react';
import { Download, Upload } from 'lucide-react';
import {
  useExportProducts,
  useExportSales,
  useImportProducts,
  useImportStock,
} from '@/hooks/useImportExport';
import type { ImportSummary } from '@/services/import-export.api';

const SummaryBox = ({ summary }: { summary: ImportSummary }) => (
  <div className="mt-3 text-sm space-y-1">
    <p className="text-green-700">Creados: {summary.created}</p>
    <p className="text-blue-700">Actualizados: {summary.updated}</p>
    {summary.errors.length > 0 && (
      <div className="text-red-600">
        <p className="font-medium">Errores ({summary.errors.length}):</p>
        <ul className="list-disc ml-5">
          {summary.errors.map((error) => (
            <li key={error.row}>
              Fila {error.row}: {error.message}
            </li>
          ))}
        </ul>
      </div>
    )}
  </div>
);

export default function ImportPage() {
  const importProducts = useImportProducts();
  const importStock = useImportStock();
  const exportProducts = useExportProducts();
  const exportSales = useExportSales();
  const [productsSummary, setProductsSummary] = useState<ImportSummary | null>(null);
  const [stockSummary, setStockSummary] = useState<ImportSummary | null>(null);

  const handleFile = async (
    file: File | undefined,
    mutate: ReturnType<typeof useImportProducts>['mutate'],
    setSummary: (summary: ImportSummary) => void
  ) => {
    if (!file) return;
    const text = await file.text();
    mutate(text, { onSuccess: setSummary });
  };

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold">Importar / Exportar</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white rounded-xl shadow-sm p-4 space-y-3">
          <h2 className="font-semibold">Importar productos (CSV)</h2>
          <p className="text-xs text-gray-500">
            Columnas requeridas: name, sku, price, cost. Opcionales: attributes, imageUrl, batch,
            expirationDate.
          </p>
          <label className="flex items-center gap-2 px-4 py-2 border rounded-lg cursor-pointer hover:bg-gray-50 w-fit">
            <Upload size={16} />
            Seleccionar archivo
            <input
              type="file"
              accept=".csv,text/csv"
              className="hidden"
              onChange={(event) =>
                handleFile(event.target.files?.[0], importProducts.mutate, setProductsSummary)
              }
            />
          </label>
          {importProducts.isPending && <p className="text-sm text-gray-500">Importando...</p>}
          {productsSummary && <SummaryBox summary={productsSummary} />}
        </div>

        <div className="bg-white rounded-xl shadow-sm p-4 space-y-3">
          <h2 className="font-semibold">Importar stock (CSV)</h2>
          <p className="text-xs text-gray-500">
            Columnas requeridas: sku, branchId, quantity (delta positivo o negativo).
          </p>
          <label className="flex items-center gap-2 px-4 py-2 border rounded-lg cursor-pointer hover:bg-gray-50 w-fit">
            <Upload size={16} />
            Seleccionar archivo
            <input
              type="file"
              accept=".csv,text/csv"
              className="hidden"
              onChange={(event) =>
                handleFile(event.target.files?.[0], importStock.mutate, setStockSummary)
              }
            />
          </label>
          {importStock.isPending && <p className="text-sm text-gray-500">Importando...</p>}
          {stockSummary && <SummaryBox summary={stockSummary} />}
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-4 space-y-3">
        <h2 className="font-semibold">Exportar CSV</h2>
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => exportProducts.mutate()}
            className="flex items-center gap-2 px-4 py-2 border rounded-lg hover:bg-gray-50"
          >
            <Download size={16} /> Exportar productos
          </button>
          <button
            onClick={() => exportSales.mutate({})}
            className="flex items-center gap-2 px-4 py-2 border rounded-lg hover:bg-gray-50"
          >
            <Download size={16} /> Exportar ventas
          </button>
        </div>
      </div>
    </div>
  );
}
