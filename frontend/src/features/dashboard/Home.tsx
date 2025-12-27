import { ShoppingCart, AlertTriangle, Boxes } from 'lucide-react';


const Card = ({ title, value, icon }: any) => (
    <div className="bg-white rounded-xl shadow-sm p-4 flex items-center gap-4">
        <div className="p-3 bg-gray-100 rounded-lg">{icon}</div>
        <div>
            <p className="text-sm text-gray-500">{title}</p>
            <p className="text-xl font-bold">{value}</p>
        </div>
    </div>
);


export default function DashboardHome() {
    return (
        <div className="space-y-6">
        <h1 className="text-2xl font-bold">Resumen general</h1>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card title="Ventas hoy" value="$1.250" icon={<ShoppingCart />} />
            <Card title="Stock bajo" value="3 productos" icon={<AlertTriangle />} />
            <Card title="Productos activos" value="42" icon={<Boxes />} />
        </div>

        <div className="bg-white rounded-xl shadow-sm p-4">
            <h2 className="font-semibold mb-2">Últimas ventas</h2>
            <p className="text-sm text-gray-500">(mock visual)</p>
        </div>
        </div>
    );
}