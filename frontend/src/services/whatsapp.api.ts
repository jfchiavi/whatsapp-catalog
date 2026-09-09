import { api } from './api';
import type { WhatsAppOrder } from '@/types/whatsapp';
import { SEED_IDS } from '@/mocks/data';


export const fetchWhatsAppOrders = async (): Promise<WhatsAppOrder[]> => {
    if (import.meta.env.VITE_USE_MOCKS === 'true') {
        return [
            {
                id: SEED_IDS.waOrder1,
                customerName: 'Juan Pérez',
                customerPhone: '+5491112345678',
                message: 'Hola! Quiero comprar 2 Remeras Talle M y 1 Jean Talle 38. ¿Tienen stock?',
                items: [
                    { productId: SEED_IDS.productTshirt, name: 'Remera Oversize', quantity: 2 },
                    { productId: SEED_IDS.productJeans, name: 'Pantalón Jean Slim', quantity: 1 },
                ],
                total: 23500,
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
