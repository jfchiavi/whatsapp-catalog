import { api } from './api';
import type { Sale } from '@/types/sales';


export const createSale = async (sale: Omit<Sale, 'id'>): Promise<Sale> => {
    if (import.meta.env.VITE_USE_MOCKS === 'true') {
        return {
            ...sale,
            id: `sale-${Date.now()}`,
        } as Sale;
    }

    const { data } = await api.post('/sales', sale);
    return data;
};


export const fetchSales = async (): Promise<Sale[]> => {
    if (import.meta.env.VITE_USE_MOCKS === 'true') return [];
    const { data } = await api.get('/sales');
    return data;
};