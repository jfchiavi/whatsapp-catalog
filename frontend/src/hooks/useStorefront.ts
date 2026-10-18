import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  getPublishedTenantHome,
  getTenantHomeDraft,
  publishTenantHomeDraft,
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
    },
  });
};