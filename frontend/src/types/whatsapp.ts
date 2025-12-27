export type WhatsAppOrderStatus = 'pending' | 'processing' | 'completed' | 'cancelled';


export interface WhatsAppOrderItem {
    productId: string;
    name: string;
    quantity: number;
    variant?: string;
}


export interface WhatsAppOrder {
    id: string;
    customerName: string;
    customerPhone: string;
    message: string;
    items: WhatsAppOrderItem[];
    total: number;
    status: WhatsAppOrderStatus;
    createdAt: string;
    processedAt?: string;
}