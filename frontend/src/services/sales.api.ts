import { api } from './api';
import type { CreateSaleBody, Sale } from '@/types/sales';


export const createSale = async (sale: CreateSaleBody): Promise<Sale> => {
    if (import.meta.env.VITE_USE_MOCKS === 'true') {
        return {
            id: `sale-${Date.now()}`,
            createdAt: new Date().toISOString(),
            branchId: sale.branchId ?? null,
            userId: 'mock-user',
            items: sale.items.map((item) => ({
                productId: item.variantId,
                name: item.variantId,
                quantity: item.quantity,
                price: 0,
            })),
            subtotal: 0,
            discount: 0,
            total: 0,
            paymentMethod: 'cash',
            status: 'completed',
        };
    }
    const { data } = await api.post('/sales', sale);
    return data;
};


export const fetchSales = async (): Promise<Sale[]> => {
    if (import.meta.env.VITE_USE_MOCKS === 'true') return [];
    const { data } = await api.get('/sales');
    return data;
};