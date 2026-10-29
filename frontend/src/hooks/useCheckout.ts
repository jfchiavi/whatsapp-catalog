import { useMutation, useQuery } from '@tanstack/react-query';
import {
  getCheckoutStatus,
  initiatePayment,
} from '../services/checkout.api';

export const useInitiatePayment = () => {
  return useMutation({
    mutationFn: ({
      tenantId,
      orderId,
      customerEmail,
      customerNit,
    }: {
      tenantId: string;
      orderId: string;
      customerEmail: string;
      customerNit?: string;
    }) => initiatePayment(tenantId, orderId, customerEmail, customerNit),
  });
};

export const useCheckoutStatus = (tenantId: string | null, orderId: string | null) => {
  return useQuery({
    queryKey: ['checkout-status', orderId],
    queryFn: () => getCheckoutStatus(tenantId!, orderId!),
    enabled: !!tenantId && !!orderId,
    // Tracking mínimo: mientras el pago siga iniciado se reconsulta solo;
    // al confirmarse (o fallar) deja de sondear.
    refetchInterval: (query) =>
      query.state.data?.gatewayStatus === 'initiated' ? 5000 : false,
    retry: 1,
  });
};
