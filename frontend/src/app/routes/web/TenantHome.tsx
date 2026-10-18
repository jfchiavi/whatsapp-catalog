import { useParams, Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { TenantProvider } from '@/app/providers/TenantProvider';
import { Header } from '@/components/header/Header';
import { TenantProductCard } from '@/components/tenant/TenantProductCard';
import { TenantHomeSections } from '@/components/tenant/TenantHomeSections';
import { useCatalogProducts } from '@/hooks/useCatalog';
import { usePublishedTenantHome } from '@/hooks/useStorefront';
import { useTenant } from '@/hooks/useTenant';
import type { TenantHomeContent } from '@/types/storefront';

export function TenantHomeContent() {
  const { tenantSlug } = useParams();
  const { tenant, loading: tenantLoading, error: tenantError } = useTenant();
  const { data: products = [], isLoading, error } = useCatalogProducts();
  const { data: publishedHome } = usePublishedTenantHome(tenant?.slug);
  const catalogPath = tenantSlug ? `/t/${tenantSlug}/catalogo` : '/catalogo';
  const publishedProducts = products.filter((product) => product.active);
  const heroProduct = publishedProducts.find((product) => product.imageUrl);
  const fallbackHero: Extract<TenantHomeContent['sections'][number], { type: 'hero' }> = {
    id: 'hero-fallback',
    type: 'hero',
    enabled: true,
    title: tenant?.name ?? '',
    description: tenant?.description ?? 'Explorá los productos publicados por esta tienda.',
    imageUrl: heroProduct?.imageUrl ?? null,
    ctaLabel: 'Ver catálogo',
  };
  const sections = publishedHome?.content.sections ?? [fallbackHero];

  if (tenantLoading || isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white">
        <p className="text-sm text-gray-500">Cargando tienda...</p>
      </div>
    );
  }

  if (tenantError || !tenant) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white px-4">
        <div className="max-w-md text-center">
          <h1 className="text-xl font-semibold text-gray-950">Tienda no encontrada</h1>
          <p className="mt-2 text-sm text-gray-600">La tienda solicitada no existe o no está activa.</p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen bg-white text-gray-950"
      style={{ '--primary-color': tenant.primaryColor || '#111827' } as React.CSSProperties}
    >
      <Header />

      <main>
        <TenantHomeSections
          sections={sections}
          tenantName={tenant.name}
          tenantSlug={tenantSlug}
          whatsappNumber={tenant.whatsappNumber}
          products={publishedProducts}
        />

        <div className="mx-auto max-w-7xl px-4 pt-5 text-sm text-gray-500 sm:px-6 lg:px-8">
          {publishedProducts.length} productos publicados
        </div>

        {!sections.some((section) => section.type === 'featuredProducts' && section.enabled) && <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
          <div className="flex items-end justify-between gap-4 border-b border-gray-200 pb-4">
            <div>
              <p className="text-xs font-semibold uppercase text-gray-500">Explorá la tienda</p>
              <h2 className="mt-2 text-2xl font-semibold text-gray-950">Productos del catálogo</h2>
            </div>
            <Link
              to={catalogPath}
              className="hidden items-center gap-2 text-sm font-semibold text-gray-700 hover:text-gray-950 sm:inline-flex"
            >
              Ver todos
              <ArrowRight size={16} aria-hidden="true" />
            </Link>
          </div>

          {error ? (
            <p className="py-12 text-sm text-red-700" role="alert">
              No se pudieron cargar los productos. Podés volver a intentarlo desde el catálogo.
            </p>
          ) : publishedProducts.length > 0 ? (
            <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {publishedProducts.slice(0, 3).map((product) => (
                <TenantProductCard key={product.id} product={product} tenantSlug={tenantSlug} />
              ))}
            </div>
          ) : (
            <div className="py-12 text-sm text-gray-600">
              Todavía no hay productos publicados. Consultá el catálogo más adelante.
            </div>
          )}

          <Link
            to={catalogPath}
            className="mt-6 inline-flex min-h-11 items-center gap-2 border border-gray-300 px-4 py-2.5 text-sm font-semibold text-gray-800 transition hover:border-gray-950 hover:text-gray-950 sm:hidden"
          >
            Ir al catálogo
            <ArrowRight size={16} aria-hidden="true" />
          </Link>
        </section>}
      </main>

      <footer className="border-t border-gray-200 bg-slate-50">
        <div className="mx-auto flex max-w-7xl flex-col gap-2 px-4 py-6 text-sm text-gray-600 sm:px-6 lg:px-8">
          <span className="font-semibold text-gray-900">{tenant.name}</span>
          {tenant.whatsappNumber && <span>WhatsApp: {tenant.whatsappNumber}</span>}
        </div>
      </footer>
    </div>
  );
}

export default function TenantHome() {
  const { tenantSlug } = useParams();

  return (
    <TenantProvider slug={tenantSlug}>
      <TenantHomeContent />
    </TenantProvider>
  );
}