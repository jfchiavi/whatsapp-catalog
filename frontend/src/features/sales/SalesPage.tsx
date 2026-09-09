import { useSales } from '@/hooks/useSales';
import { generateSalePDF } from '@/utils/pdfGenerator';
import { SEED_IDS } from '@/mocks/data';

export default function SalesPage() {
    const { create } = useSales();

    const handleSale = async () => {
        const sale: any = {
            date: new Date().toISOString(),
            branchId: SEED_IDS.branchCentral,
            sellerId: SEED_IDS.userSeller,
            items: [
                { variantId: SEED_IDS.variantTshirtRedM, name: 'Remera Oversize', quantity: 1, price: 8500 },
            ],
            subtotal: 8500,
            discount: 0,
            total: 8500,
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
