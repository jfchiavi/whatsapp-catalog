import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  exportReconciliationCsv,
  fetchReconciliation,
  syncOrderPayment,
} from '../services/payments.api';

export const useReconciliation = (
  from: string,
  to: string,
  page: number,
  pageSize = 20
) => {
  return useQuery({
    queryKey: ['reconciliation', from, to, page, pageSize],
    queryFn: () => fetchReconciliation({ from, to, page, pageSize }),
    enabled: !!from && !!to,
    placeholderData: keepPreviousData,
  });
};

export const useExportReconciliation = () => {
  return useMutation({
    mutationFn: ({ from, to }: { from: string; to: string }) =>
      exportReconciliationCsv(from, to),
  });
};

export const useSyncPayment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (orderId: string) => syncOrderPayment(orderId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['order'] });
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['reconciliation'] });
    },
  });
};
