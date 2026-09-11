import { api } from './api';

export interface CartItemData {
  id: string;
  variantId: string;
  quantity: number;
  unitPriceSnapshot: number;
  variant: {
    id: string;
    sku: string;
    price: number;
    attributes: Record<string, string>;
    product: {
      id: string;
      name: string;
      imageUrl?: string;
    };
  };
}

export interface CartData {
  id: string;
  tenantId: string;
  sessionId: string;
  branchId: string | null;
  status: string;
  expiresAt: string;
  items: CartItemData[];
  branch?: {
    id: string;
    name: string;
  } | null;
}

export interface OrderItemData {
  id: string;
  variantId: string;
  quantity: number;
  unitPriceSnapshot: number;
  skuSnapshot: string;
  attributesSnapshot: Record<string, string>;
  variant: {
    id: string;
    sku: string;
    product: { name: string; imageUrl?: string };
  };
}

export interface OrderData {
  id: string;
  tenantId: string;
  branchId: string;
  customerName: string;
  customerPhone: string;
  customerNotes?: string;
  status: string;
  totalSnapshot: number;
  whatsappMessage: string;
  whatsappUrl: string;
  createdAt: string;
  items: OrderItemData[];
  branch: { id: string; name: string };
  customer?: { id: string; name: string; phone: string } | null;
}

export const createCart = async (tenantId: string, sessionId: string): Promise<CartData> => {
  const { data } = await api.post('/carts', { tenantId, sessionId });
  return data;
};

export const getCart = async (cartId: string, tenantId: string): Promise<CartData> => {
  const { data } = await api.get(`/carts/${cartId}?tenantId=${tenantId}`);
  return data;
};

export const addToCart = async (
  cartId: string,
  tenantId: string,
  variantId: string,
  quantity: number
): Promise<CartItemData> => {
  const { data } = await api.post(`/carts/${cartId}/items`, {
    tenantId,
    variantId,
    quantity,
  });
  return data;
};

export const updateCartItem = async (
  cartId: string,
  tenantId: string,
  itemId: string,
  quantity: number
): Promise<CartItemData> => {
  const { data } = await api.patch(`/carts/${cartId}/items/${itemId}`, {
    tenantId,
    quantity,
  });
  return data;
};

export const removeCartItem = async (
  cartId: string,
  tenantId: string,
  itemId: string
): Promise<void> => {
  await api.delete(`/carts/${cartId}/items/${itemId}?tenantId=${tenantId}`);
};

export const setCartBranch = async (
  cartId: string,
  tenantId: string,
  branchId: string
): Promise<CartData> => {
  const { data } = await api.patch(`/carts/${cartId}/branch`, {
    tenantId,
    branchId,
  });
  return data;
};

export const submitCartOrder = async (
  tenantId: string,
  cartId: string,
  customerName: string,
  customerPhone: string,
  customerNotes?: string
): Promise<OrderData> => {
  const { data } = await api.post('/orders', {
    tenantId,
    cartId,
    customerName,
    customerPhone,
    customerNotes,
  });
  return data;
};

export const fetchOrders = async (
  tenantId: string,
  branchId?: string
): Promise<OrderData[]> => {
  const params = new URLSearchParams({ tenantId });
  if (branchId) params.append('branchId', branchId);
  const { data } = await api.get(`/orders?${params.toString()}`);
  return data;
};

export const fetchOrderById = async (
  tenantId: string,
  orderId: string
): Promise<OrderData> => {
  const { data } = await api.get(`/orders/${orderId}?tenantId=${tenantId}`);
  return data;
};

export const updateOrderStatus = async (
  tenantId: string,
  orderId: string,
  status: string
): Promise<OrderData> => {
  const { data } = await api.patch(`/orders/${orderId}/status`, {
    tenantId,
    status,
  });
  return data;
};

export const confirmOrder = async (
  tenantId: string,
  orderId: string,
  userId: string
) => {
  const { data } = await api.post(`/orders/${orderId}/confirm`, {
    tenantId,
    userId,
  });
  return data;
};
