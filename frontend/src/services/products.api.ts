import axios from 'axios';

export interface Product {
  id: string;
  sku: string;
  name: string;
  price: number;
  cost: number;
  active: boolean;
}

export const getProducts = async (): Promise<Product[]> => {
  const { data } = await axios.get('/api/products');
  return data;
};

export const createProduct = async (payload: Omit<Product, 'id'>) => {
  const { data } = await axios.post('/api/products', payload);
  return data;
};

export const updateProduct = async (
  id: string,
  payload: Partial<Product>
) => {
  const { data } = await axios.put(`/api/products/${id}`, payload);
  return data;
};

export const deleteProduct = async (id: string) => {
  await axios.delete(`/api/products/${id}`);
};
