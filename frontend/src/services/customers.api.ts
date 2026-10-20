import { api } from './api';

export interface CustomerData {
  id: string;
  tenantId: string;
  name: string;
  phone: string;
  email: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  _count?: { orders: number };
}

export interface CustomerOrderData {
  id: string;
  status: string;
  totalSnapshot: number;
  customerName: string;
  customerPhone: string;
  createdAt: string;
  branch?: { id: string; name: string } | null;
  items: {
    id: string;
    quantity: number;
    unitPriceSnapshot: number;
    skuSnapshot: string;
    variant?: { id: string; sku: string; product?: { id: string; name: string } | null } | null;
  }[];
}

export const fetchCustomers = async (options: {
  search?: string;
  page?: number;
  pageSize?: number;
} = {}): Promise<CustomerData[]> => {
  const params = new URLSearchParams();
  if (options.search) params.append('search', options.search);
  if (options.page) params.append('page', String(options.page));
  if (options.pageSize) params.append('pageSize', String(options.pageSize));

  const { data } = await api.get(`/customers?${params.toString()}`);
  return data;
};

export const fetchCustomerById = async (id: string): Promise<CustomerData> => {
  const { data } = await api.get(`/customers/${id}`);
  return data;
};

export const fetchCustomerOrders = async (id: string): Promise<CustomerOrderData[]> => {
  const { data } = await api.get(`/customers/${id}/orders`);
  return data;
};
