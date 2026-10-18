import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { Search, SlidersHorizontal, ArrowUpDown } from 'lucide-react';
import { TenantProvider } from '@/app/providers/TenantProvider';
import { useTenant } from '@/hooks/useTenant';
import { useCatalogProducts } from '@/hooks/useCatalog';
import { useTenantFilters } from '@/hooks/useTenantFilters';
import type { SortOption } from '@/hooks/useTenantFilters';
import { TenantProductCard } from '@/components/tenant/TenantProductCard';
import { TenantFilterSidebar } from '@/components/tenant/TenantFilterSidebar';
import { Header } from '@/components/header/Header';

function TenantCatalogContent() {
  const { tenantSlug } = useParams();
  const { tenant, loading: tenantLoading, error: tenantError } = useTenant();
  const { data: rawProducts, isLoading, error } = useCatalogProducts();
  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false);

  // Hook de filtros y ordenamiento
  const {
    filteredProducts,
    totalCount,
    filteredCount,
    availableFacets,
    priceBounds,
    totalOffersCount,
    searchTerm,
    selectedAttributes,
    onlyOffers,
    priceRange,
    sortOption,
    hasActiveFilters,
    setSearchTerm,
    setOnlyOffers,
    setPriceRange,
    setSortOption,
    toggleAttributeValue,
    clearAllFilters,
  } = useTenantFilters(rawProducts || []);

  if (tenantLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-gray-200 border-t-gray-800 rounded-full animate-spin" />
          <p className="text-gray-500 text-sm">Cargando tienda...</p>
        </div>
      </div>
    );
  }

  if (tenantError || !tenant) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center p-8 bg-white rounded-xl border border-gray-200 max-w-md">
          <p className="text-red-600 font-semibold mb-2">Tienda no encontrada</p>
          <p className="text-gray-500 text-sm">El catálogo solicitado no existe o no se encuentra activo.</p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen bg-gray-50/50 flex flex-col"
      style={{ '--primary-color': tenant.primaryColor || '#000000' } as React.CSSProperties}
    >
      <Header />

      <main className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 flex-1">
        {/* Header del Catálogo */}
        <header className="mb-6 pb-6 border-b border-gray-200">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Catálogo</h1>
              <p className="mt-1 text-sm text-gray-500">
                <span className="font-semibold text-gray-800">{totalCount} diseños</span> en stock
                {' · '}Precios con IVA incluido{' · '}Retirás en el local o depósito
              </p>
            </div>

            {/* Selector de ordenamiento en desktop */}
            <div className="flex items-center gap-2 self-start md:self-auto">
              <label htmlFor="sort-select" className="text-xs text-gray-500 font-medium hidden sm:inline">
                Ordenar por:
              </label>
              <div className="relative">
                <select
                  id="sort-select"
                  value={sortOption}
                  onChange={(e) => setSortOption(e.target.value as SortOption)}
                  className="appearance-none bg-white border border-gray-300 text-gray-700 text-sm font-medium py-2 pl-3 pr-8 rounded-lg shadow-2xs hover:border-gray-400 focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
                >
                  <option value="relevance">Importancia</option>
                  <option value="price-asc">Precio: Menor a Mayor</option>
                  <option value="price-desc">Precio: Mayor a Menor</option>
                </select>
                <ArrowUpDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              </div>
            </div>
          </div>

          {/* Barra de Búsqueda y Botón Filtros Móvil */}
          <div className="mt-5 flex items-center gap-3">
            <div className="relative flex-1">
              <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar por nombre, material, medida o código..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-white pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary shadow-2xs transition"
              />
            </div>

            {/* Botón trigger para versión móvil de filtros */}
            <button
              onClick={() => setIsMobileFiltersOpen(true)}
              className="lg:hidden flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 shadow-2xs shrink-0"
            >
              <SlidersHorizontal size={16} />
              <span>Filtros</span>
              {hasActiveFilters && (
                <span className="w-2 h-2 rounded-full bg-blue-600" />
              )}
            </button>
          </div>
        </header>

        {/* Layout Principal: 2 Columnas (Sidebar + Grilla) */}
        <div className="flex items-start">
          {/* Sidebar de Filtros Dinámicos */}
          <TenantFilterSidebar
            facets={availableFacets}
            selectedAttributes={selectedAttributes}
            onToggleAttribute={toggleAttributeValue}
            onlyOffers={onlyOffers}
            onToggleOffers={setOnlyOffers}
            totalOffersCount={totalOffersCount}
            priceBounds={priceBounds}
            priceRange={priceRange}
            onPriceChange={setPriceRange}
            onClearAll={clearAllFilters}
            hasActiveFilters={hasActiveFilters}
            isMobileOpen={isMobileFiltersOpen}
            onCloseMobile={() => setIsMobileFiltersOpen(false)}
          />

          {/* Grilla de Productos */}
          <div className="flex-1 min-w-0">
            {/* Aviso legal discreto y contador de resultados */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-4 text-xs text-gray-500">
              <p>
                Mostrando <span className="font-semibold text-gray-800">{filteredCount}</span> de {totalCount} productos
              </p>
              <p className="italic text-[11px] text-gray-400">
                Precios válidos sobre stock disponible. Disponibilidad sujeta a existencia.
              </p>
            </div>

            {isLoading && (
              <div className="py-20 text-center">
                <div className="w-8 h-8 border-4 border-gray-200 border-t-gray-800 rounded-full animate-spin mx-auto mb-2" />
                <p className="text-gray-500 text-sm">Cargando catálogo...</p>
              </div>
            )}

            {error && (
              <div className="py-12 text-center text-red-600 bg-red-50 rounded-xl border border-red-200">
                <p className="font-medium">Error al cargar productos</p>
                <p className="text-xs mt-1">Por favor, intenta nuevamente más tarde.</p>
              </div>
            )}

            {!isLoading && !error && filteredProducts.length === 0 && (
              <div className="py-16 text-center bg-white rounded-xl border border-gray-200/80 p-8 shadow-xs">
                <p className="text-gray-800 font-semibold text-base mb-1">No se encontraron productos</p>
                <p className="text-gray-500 text-sm mb-4">
                  Intenta modificar o limpiar los filtros seleccionados para ver más opciones.
                </p>
                {hasActiveFilters && (
                  <button
                    onClick={clearAllFilters}
                    className="px-4 py-2 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-black transition shadow-xs"
                  >
                    Limpiar todos los filtros
                  </button>
                )}
              </div>
            )}

            {!isLoading && !error && filteredProducts.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredProducts.map((p) => (
                  <TenantProductCard key={p.id} product={p} tenantSlug={tenantSlug} />
                ))}
              </div>
            )}
          </div>
        </div>
      </main>

      <footer className="mt-12 py-6 border-t border-gray-200 bg-white text-center text-gray-500 text-sm">
        <p className="font-medium text-gray-700">{tenant.name}</p>
        {tenant.description && <p className="text-xs text-gray-400 mt-1">{tenant.description}</p>}
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
