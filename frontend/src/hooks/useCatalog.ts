import { useQuery } from '@tanstack/react-query';
import { getCatalogProducts, getCatalogProductById } from '@/services/catalog.api';
import { useTenant } from './useTenant';

export const useCatalogProducts = () => {
  const { tenant, loading: tenantLoading } = useTenant();

  return useQuery({
    queryKey: ['catalog-products', tenant?.id],
    queryFn: () => getCatalogProducts(tenant!.id),
    enabled: !tenantLoading && !!tenant?.id,
  });
};

export const useCatalogProduct = (id: string) => {
  const { tenant, loading: tenantLoading } = useTenant();

  return useQuery({
    queryKey: ['catalog-product', id, tenant?.id],
    queryFn: () => getCatalogProductById(id, tenant!.id),
    enabled: !tenantLoading && !!tenant?.id && !!id,
  });
};
