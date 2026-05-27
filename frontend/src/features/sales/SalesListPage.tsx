import { useNavigate } from 'react-router-dom';
import { useSales } from '@/hooks/useSales';
import { generateSalePDF } from '@/utils/pdfGenerator';

export default function SalesListPage() {
  const navigate = useNavigate();
  const { list } = useSales();

  const handlePrint = async (sale: any) => {
    const pdf = await generateSalePDF(sale);
    const url = URL.createObjectURL(pdf);
    window.open(url);
  };

  if (list.isLoading) {
    return <div>Cargando ventas...</div>;
  }

  if (list.error) {
    return <div>Error al cargar ventas</div>;
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-xl font-bold">Ventas</h1>

        <button
          onClick={() => navigate('/sales/new')}
          className="bg-black text-white px-4 py-2 rounded"
        >
          Nueva venta
        </button>
      </div>

      {/* Tabla */}
      <div className="bg-white rounded-xl shadow-sm overflow-x-auto">
        <table className="w-full border-collapse">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-2 text-left">Fecha</th>
              <th className="p-2 text-left">Sucursal</th>
              <th className="p-2 text-left">Vendedor</th>
              <th className="p-2 text-center">Total</th>
              <th className="p-2 text-center">Estado</th>
              <th className="p-2 text-center">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {list.data?.map((sale: any) => (
              <tr key={sale.id} className="border-t">
                <td className="p-2">
                  {new Date(sale.date).toLocaleDateString()}
                </td>
                <td className="p-2">{sale.branch?.name ?? sale.branchId}</td>
                <td className="p-2">{sale.seller?.name ?? sale.sellerId}</td>
                <td className="p-2 text-center">
                  ${sale.total}
                </td>
                <td className="p-2 text-center">
                  <span
                    className={`px-2 py-1 rounded text-xs ${
                      sale.status === 'completed'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-yellow-100 text-yellow-700'
                    }`}
                  >
                    {sale.status}
                  </span>
                </td>
                <td className="p-2 text-center">
                  <button
                    onClick={() => handlePrint(sale)}
                    className="text-blue-600 hover:underline"
                  >
                    Imprimir
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {list.data?.length === 0 && (
          <div className="p-4 text-center text-gray-500">
            No hay ventas registradas
          </div>
        )}
      </div>
    </div>
  );
}
