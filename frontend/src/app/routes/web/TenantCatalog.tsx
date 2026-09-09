import { useParams } from 'react-router-dom';
import { TenantProvider } from '@/app/providers/TenantProvider';
import { useTenant } from '@/hooks/useTenant';
import { useCatalogProducts } from '@/hooks/useCatalog';
import { ProductCard } from '@/components/product/ProductCard';
import { Header } from '@/components/header/Header';

function TenantCatalogContent() {
  const { tenant, loading: tenantLoading, error: tenantError } = useTenant();
  const { data: products, isLoading, error } = useCatalogProducts();

  if (tenantLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Cargando tienda...</p>
      </div>
    );
  }

  if (tenantError || !tenant) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-red-600">Tienda no encontrada</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ '--primary-color': tenant.primaryColor } as React.CSSProperties}>
      <Header />

      <main className="max-w-7xl mx-auto p-4">
        {tenant.description && (
          <div className="mb-8 text-center">
            <p className="text-gray-600">{tenant.description}</p>
          </div>
        )}

        {isLoading && <p className="text-center">Cargando productos...</p>}
        {error && <p className="text-center text-red-600">Error al cargar productos</p>}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {products?.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>

        {products?.length === 0 && (
          <p className="text-center text-gray-500">No hay productos disponibles</p>
        )}
      </main>

      <footer className="mt-12 py-6 border-t text-center text-gray-500 text-sm">
        <p>{tenant.name}</p>
      </footer>
    </div>
  );
}

export default function TenantCatalog() {
  const { tenantSlug } = useParams();

  return (
    <TenantProvider slug={tenantSlug}>
      <TenantCatalogContent />
    </TenantProvider>
  );
}
