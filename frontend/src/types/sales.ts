export type PaymentMethod = 'cash' | 'card' | 'transfer';


export interface SaleItem {
    productId: string;
    name: string;
    quantity: number;
    price: number;
    variant?: string;
}


export interface Sale {
    id: string;
    date: string;
    branchId: string;
    sellerId: string;
    customer?: {
        name: string;
        phone?: string;
        email?: string;
    };
    items: SaleItem[];
    subtotal: number;
    discount: number;
    total: number;
    paymentMethod: PaymentMethod;
    status: 'draft' | 'completed' | 'cancelled';
}

export type CreateSaleBody = {
  items: Array<{
    productId: string;
    quantity: number;
    price: number;
  }>;
  total: number;
  branchId: string;
};