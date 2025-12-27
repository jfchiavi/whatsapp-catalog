import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchWhatsAppOrders, updateWhatsAppOrderStatus } from '../services/whatsapp.api';

export const useWhatsAppOrders = () => {
    const queryClient = useQueryClient();

    const orders = useQuery({
        queryKey: ['whatsapp-orders'],
        queryFn: fetchWhatsAppOrders,
        refetchInterval: 20000,
    });

    const updateStatus = useMutation({
        mutationFn: ({ id, status }: { id: string; status: string }) =>
        updateWhatsAppOrderStatus(id, status),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['whatsapp-orders'] });
        },
    });

    return { orders, updateStatus };
};