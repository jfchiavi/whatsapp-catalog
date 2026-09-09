import { useTenant as useTenantContext } from '@/app/providers/TenantProvider';

export const useTenant = () => {
  const { tenant, loading, error } = useTenantContext();

  const getWhatsAppUrl = (message: string) => {
    if (!tenant?.whatsappNumber) {
      return null;
    }
    return `https://wa.me/${tenant.whatsappNumber}?text=${encodeURIComponent(message)}`;
  };

  return {
    tenant,
    loading,
    error,
    getWhatsAppUrl,
  };
};
