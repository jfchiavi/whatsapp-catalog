import { api } from './api';
import type { WhatsAppOrder } from '@/types/whatsapp';


export const fetchWhatsAppOrders = async (): Promise<WhatsAppOrder[]> => {
    if (import.meta.env.VITE_USE_MOCKS === 'true') {
        return [
            {
                id: 'wa-001',
                customerName: 'Juan Pérez',
                customerPhone: '+5491122334455',
                message: 'Hola, quiero comprar 1 producto demo',
                items: [{ productId: 'prod-001', name: 'Producto Demo', quantity: 1 }],
                total: 100,
                status: 'pending',
                createdAt: new Date().toISOString(),
            },
        ];
    }

    const { data } = await api.get('/whatsapp/orders');
    return data;
};


export const updateWhatsAppOrderStatus = async (id: string, status: string) => {
    if (import.meta.env.VITE_USE_MOCKS === 'true') {
        return { success: true };
    }

    return api.put(`/whatsapp/orders/${id}`, { status });
};