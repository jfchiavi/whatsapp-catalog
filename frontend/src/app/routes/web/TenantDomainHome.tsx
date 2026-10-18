import { TenantProvider } from '@/app/providers/TenantProvider';
import { useTenant } from '@/hooks/useTenant';
import Marketplace from './Marketplace';
import { TenantHomeContent } from './TenantHome';

function TenantDomainHomeContent() {
  const { tenant, loading } = useTenant();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white">
        <p className="text-sm text-gray-500">Cargando tienda...</p>
      </div>
    );
  }

  return tenant ? <TenantHomeContent /> : <Marketplace />;
}

export default function TenantDomainHome() {
  return (
    <TenantProvider>
      <TenantDomainHomeContent />
    </TenantProvider>
  );
}