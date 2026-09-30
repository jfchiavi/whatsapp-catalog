import { api } from './api';

export interface TenantData {
  id: string;
  name: string;
  slug: string;
  domain?: string | null;
  logoUrl?: string | null;
  primaryColor?: string | null;
  description?: string | null;
  whatsappNumber?: string | null;
  active: boolean;
  _count?: {
    users: number;
    products: number;
    branches: number;
  };
}

export interface PlatformStats {
  tenantCount: number;
  userCount: number;
  productCount: number;
  orderCount: number;
  recentTenants: TenantData[];
}

export const fetchTenants = async (): Promise<TenantData[]> => {
  const { data } = await api.get('/platform/tenants');
  return data;
};

export const fetchTenantById = async (id: string): Promise<TenantData> => {
  const { data } = await api.get(`/platform/tenants/${id}`);
  return data;
};

export const createTenant = async (payload: {
  name: string;
  slug: string;
  domain?: string;
  logoUrl?: string;
  primaryColor?: string;
  description?: string;
  whatsappNumber?: string;
}): Promise<TenantData> => {
  const { data } = await api.post('/platform/tenants', payload);
  return data;
};

export const updateTenant = async (
  id: string,
  payload: Partial<{
    name: string;
    slug: string;
    domain: string;
    logoUrl: string;
    primaryColor: string;
    description: string;
    whatsappNumber: string;
  }>
): Promise<TenantData> => {
  const { data } = await api.put(`/platform/tenants/${id}`, payload);
  return data;
};

export const deleteTenant = async (id: string): Promise<void> => {
  await api.delete(`/platform/tenants/${id}`);
};

export const fetchPlatformStats = async (): Promise<PlatformStats> => {
  const { data } = await api.get('/platform/stats');
  return data;
};
