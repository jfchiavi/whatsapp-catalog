import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  fetchStockByBranch,
  fetchStockByProduct,
  adjustStock,
  createTransfer,
  receiveTransfer,
  cancelTransfer,
  fetchPendingTransfers,
  fetchStockHistory,
} from '../services/stock.api';

export const useStockByBranch = (branchId: string) => {
  return useQuery({
    queryKey: ['stock', 'branch', branchId],
    queryFn: () => fetchStockByBranch(branchId),
    enabled: !!branchId,
    refetchInterval: 30000,
    staleTime: 10000,
  });
};

export const useStockByProduct = (productId: string) => {
  return useQuery({
    queryKey: ['stock', 'product', productId],
    queryFn: () => fetchStockByProduct(productId),
    enabled: !!productId,
    refetchInterval: 30000,
    staleTime: 10000,
  });
};

export const useAdjustStock = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: adjustStock,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stock'] });
    },
  });
};

export const useCreateTransfer = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createTransfer,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stock'] });
      queryClient.invalidateQueries({ queryKey: ['pendingTransfers'] });
    },
  });
};

export const useReceiveTransfer = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ movementId, receivedQuantity }: { movementId: string; receivedQuantity: number }) =>
      receiveTransfer(movementId, receivedQuantity),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stock'] });
      queryClient.invalidateQueries({ queryKey: ['pendingTransfers'] });
    },
  });
};

export const useCancelTransfer = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: cancelTransfer,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stock'] });
      queryClient.invalidateQueries({ queryKey: ['pendingTransfers'] });
    },
  });
};

export const usePendingTransfers = (branchId?: string) => {
  return useQuery({
    queryKey: ['pendingTransfers', branchId],
    queryFn: () => fetchPendingTransfers(branchId),
    refetchInterval: 30000,
    staleTime: 10000,
  });
};

export const useStockHistory = (variantId: string, branchId?: string) => {
  return useQuery({
    queryKey: ['stockHistory', variantId, branchId],
    queryFn: () => fetchStockHistory(variantId, branchId),
    enabled: !!variantId,
  });
};
