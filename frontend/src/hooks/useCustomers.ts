import { useQuery } from '@tanstack/react-query';
import {
  fetchCustomerById,
  fetchCustomerOrders,
  fetchCustomers,
} from '@/services/customers.api';

export const useCustomers = (search?: string) => {
  return useQuery({
    queryKey: ['customers', search ?? ''],
    queryFn: () => fetchCustomers({ search, pageSize: 50 }),
    staleTime: 30_000,
  });
};

export const useCustomer = (id: string) => {
  return useQuery({
    queryKey: ['customer', id],
    queryFn: () => fetchCustomerById(id),
    enabled: !!id,
  });
};

export const useCustomerOrders = (id: string) => {
  return useQuery({
    queryKey: ['customer-orders', id],
    queryFn: () => fetchCustomerOrders(id),
    enabled: !!id,
  });
};
