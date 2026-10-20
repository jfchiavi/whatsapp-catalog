import { api } from './api';

export type DiscountType = 'PERCENTAGE' | 'FIXED';

export interface DiscountData {
  id: string;
  tenantId: string;
  name: string;
  type: DiscountType;
  value: number;
  productId: string | null;
  variantId: string | null;
  active: boolean;
  startDate: string;
  endDate: string;
  createdAt: string;
  updatedAt: string;
  product?: { id: string; name: string } | null;
  variant?: { id: string; sku: string } | null;
}

export interface DiscountPayload {
  name: string;
  type: DiscountType;
  value: number;
  productId?: string | null;
  variantId?: string | null;
  active?: boolean;
  startDate: string;
  endDate: string;
}

export const fetchDiscounts = async (active?: boolean): Promise<DiscountData[]> => {
  const params = new URLSearchParams();
  if (active !== undefined) params.append('active', String(active));

  const { data } = await api.get(`/discounts?${params.toString()}`);
  return data;
};

export const fetchDiscountById = async (id: string): Promise<DiscountData> => {
  const { data } = await api.get(`/discounts/${id}`);
  return data;
};

export const createDiscount = async (payload: DiscountPayload): Promise<DiscountData> => {
  const { data } = await api.post('/discounts', payload);
  return data;
};

export const updateDiscount = async (
  id: string,
  payload: Partial<DiscountPayload>
): Promise<DiscountData> => {
  const { data } = await api.put(`/discounts/${id}`, payload);
  return data;
};

export const deleteDiscount = async (id: string): Promise<{ id: string }> => {
  const { data } = await api.delete(`/discounts/${id}`);
  return data;
};
