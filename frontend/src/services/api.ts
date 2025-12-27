// src/services/api.ts

import axios from 'axios';
import { mockData } from '../mocks/data';

export interface Product {
  id: string;
  sku: string;
  name: string;
  price: number;
  cost: number;
  stock: Record<string, number>;
  minStock?: Record<string, number>;
}

// 👉 ESTA FUNCIÓN FALTABA
export const fetchProducts = async (): Promise<Product[]> => {
  // Modo mocks
  if (import.meta.env.VITE_USE_MOCKS === 'true') {
    return mockData.products;
  }

  // Backend real (cuando exista)
  const { data } = await axios.get('/api/products');
  return data;
};
