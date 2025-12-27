import { useSales } from '../../hooks/useSales';
import { generateSalePDF } from '../../utils/pdfGenerator';


export default function SalesPage() {
    const { create } = useSales();

    const handleSale = async () => {
        const sale: any = {
            date: new Date().toISOString(),
            branchId: 'branch-central',
            sellerId: 'user-1',
            items: [
                { productId: 'prod-001', name: 'Producto Demo', quantity: 1, price: 100 },
            ],
            subtotal: 100,
            discount: 0,
            total: 100,
            paymentMethod: 'cash',
            status: 'completed',
        };

        const saved = await create.mutateAsync(sale);
        const pdf = await generateSalePDF(saved);

        const url = URL.createObjectURL(pdf);
        window.open(url);
    };


    return (
        <div>
            <h1 className="text-xl font-bold">Registrar Venta</h1>
            <button onClick={handleSale} className="bg-black text-white px-4 py-2 mt-4">
                Finalizar Venta
            </button>
        </div>
    );
}