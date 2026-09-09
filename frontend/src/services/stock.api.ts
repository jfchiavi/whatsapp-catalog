import { api } from './api';
import type { StockByBranch, StockMovement } from '@/types/stock';
import { SEED_IDS } from '@/mocks/data';


// TODO: reemplazar por backend real
export const fetchStockByProduct = async (productId: string): Promise<StockByBranch[]> => {
    if (import.meta.env.VITE_USE_MOCKS === 'true') {
        return [
            { branchId: SEED_IDS.branchCentral, quantity: 25, minQuantity: 5 },
            { branchId: SEED_IDS.branchWeb, quantity: 100, minQuantity: 20 },
        ];
    }
    const { data } = await api.get(`/stock/product/${productId}`);
    return data;
};


export const transferStock = async (payload: {
    productId: string;
    fromBranchId: string;
    toBranchId: string;
    quantity: number;
}) => {
    if (import.meta.env.VITE_USE_MOCKS === 'true') {
        return { success: true };
    }
    return api.post('/stock/transfer', payload);
};


export const fetchStockHistory = async (productId: string): Promise<StockMovement[]> => {
    if (import.meta.env.VITE_USE_MOCKS === 'true') {
        return [];
    }
    const { data } = await api.get(`/stock/history/${productId}`);
    return data;
};
