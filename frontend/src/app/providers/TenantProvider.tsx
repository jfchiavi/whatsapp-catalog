import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { api } from '@/services/api';

export interface TenantConfig {
  id: string;
  name: string;
  slug: string;
  logoUrl: string | null;
  primaryColor: string;
  description: string | null;
  whatsappNumber: string | null;
}

interface TenantContextType {
  tenant: TenantConfig | null;
  loading: boolean;
  error: string | null;
}

const TenantContext = createContext<TenantContextType>({
  tenant: null,
  loading: true,
  error: null,
});

export const useTenant = () => useContext(TenantContext);

interface TenantProviderProps {
  children: ReactNode;
  slug?: string;
}

export function TenantProvider({ children, slug }: TenantProviderProps) {
  const [tenant, setTenant] = useState<TenantConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const resolveTenant = async () => {
      try {
        setLoading(true);
        setError(null);

        let resolvedTenant: TenantConfig | null = null;

        // Priority 1: slug from route params
        if (slug) {
          const { data } = await api.get(`/tenant/${slug}/config`);
          resolvedTenant = data;
        }

        // Priority 2: domain-based resolution
        if (!resolvedTenant) {
          const hostname = window.location.hostname;

          // In development (localhost), check for ?tenant= param
          if (hostname === 'localhost' || hostname === '127.0.0.1') {
            const urlParams = new URLSearchParams(window.location.search);
            const tenantParam = urlParams.get('tenant');
            if (tenantParam) {
              const { data } = await api.get(`/tenant/${tenantParam}/config`);
              resolvedTenant = data;
            }
          }

          // In production, check for subdomain
          if (!resolvedTenant && hostname !== 'localhost' && hostname !== '127.0.0.1') {
            const parts = hostname.split('.');
            if (parts.length > 2) {
              // Subdomain: tenant.plataforma.com
              const tenantSlug = parts[0];
              const { data } = await api.get(`/tenant/${tenantSlug}/config`);
              resolvedTenant = data;
            } else {
              // Custom domain: mitienda.com
              const { data } = await api.get(`/tenant/resolve?domain=${hostname}`);
              resolvedTenant = data;
            }
          }
        }

        setTenant(resolvedTenant);
      } catch (err) {
        setError('Failed to resolve tenant');
        setTenant(null);
      } finally {
        setLoading(false);
      }
    };

    resolveTenant();
  }, [slug]);

  return (
    <TenantContext.Provider value={{ tenant, loading, error }}>
      {children}
    </TenantContext.Provider>
  );
}
