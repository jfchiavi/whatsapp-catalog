import { api } from './api';
import type { TenantHomeContent, TenantHomeDraftResponse } from '@/types/storefront';

export const getTenantHomeDraft = async (): Promise<TenantHomeDraftResponse> => {
  const { data } = await api.get('/storefront/admin');
  return data;
};

export const saveTenantHomeDraft = async (content: TenantHomeContent): Promise<TenantHomeContent> => {
  const { data } = await api.put('/storefront/admin', { content });
  return data.draftContent;
};

export const publishTenantHomeDraft = async (): Promise<{ publishedAt: string }> => {
  const { data } = await api.post('/storefront/admin/publish');
  return { publishedAt: data.publishedAt };
};

export const getPublishedTenantHome = async (slug: string) => {
  const { data } = await api.get(`/storefront/${slug}`);
  return data as { content: TenantHomeContent; publishedAt: string } | null;
};