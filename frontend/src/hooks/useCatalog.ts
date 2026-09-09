import { useQuery } from '@tanstack/react-query';
import { getCatalogProducts, getCatalogProductById } from '@/services/catalog.api';

const DEMO_TENANT_ID = import.meta.env.VITE_DEMO_TENANT_ID || '';

export const useCatalogProducts = () => {
  return useQuery({
    queryKey: ['catalog-products'],
    queryFn: () => getCatalogProducts(DEMO_TENANT_ID),
    enabled: !!DEMO_TENANT_ID,
  });
};

export const useCatalogProduct = (id: string) => {
  return useQuery({
    queryKey: ['catalog-product', id],
    queryFn: () => getCatalogProductById(id, DEMO_TENANT_ID),
    enabled: !!DEMO_TENANT_ID && !!id,
  });
};
