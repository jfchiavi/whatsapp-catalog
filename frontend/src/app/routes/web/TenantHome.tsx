import { Link, useParams } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { TenantProvider } from '@/app/providers/TenantProvider';
import { Header } from '@/components/header/Header';
import { TenantProductCard } from '@/components/tenant/TenantProductCard';
import { useCatalogProducts } from '@/hooks/useCatalog';
import { useTenant } from '@/hooks/useTenant';

export function TenantHomeContent() {
  const { tenantSlug } = useParams();
  const { tenant, loading: tenantLoading, error: tenantError } = useTenant();
  const { data: products = [], isLoading, error } = useCatalogProducts();
  const catalogPath = tenantSlug ? `/t/${tenantSlug}/catalogo` : '/catalogo';
  const publishedProducts = products.filter((product) => product.active);
  const heroProduct = publishedProducts.find((product) => product.imageUrl);

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
        <section className="border-b border-gray-200 bg-slate-50">
          <div className="mx-auto grid max-w-7xl items-center gap-8 px-4 py-10 sm:px-6 sm:py-14 lg:grid-cols-[1fr_0.9fr] lg:px-8 lg:py-16">
            <div className="max-w-xl">
              <p className="text-xs font-semibold uppercase text-gray-500">Tienda oficial</p>
              <h1 className="mt-3 text-4xl font-semibold leading-tight text-gray-950 sm:text-5xl">
                {tenant.name}
              </h1>
              <p className="mt-4 max-w-lg text-base leading-7 text-gray-600">
                {tenant.description || 'Explorá los productos publicados por esta tienda.'}
              </p>
              <div className="mt-7 flex flex-wrap items-center gap-4">
                <Link
                  to={catalogPath}
                  className="inline-flex min-h-12 items-center gap-3 bg-gray-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-gray-800"
                >
                  Ver catálogo
                  <ArrowRight size={17} aria-hidden="true" />
                </Link>
                <span className="text-sm text-gray-500">
                  {publishedProducts.length} productos publicados
                </span>
              </div>
            </div>

            <div className="relative min-h-64 overflow-hidden bg-gray-200 sm:min-h-80 lg:min-h-96">
              {heroProduct?.imageUrl ? (
                <img
                  src={heroProduct.imageUrl}
                  alt={heroProduct.name}
                  className="absolute inset-0 h-full w-full object-cover"
                />
              ) : (
                <div className="absolute inset-0 bg-[linear-gradient(135deg,#e5e7eb_0%,#f8fafc_48%,#d1d5db_100%)]" />
              )}
              {heroProduct && (
                <div className="absolute inset-x-0 bottom-0 bg-linear-to-t from-black/70 to-transparent px-5 pb-5 pt-16 text-white">
                  <p className="text-xs font-medium text-white/75">En el catálogo</p>
                  <p className="mt-1 text-lg font-semibold">{heroProduct.name}</p>
                </div>
              )}
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
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
        </section>
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