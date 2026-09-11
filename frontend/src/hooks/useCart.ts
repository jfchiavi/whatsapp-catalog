import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  createCart,
  getCart,
  addToCart,
  updateCartItem,
  removeCartItem,
  setCartBranch,
  submitCartOrder,
  fetchOrders,
  fetchOrderById,
  updateOrderStatus,
  confirmOrder,
} from '../services/cart.api';

export const useCart = (tenantId: string | null, sessionId: string | null) => {
  return useQuery({
    queryKey: ['cart', tenantId, sessionId],
    queryFn: async () => {
      if (!tenantId || !sessionId) return null;
      try {
        return await getCart(
          localStorage.getItem(`cart-id-${tenantId}`) || '',
          tenantId
        );
      } catch {
        const cart = await createCart(tenantId, sessionId);
        localStorage.setItem(`cart-id-${tenantId}`, cart.id);
        return cart;
      }
    },
    enabled: !!tenantId && !!sessionId,
    staleTime: 30000,
  });
};

export const useAddToCart = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      cartId,
      tenantId,
      variantId,
      quantity,
    }: {
      cartId: string;
      tenantId: string;
      variantId: string;
      quantity: number;
    }) => addToCart(cartId, tenantId, variantId, quantity),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['cart', variables.tenantId],
      });
    },
  });
};

export const useUpdateCartItem = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      cartId,
      tenantId,
      itemId,
      quantity,
    }: {
      cartId: string;
      tenantId: string;
      itemId: string;
      quantity: number;
    }) => updateCartItem(cartId, tenantId, itemId, quantity),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['cart', variables.tenantId],
      });
    },
  });
};

export const useRemoveCartItem = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      cartId,
      tenantId,
      itemId,
    }: {
      cartId: string;
      tenantId: string;
      itemId: string;
    }) => removeCartItem(cartId, tenantId, itemId),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['cart', variables.tenantId],
      });
    },
  });
};

export const useSetCartBranch = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      cartId,
      tenantId,
      branchId,
    }: {
      cartId: string;
      tenantId: string;
      branchId: string;
    }) => setCartBranch(cartId, tenantId, branchId),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['cart', variables.tenantId],
      });
    },
  });
};

export const useSubmitCart = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      tenantId,
      cartId,
      customerName,
      customerPhone,
      customerNotes,
    }: {
      tenantId: string;
      cartId: string;
      customerName: string;
      customerPhone: string;
      customerNotes?: string;
    }) => submitCartOrder(tenantId, cartId, customerName, customerPhone, customerNotes),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['cart', variables.tenantId],
      });
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    },
  });
};

export const useOrders = (tenantId: string, branchId?: string) => {
  return useQuery({
    queryKey: ['orders', tenantId, branchId],
    queryFn: () => fetchOrders(tenantId, branchId),
    enabled: !!tenantId,
  });
};

export const useOrder = (tenantId: string, orderId: string) => {
  return useQuery({
    queryKey: ['order', tenantId, orderId],
    queryFn: () => fetchOrderById(tenantId, orderId),
    enabled: !!tenantId && !!orderId,
  });
};

export const useUpdateOrderStatus = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      tenantId,
      orderId,
      status,
    }: {
      tenantId: string;
      orderId: string;
      status: string;
    }) => updateOrderStatus(tenantId, orderId, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    },
  });
};

export const useConfirmOrder = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      tenantId,
      orderId,
      userId,
    }: {
      tenantId: string;
      orderId: string;
      userId: string;
    }) => confirmOrder(tenantId, orderId, userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['stock'] });
      queryClient.invalidateQueries({ queryKey: ['sales'] });
    },
  });
};
