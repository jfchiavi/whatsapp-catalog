// src/services/api.ts

import axios from 'axios';
import { mockData } from '@/mocks/data';
// TODO: revisar el tema Stock y minStock una vez que funcioe el ABM
// export interface Product {
//   id: string;
//   sku: string;
//   name: string;
//   price: number;
//   cost: number;
//   stock: Record<string, number>;
//   minStock?: Record<string, number>;
// }

export interface Product {
  id: string;
  sku: string;
  name: string;
  price: number;
  cost: number;
  active: boolean;
  createdAt: string;
}

// 👉 ESTA FUNCIÓN FALTABA
export const fetchProducts = async (): Promise<Product[]> => {
  // Modo mocks
  if (import.meta.env.VITE_USE_MOCKS === 'true') {
    return mockData.products2;
  }

  // Backend real (cuando exista)
  const { data } = await axios.get('/api/products');
  return data;
};
