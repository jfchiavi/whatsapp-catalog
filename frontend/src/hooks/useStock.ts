import { useQuery } from '@tanstack/react-query';
import { fetchStockByProduct } from '../services/stock.api';


export const useStock = (productId: string) => {
    return useQuery({
        queryKey: ['stock', productId],
        queryFn: () => fetchStockByProduct(productId),
        refetchInterval: 30000,
        staleTime: 10000,
    });
};