import axios from 'axios';
import type { Sale } from '../types/sales';


export const createSale = async (sale: Omit<Sale, 'id'>): Promise<Sale> => {
    if (import.meta.env.VITE_USE_MOCKS === 'true') {
        return {
            ...sale,
            id: `sale-${Date.now()}`,
        } as Sale;
    }

    const { data } = await axios.post('/api/sales', sale);
    return data;
};


export const fetchSales = async (): Promise<Sale[]> => {
    if (import.meta.env.VITE_USE_MOCKS === 'true') return [];
    const { data } = await axios.get('/api/sales');
    return data;
};