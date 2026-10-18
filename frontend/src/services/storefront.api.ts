import { api } from './api';
import type { TenantHomeContent, TenantHomeDraftResponse, TenantHomePublicationSummary } from '@/types/storefront';

export const getTenantHomeDraft = async (): Promise<TenantHomeDraftResponse> => {
  const { data } = await api.get('/storefront/admin');
  return data;
};

export const saveTenantHomeDraft = async (content: TenantHomeContent): Promise<TenantHomeContent> => {
  const { data } = await api.put('/storefront/admin', { content });
  return data.draftContent;
};

export const publishTenantHomeDraft = async (): Promise<{ publishedAt: string; revision: number }> => {
  const { data } = await api.post('/storefront/admin/publish');
  return { publishedAt: data.publishedAt, revision: data.revision };
};

export const getTenantHomePublicationHistory = async (): Promise<TenantHomePublicationSummary[]> => {
  const { data } = await api.get('/storefront/admin/history');
  return data;
};

export const restoreTenantHomePublication = async (revision: number): Promise<TenantHomeContent> => {
  const { data } = await api.post(`/storefront/admin/history/${revision}/restore`);
  return data.draftContent;
};

export const getPublishedTenantHome = async (slug: string) => {
  const { data } = await api.get(`/storefront/${slug}`);
  return data as { content: TenantHomeContent; publishedAt: string } | null;
};