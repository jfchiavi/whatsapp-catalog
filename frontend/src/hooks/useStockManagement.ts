import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createTransfer } from '../services/stock.api';

export const useStockManagement = () => {
    const queryClient = useQueryClient();

    const transfer = useMutation({
        mutationFn: createTransfer,
        onMutate: async () => {
            await queryClient.cancelQueries({ queryKey: ['stock'] });

            const previous = queryClient.getQueryData(['stock']);

            return { previous };
        },
        onError: (_err, _payload, context) => {
            queryClient.setQueryData(['stock'], context?.previous);
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: ['stock'] });
        },
    });

    return { transfer };
};
