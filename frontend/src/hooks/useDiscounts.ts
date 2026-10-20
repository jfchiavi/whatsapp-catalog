import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  createDiscount,
  deleteDiscount,
  fetchDiscounts,
  updateDiscount,
  type DiscountPayload,
} from '@/services/discounts.api';

export const useDiscounts = (active?: boolean) => {
  return useQuery({
    queryKey: ['discounts', active ?? 'all'],
    queryFn: () => fetchDiscounts(active),
    staleTime: 30_000,
  });
};

export const useCreateDiscount = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createDiscount,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['discounts'] });
    },
  });
};

export const useUpdateDiscount = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<DiscountPayload> }) =>
      updateDiscount(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['discounts'] });
    },
  });
};

export const useDeleteDiscount = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteDiscount,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['discounts'] });
    },
  });
};
