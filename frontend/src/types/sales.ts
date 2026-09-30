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
    createdAt: string;
    branchId: string | null;
    userId: string;
    user?: { id: string; name: string; email?: string };
    branch?: { id: string; name: string };
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