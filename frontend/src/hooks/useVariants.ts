import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { CreateVariantInput, UpdateVariantInput } from '@/types/product';
import {
  getVariantsByProduct,
  createVariant,
  updateVariant,
  deleteVariant,
} from '@/services/variants.api';

export const useVariantsByProduct = (productId: string) => {
  return useQuery({
    queryKey: ['variants', productId],
    queryFn: () => getVariantsByProduct(productId),
    enabled: !!productId,
  });
};

export const useCreateVariant = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      productId,
      data,
    }: {
      productId: string;
      data: CreateVariantInput;
    }) => createVariant(productId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['variants', variables.productId] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });
};

export const useUpdateVariant = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: {
      id: string;
      data: UpdateVariantInput;
      productId: string;
    }) => updateVariant(payload.id, payload.data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['variants', variables.productId] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });
};

export const useDeleteVariant = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: {
      id: string;
      productId: string;
    }) => deleteVariant(payload.id),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['variants', variables.productId] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });
};
