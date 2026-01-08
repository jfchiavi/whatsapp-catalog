import { api } from './api';
import type { StockByBranch, StockMovement } from '@/types/stock';


// TODO: reemplazar por backend real
export const fetchStockByProduct = async (productId: string): Promise<StockByBranch[]> => {
    if (import.meta.env.VITE_USE_MOCKS === 'true') {
        return [
            { branchId: 'branch-central', quantity: 25, minQuantity: 5 },
            { branchId: 'branch-web', quantity: 15, minQuantity: 20 },
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