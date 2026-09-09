import axios from 'axios';
import type { Product } from '@/types/product';

const catalogApi = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
});

export const getCatalogProducts = async (tenantId: string): Promise<Product[]> => {
  const { data } = await catalogApi.get('/catalog/products', {
    headers: { 'X-Tenant-ID': tenantId },
  });
  return data.data;
};

export const getCatalogProductById = async (
  id: string,
  tenantId: string
): Promise<Product> => {
  const { data } = await catalogApi.get(`/catalog/products/${id}`, {
    headers: { 'X-Tenant-ID': tenantId },
  });
  return data.data;
};
