import { api } from './api';
import type { Variant, CreateVariantInput, UpdateVariantInput } from '@/types/product';

export const getVariantsByProduct = async (productId: string): Promise<Variant[]> => {
  const { data } = await api.get(`/products/${productId}/variants`);
  return data;
};

export const createVariant = async (
  productId: string,
  payload: CreateVariantInput
): Promise<Variant> => {
  const { data } = await api.post(`/products/${productId}/variants`, payload);
  return data;
};

export const updateVariant = async (
  id: string,
  payload: UpdateVariantInput
): Promise<Variant> => {
  const { data } = await api.put(`/variants/${id}`, payload);
  return data;
};

export const deleteVariant = async (id: string): Promise<void> => {
  await api.delete(`/variants/${id}`);
};
