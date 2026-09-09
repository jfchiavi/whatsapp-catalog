import { api } from './api';

export interface TenantSettings {
  id: string;
  name: string;
  slug: string;
  domain: string | null;
  logoUrl: string | null;
  primaryColor: string;
  description: string | null;
  whatsappNumber: string | null;
  active: boolean;
}

export type UpdateTenantSettings = Partial<Omit<TenantSettings, 'id' | 'active'>>;

export const getTenantSettings = async (tenantId: string): Promise<TenantSettings> => {
  const { data } = await api.get(`/tenants/${tenantId}/config`);
  return data;
};

export const updateTenantSettings = async (
  tenantId: string,
  settings: UpdateTenantSettings
): Promise<TenantSettings> => {
  const { data } = await api.put(`/tenants/${tenantId}/config`, settings);
  return data;
};
