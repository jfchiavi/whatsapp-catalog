import React, { useState } from 'react';
import { ChevronDown, ChevronUp, SlidersHorizontal, X } from 'lucide-react';
import type { AttributeFacet } from '@/hooks/useTenantFilters';

interface TenantFilterSidebarProps {
  facets: AttributeFacet[];
  selectedAttributes: Record<string, string[]>;
  onToggleAttribute: (key: string, value: string) => void;
  onlyOffers: boolean;
  onToggleOffers: (value: boolean) => void;
  totalOffersCount: number;
  priceBounds: { min: number; max: number };
  priceRange: { min?: number; max?: number };
  onPriceChange: (range: { min?: number; max?: number }) => void;
  onClearAll: () => void;
  hasActiveFilters: boolean;
  isMobileOpen?: boolean;
  onCloseMobile?: () => void;
}

export const TenantFilterSidebar: React.FC<TenantFilterSidebarProps> = ({
  facets,
  selectedAttributes,
  onToggleAttribute,
  onlyOffers,
  onToggleOffers,
  totalOffersCount,
  priceBounds,
  priceRange,
  onPriceChange,
  onClearAll,
  hasActiveFilters,
  isMobileOpen = false,
  onCloseMobile,
}) => {
  // Manejo de secciones colapsables (por defecto abiertas)
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({});

  const toggleSection = (sectionKey: string) => {
    setCollapsedSections((prev) => ({
      ...prev,
      [sectionKey]: !prev[sectionKey],
    }));
  };

  const content = (
    <div className="space-y-6">
      {/* Header del sidebar */}
      <div className="flex items-center justify-between pb-3 border-b border-gray-200">
        <div className="flex items-center gap-2 font-bold text-gray-900 text-base">
          <SlidersHorizontal size={18} className="text-gray-600" />
          <span>Filtros</span>
        </div>
        {hasActiveFilters && (
          <button
            onClick={onClearAll}
            className="text-xs font-semibold text-blue-600 hover:text-blue-800 transition hover:underline"
          >
            Limpiar Todo
          </button>
        )}
      </div>

      {/* Filtro: Solo ofertas */}
      {totalOffersCount > 0 && (
        <div className="pb-4 border-b border-gray-100">
          <label className="flex items-center justify-between cursor-pointer group py-1">
            <div className="flex items-center gap-2.5">
              <input
                type="checkbox"
                checked={onlyOffers}
                onChange={(e) => onToggleOffers(e.target.checked)}
                className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary/30 transition cursor-pointer"
              />
              <span className="text-sm font-medium text-gray-800 group-hover:text-primary transition">
                Solo ofertas
              </span>
            </div>
            <span className="text-xs text-gray-400 font-medium">
              {totalOffersCount}
            </span>
          </label>
        </div>
      )}

      {/* Filtro: Rango de Precio */}
      {priceBounds.max > priceBounds.min && (
        <div className="pb-4 border-b border-gray-100">
          <button
            onClick={() => toggleSection('price')}
            className="w-full flex items-center justify-between text-left text-sm font-bold text-gray-800 py-1"
          >
            <span>Rango de Precio ($)</span>
            {collapsedSections['price'] ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
          </button>

          {!collapsedSections['price'] && (
            <div className="mt-3 space-y-2">
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  placeholder={`Mín ($${priceBounds.min})`}
                  value={priceRange.min ?? ''}
                  onChange={(e) =>
                    onPriceChange({
                      ...priceRange,
                      min: e.target.value ? Number(e.target.value) : undefined,
                    })
                  }
                  className="w-full text-xs px-2.5 py-1.5 border border-gray-300 rounded focus:border-primary focus:outline-none"
                />
                <span className="text-gray-400 text-xs">-</span>
                <input
                  type="number"
                  placeholder={`Máx ($${priceBounds.max})`}
                  value={priceRange.max ?? ''}
                  onChange={(e) =>
                    onPriceChange({
                      ...priceRange,
                      max: e.target.value ? Number(e.target.value) : undefined,
                    })
                  }
                  className="w-full text-xs px-2.5 py-1.5 border border-gray-300 rounded focus:border-primary focus:outline-none"
                />
              </div>
            </div>
          )}
        </div>
      )}

      {/* Facetas dinámicas basadas en baseAttributes */}
      {facets.map((facet) => {
        const isCollapsed = collapsedSections[facet.key];
        const selectedForThisFacet = selectedAttributes[facet.key] || [];

        return (
          <div key={facet.key} className="pb-4 border-b border-gray-100 last:border-none">
            <button
              onClick={() => toggleSection(facet.key)}
              className="w-full flex items-center justify-between text-left text-sm font-bold text-gray-800 py-1"
            >
              <span>{facet.label}</span>
              {isCollapsed ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
            </button>

            {!isCollapsed && (
              <div className="mt-2.5 space-y-1.5 max-h-56 overflow-y-auto pr-1">
                {facet.values.map(({ value, count }) => {
                  const isChecked = selectedForThisFacet.includes(value);

                  return (
                    <label
                      key={value}
                      className="flex items-center justify-between cursor-pointer group py-1 text-sm select-none"
                    >
                      <div className="flex items-center gap-2.5 pr-2">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => onToggleAttribute(facet.key, value)}
                          className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary/30 transition cursor-pointer"
                        />
                        <span
                          className={`text-sm transition line-clamp-1 ${
                            isChecked
                              ? 'font-semibold text-gray-900'
                              : 'text-gray-600 group-hover:text-gray-900'
                          }`}
                        >
                          {value}
                        </span>
                      </div>
                      <span className="text-xs text-gray-400 font-medium shrink-0">
                        {count}
                      </span>
                    </label>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );

  return (
    <>
      {/* Versión Desktop: Columna fija lateral */}
      <aside className="hidden lg:block w-64 shrink-0 pr-6">
        <div className="sticky top-20 bg-white p-5 rounded-xl border border-gray-200/80 shadow-xs">
          {content}
        </div>
      </aside>

      {/* Versión Móvil: Drawer / Modal desplegable */}
      {isMobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-xs transition-opacity"
            onClick={onCloseMobile}
          />
          <div className="relative ml-auto w-full max-w-xs bg-white h-full shadow-2xl p-6 overflow-y-auto z-10 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-4 mb-4 border-b">
                <span className="font-bold text-lg text-gray-900">Filtros</span>
                <button
                  onClick={onCloseMobile}
                  className="p-1 rounded-md text-gray-500 hover:text-gray-800"
                >
                  <X size={20} />
                </button>
              </div>
              {content}
            </div>

            <div className="pt-6 mt-6 border-t">
              <button
                onClick={onCloseMobile}
                className="w-full py-2.5 bg-gray-900 text-white rounded-lg font-medium text-sm hover:bg-black transition"
              >
                Ver resultados
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
