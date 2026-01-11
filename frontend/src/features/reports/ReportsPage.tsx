// src/features/reports/ReportsPage.tsx

import {
  useSalesReport,
  useProductsReport,
  useInventoryReport,
  useBranchComparison,
} from '@/hooks/useReports';

const nowDate = new Date();
const toDate = new Date();
const fromDate = new Date(nowDate.setDate(nowDate.getDate() - 30));

export default function ReportsPage() {
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
                <td className="p-2 text-center">${row.totalRevenue}</td>
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
                <td className="p-2 text-center">${p.revenue}</td>
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
                <td className="p-2 text-center">${i.valuation}</td>
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
                <td className="p-2 text-center">${b.revenue}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}
