import { useMutation, useQueryClient } from '@tanstack/react-query';
import { transferStock } from '../services/stock.api';


export const useStockManagement = () => {
    const queryClient = useQueryClient();

    const transfer = useMutation({
        mutationFn: transferStock,
        onMutate: async (payload) => {
            await queryClient.cancelQueries({ queryKey: ['stock', payload.productId] });


            const previous = queryClient.getQueryData(['stock', payload.productId]);


            queryClient.setQueryData(['stock', payload.productId], (old: any) =>
                old?.map((s: any) => {
                    if (s.branchId === payload.fromBranchId) {
                        return { ...s, quantity: s.quantity - payload.quantity };
                    }
                    if (s.branchId === payload.toBranchId) {
                        return { ...s, quantity: s.quantity + payload.quantity };
                    }
                    return s;
                })
            );


            return { previous };
        },
        onError: (_err, payload, context) => {
            queryClient.setQueryData(['stock', payload.productId], context?.previous);
        },
        onSettled: (_data, _err, payload) => {
            queryClient.invalidateQueries({ queryKey: ['stock', payload.productId] });
        },
    });

    return { transfer };
};