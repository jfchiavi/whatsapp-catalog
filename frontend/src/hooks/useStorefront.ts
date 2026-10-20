import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  getPublishedTenantHome,
  getTenantHomePublicationHistory,
  getTenantHomeDraft,
  publishTenantHomeDraft,
  restoreTenantHomePublication,
  saveTenantHomeDraft,
} from '@/services/storefront.api';
import type { TenantHomeContent } from '@/types/storefront';

export const useTenantHomeDraft = () => useQuery({
  queryKey: ['storefront-draft'],
  queryFn: getTenantHomeDraft,
});

export const usePublishedTenantHome = (slug?: string) => useQuery({
  queryKey: ['storefront-published', slug],
  queryFn: () => getPublishedTenantHome(slug!),
  enabled: Boolean(slug),
});

export const useTenantHomePublicationHistory = () => useQuery({
  queryKey: ['storefront-history'],
  queryFn: getTenantHomePublicationHistory,
});

export const useSaveTenantHomeDraft = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (content: TenantHomeContent) => saveTenantHomeDraft(content),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['storefront-draft'] }),
  });
};

export const usePublishTenantHomeDraft = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: publishTenantHomeDraft,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['storefront-draft'] });
      queryClient.invalidateQueries({ queryKey: ['storefront-published'] });
      queryClient.invalidateQueries({ queryKey: ['storefront-history'] });
    },
  });
};
import type { StorefrontMetrics } from '@/services/storefront.api';
import { getStorefrontMetrics } from '@/services/storefront.api';

export const useRestoreTenantHomePublication = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: restoreTenantHomePublication,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['storefront-draft'] }),
  });
};

export const useStorefrontMetrics = (days: number) => useQuery<StorefrontMetrics>({
  queryKey: ['storefront-metrics', days],
  queryFn: () => getStorefrontMetrics(days),
});