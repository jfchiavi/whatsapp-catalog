import { api } from './api';

export interface Product {
  id: string;
  sku: string;
  name: string;
  price: number;
  cost: number;
  active: boolean;
}

export const getProducts = async (): Promise<Product[]> => {
  const { data } = await api.get('/products');
  return data;
};

export const createProduct = async (payload: Omit<Product, 'id'>) => {
  const { data } = await api.post('/products', payload);
  return data;
};

export const updateProduct = async (
  id: string,
  payload: Partial<Product>
) => {
  const { data } = await api.put(`/products/${id}`, payload);
  return data;
};

export const deleteProduct = async (id: string) => {
  await api.delete(`/products/${id}`);
};
