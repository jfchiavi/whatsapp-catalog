import { useQuery } from '@tanstack/react-query';
import { fetchProducts } from '../../services/api';
import { StockBadge } from '../../components/dashboard/ui/StockBadge';


export default function ProductsPage() {
    const { data, isLoading } = useQuery({
        queryKey: ['products'],
        queryFn: fetchProducts,
    });

    if (isLoading) return <div>Cargando productos...</div>;

    return (
            <div className="space-y-4">
                <div className="flex justify-between items-center">
                    <h1 className="text-xl font-bold">Productos</h1>
                    <button className="bg-black text-white px-4 py-2 rounded">Nuevo</button>
                </div>

                <table className="w-full bg-white border rounded">
                    <thead className="bg-gray-100">
                        <tr>
                            <th className="p-2 text-left">SKU</th>
                            <th className="p-2 text-left">Nombre</th>
                            <th className="p-2">Stock Web</th>
                            <th className="p-2">Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {data?.map((p: any) => (
                        <tr key={p.id} className="border-t">
                        <td className="p-2">{p.sku}</td>
                        <td className="p-2">{p.name}</td>
                        <td className="p-2 text-center">
                        <StockBadge quantity={p.stock['branch-web']} min={p.minStock?.['branch-web']} />
                        </td>
                        <td className="p-2 text-center">👁️ ✏️</td>
                        </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        );
}