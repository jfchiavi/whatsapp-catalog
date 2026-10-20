import { Link, NavLink, useParams } from 'react-router-dom';
import { useTenant } from '@/hooks/useTenant';
import { SearchBar } from './SearchBar';
import { CartButton } from './CartButton';
import { recordStorefrontMetric } from '@/services/storefront.api';

export const Header = () => {
  const { tenantSlug } = useParams();
  const { tenant } = useTenant();
  const isTenantStore = Boolean(tenant);
  const storePath = tenantSlug ? `/t/${tenantSlug}` : '';

  return (
    <header className="sticky top-0 z-50 border-b border-gray-200 bg-white">
      <div className="mx-auto flex max-w-7xl items-center gap-5 px-4 py-3 sm:px-6 lg:px-8">
        <Link
          to={isTenantStore ? (storePath || '/') : '/'}
          className="flex min-w-0 items-center gap-3 font-semibold text-gray-950"
          aria-label={tenant?.name ?? 'Inicio'}
        >
          {tenant?.logoUrl ? (
            <img src={tenant.logoUrl} alt="" className="h-9 w-9 rounded object-contain" />
          ) : null}
          <span className="truncate">{tenant?.name ?? 'Mi Tienda'}</span>
        </Link>

        {isTenantStore ? (
          <nav aria-label="Navegación de la tienda" className="flex items-center gap-1">
            <NavLink
              to={storePath}
              end
              className={({ isActive }) =>
                `rounded px-3 py-2 text-sm font-medium transition-colors ${isActive ? 'text-gray-950' : 'text-gray-500 hover:text-gray-900'}`
              }
            >
              Inicio
            </NavLink>
            <NavLink
              to={storePath ? `${storePath}/catalogo` : '/catalogo'}
              onClick={() => tenant?.slug && void recordStorefrontMetric(tenant.slug, 'CATALOG_CLICK')}
              className={({ isActive }) =>
                `rounded px-3 py-2 text-sm font-medium transition-colors ${isActive ? 'text-gray-950' : 'text-gray-500 hover:text-gray-900'}`
              }
            >
              Catálogo
            </NavLink>
          </nav>
        ) : (
          <SearchBar />
        )}

        <div className="ml-auto">
          <CartButton />
        </div>
      </div>
    </header>
  );
};
