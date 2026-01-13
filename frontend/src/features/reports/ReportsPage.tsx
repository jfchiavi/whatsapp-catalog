// src/features/reports/ReportsPage.tsx
import { useState } from 'react';
import {
  useSalesReport,
  useProductsReport,
  useInventoryReport,
  useBranchComparison,
} from '@/hooks/useReports';
import { formatDateInput, parseDateInput } from '@/utils/date';

const now = new Date();
const defaultFrom = new Date();
defaultFrom.setDate(now.getDate() - 30);

export default function ReportsPage() {
    // 🔹 Estado usado por los hooks
  const [fromDate, setFromDate] = useState<Date>(defaultFrom);
  const [toDate, setToDate] = useState<Date>(now);
  // 🔹 Estado del formulario
  const [fromInput, setFromInput] = useState(
    formatDateInput(defaultFrom)
  );
  const [toInput, setToInput] = useState(
    formatDateInput(now)
  );

  const {
    data: sales,
    isLoading: salesLoading,
    error: salesError,
  } = useSalesReport(fromDate, toDate);

  const {
    data: products,
    isLoading: productsLoading,
  } = useProductsReport();

  const {
    data: inventory,
    isLoading: inventoryLoading,
  } = useInventoryReport();

  const {
    data: branches,
    isLoading: branchesLoading,
  } = useBranchComparison();

    const handleSearch = () => {
    setFromDate(parseDateInput(fromInput));
    setToDate(parseDateInput(toInput));
  };

  if (
    salesLoading ||
    productsLoading ||
    inventoryLoading ||
    branchesLoading
  ) {
    return <div>Cargando reportes...</div>;
  }

  if (salesError) {
    return <div>Error al cargar reportes</div>;
  }

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold">Reportes</h1>

      {/* 🔍 Filtro de fechas */}
      <section className="bg-white rounded-xl shadow-sm p-4 flex gap-4 items-end">
        <div>
          <label className="block text-sm font-medium">Desde</label>
          <input
            type="date"
            value={fromInput}
            onChange={(e) => setFromInput(e.target.value)}
            className="border rounded p-2"
          />
        </div>

        <div>
          <label className="block text-sm font-medium">Hasta</label>
          <input
            type="date"
            value={toInput}
            onChange={(e) => setToInput(e.target.value)}
            className="border rounded p-2"
          />
        </div>

        <button
          onClick={handleSearch}
          className="bg-black text-white px-4 py-2 rounded"
        >
          Buscar
        </button>
      </section>

      {/* Ventas */}
      <section className="bg-white rounded-xl shadow-sm p-4">
        <h2 className="font-semibold mb-4">Ventas por período</h2>

        <table className="w-full border">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-2 text-left">Fecha</th>
              <th className="p-2 text-center">Ventas</th>
              <th className="p-2 text-center">Ingresos</th>
            </tr>
          </thead>
          <tbody>
            {sales?.map(row => (
              <tr key={row.date} className="border-t">
                <td className="p-2">{row.date}</td>
                <td className="p-2 text-center">{row.totalSales}</td>
                <td className="p-2 text-center">${row.totalAmount}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {/* Productos */}
      <section className="bg-white rounded-xl shadow-sm p-4">
        <h2 className="font-semibold mb-4">Productos más vendidos</h2>

        <table className="w-full border">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-2 text-left">Producto</th>
              <th className="p-2 text-center">Cantidad</th>
              <th className="p-2 text-center">Ingresos</th>
            </tr>
          </thead>
          <tbody>
            {products?.map(p => (
              <tr key={p.productId} className="border-t">
                <td className="p-2">{p.name}</td>
                <td className="p-2 text-center">{p.quantitySold}</td>
                <td className="p-2 text-center">${p.totalRevenue}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {/* Inventario */}
      <section className="bg-white rounded-xl shadow-sm p-4">
        <h2 className="font-semibold mb-4">Valorización de stock</h2>

        <table className="w-full border">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-2 text-left">Producto</th>
              <th className="p-2 text-center">Stock</th>
              <th className="p-2 text-center">Valor</th>
            </tr>
          </thead>
          <tbody>
            {inventory?.map(i => (
              <tr key={i.productId} className="border-t">
                <td className="p-2">{i.name}</td>
                <td className="p-2 text-center">{i.totalStock}</td>
                <td className="p-2 text-center">${i.inventoryValue}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {/* Sucursales */}
      <section className="bg-white rounded-xl shadow-sm p-4">
        <h2 className="font-semibold mb-4">Comparativa por sucursal</h2>

        <table className="w-full border">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-2 text-left">Sucursal</th>
              <th className="p-2 text-center">Ventas</th>
              <th className="p-2 text-center">Ingresos</th>
            </tr>
          </thead>
          <tbody>
            {branches?.map(b => (
              <tr key={b.branchId} className="border-t">
                <td className="p-2">{b.branchName}</td>
                <td className="p-2 text-center">{b.totalSales}</td>
                <td className="p-2 text-center">${b.totalAmount}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}
