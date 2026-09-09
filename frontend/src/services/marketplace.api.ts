import { api } from './api';
import type { Product } from '@/types/product';

export interface MarketplaceProduct extends Product {
  tenant: {
    id: string;
    name: string;
    slug: string;
    logoUrl: string | null;
    primaryColor: string;
  };
}

export const getMarketplaceProducts = async (params?: {
  q?: string;
  page?: number;
  pageSize?: number;
}): Promise<{ products: MarketplaceProduct[]; total: number }> => {
  const { data } = await api.get('/marketplace/products', { params });
  // The interceptor unwraps { success, data, meta } to just data
  // So data here is already the products array
  return { products: data as MarketplaceProduct[], total: (data as any[])?.length || 0 };
};
