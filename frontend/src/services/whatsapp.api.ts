import axios from 'axios';
import type { WhatsAppOrder } from '../types/whatsapp';


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

    const { data } = await axios.get('/api/whatsapp/orders');
    return data;
};


export const updateWhatsAppOrderStatus = async (id: string, status: string) => {
    if (import.meta.env.VITE_USE_MOCKS === 'true') {
        return { success: true };
    }

    return axios.put(`/api/whatsapp/orders/${id}`, { status });
};