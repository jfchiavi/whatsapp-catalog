import { useStock } from '../../hooks/useStock';
import { StockBadge } from '../../components/dashboard/ui/StockBadge';


export default function StockPage() {
    const productId = 'prod-001'; // selector real luego
    const { data, isLoading } = useStock(productId);


    if (isLoading) return <div>Cargando stock...</div>;


    return (
        <div className="space-y-4">
        <h1 className="text-xl font-bold">Stock por sucursal</h1>
        <table className="w-full border">
            <thead>
                <tr className="bg-gray-100">
                    <th className="p-2 text-left">Sucursal</th>
                    <th className="p-2">Stock</th>
                    <th className="p-2">Acciones</th>
                </tr>
            </thead>
            <tbody>
                {data?.map((s) => (
                    <tr key={s.branchId} className="border-t">
                        <td className="p-2">{s.branchId}</td>
                        <td className="p-2 text-center">
                            <StockBadge quantity={s.quantity} min={s.minQuantity} />
                        </td>
                        <td className="p-2 text-center">🔄 📊</td>
                    </tr>
                ))}
            </tbody>
        </table>
        </div>
    );
}