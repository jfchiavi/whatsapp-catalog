import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createSale } from '../services/sales.api';


export const useSales = () => {
    const queryClient = useQueryClient();

    const create = useMutation({
        mutationFn: createSale,
        onMutate: async (newSale: any) => {
            await queryClient.cancelQueries({ queryKey: ['stock'] });

            const previousStock = queryClient.getQueryData(['stock', newSale.branchId]);

            newSale.items.forEach((item: any) => {
                queryClient.setQueryData(
                    ['stock', item.productId],
                        (old: any) =>
                        old?.map((s: any) =>
                            s.branchId === newSale.branchId
                                ? { ...s, quantity: s.quantity - item.quantity }
                                : s
                        )
                );
            });


            return { previousStock };
        },
        onError: (_err, _sale, ctx) => {
            if (ctx?.previousStock) {
                queryClient.setQueryData(['stock'], ctx.previousStock);
            }
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: ['stock'] });
            queryClient.invalidateQueries({ queryKey: ['sales'] });
        },
    });

    return { create };
};