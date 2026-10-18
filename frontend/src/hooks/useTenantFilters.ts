import { useMemo, useState } from 'react';
import type { Product } from '@/types/product';

export interface AttributeFacet {
  key: string;
  label: string;
  values: { value: string; count: number }[];
}

export type SortOption = 'relevance' | 'price-asc' | 'price-desc';

const IGNORED_ATTRIBUTE_KEYS = new Set([
  'codigo',
  'item_code',
  'item',
  'lote',
  'batch',
  'sku',
  'id',
  'originalprice',
  'isoffer',
  'isfeatured',
  'isopportunity',
]);

const ATTRIBUTE_LABELS: Record<string, string> = {
  material: 'Material',
  medida: 'Medida / Formato',
  espesor: 'Espesor',
  sistema: 'Sistema de instalación',
  acabado: 'Acabado',
  color: 'Color',
  tipo: 'Tipo',
  diseno: 'Diseño',
  diseño: 'Diseño',
  cobertura_caja: 'Rendimiento por caja',
  piezas_caja: 'Piezas por caja',
};

function getProductPrice(product: Product): number {
  if (!product.variants || product.variants.length === 0) return 0;
  return Math.min(...product.variants.map((v) => v.price));
}

function isProductOffer(product: Product): boolean {
  const base = product.baseAttributes || {};
  if (base.isOffer === true || base.isOpportunity === true) return true;
  const originalPrice = Number(base.originalPrice);
  const currentPrice = getProductPrice(product);
  if (originalPrice && currentPrice && originalPrice > currentPrice) return true;
  return false;
}

export function useTenantFilters(products: Product[] = []) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAttributes, setSelectedAttributes] = useState<Record<string, string[]>>({});
  const [onlyOffers, setOnlyOffers] = useState(false);
  const [priceRange, setPriceRange] = useState<{ min?: number; max?: number }>({});
  const [sortOption, setSortOption] = useState<SortOption>('relevance');

  // Rango global de precios disponible en los productos
  const priceBounds = useMemo(() => {
    if (!products.length) return { min: 0, max: 0 };
    const prices = products.map(getProductPrice).filter((p) => p > 0);
    if (!prices.length) return { min: 0, max: 0 };
    return {
      min: Math.floor(Math.min(...prices)),
      max: Math.ceil(Math.max(...prices)),
    };
  }, [products]);

  // Extraer facetas dinámicas a partir de baseAttributes
  const availableFacets = useMemo<AttributeFacet[]>(() => {
    const keyMap = new Map<string, Map<string, number>>();

    products.forEach((product) => {
      const base = product.baseAttributes || {};
      Object.entries(base).forEach(([rawKey, rawVal]) => {
        const lowerKey = rawKey.toLowerCase();
        if (IGNORED_ATTRIBUTE_KEYS.has(lowerKey)) return;
        if (typeof rawVal !== 'string' && typeof rawVal !== 'number') return;

        const valStr = String(rawVal).trim();
        if (!valStr) return;

        if (!keyMap.has(rawKey)) {
          keyMap.set(rawKey, new Map<string, number>());
        }
        const valCountMap = keyMap.get(rawKey)!;
        valCountMap.set(valStr, (valCountMap.get(valStr) || 0) + 1);
      });
    });

    const facets: AttributeFacet[] = [];

    keyMap.forEach((valCountMap, key) => {
      // Si la clave tiene al menos un valor significativo
      if (valCountMap.size > 0) {
        const values = Array.from(valCountMap.entries()).map(([value, count]) => ({
          value,
          count,
        }));
        // Ordenar valores alfabéticamente
        values.sort((a, b) => a.value.localeCompare(b.value));

        facets.push({
          key,
          label: ATTRIBUTE_LABELS[key.toLowerCase()] || key.charAt(0).toUpperCase() + key.slice(1),
          values,
        });
      }
    });

    // Ordenar facetas para que 'material' y 'medida' aparezcan primero
    facets.sort((a, b) => {
      const order = ['material', 'medida', 'espesor', 'sistema'];
      const aIdx = order.indexOf(a.key.toLowerCase());
      const bIdx = order.indexOf(b.key.toLowerCase());
      if (aIdx !== -1 && bIdx !== -1) return aIdx - bIdx;
      if (aIdx !== -1) return -1;
      if (bIdx !== -1) return 1;
      return a.label.localeCompare(b.label);
    });

    return facets;
  }, [products]);

  // Conteo total de ofertas
  const totalOffersCount = useMemo(() => {
    return products.filter(isProductOffer).length;
  }, [products]);

  // Filtrado y ordenamiento de productos
  const filteredProducts = useMemo(() => {
    return products
      .filter((product) => {
        // 1. Búsqueda por texto (nombre y baseAttributes)
        if (searchTerm.trim()) {
          const query = searchTerm.toLowerCase();
          const matchName = product.name.toLowerCase().includes(query);
          const baseText = JSON.stringify(product.baseAttributes || {}).toLowerCase();
          const matchAttr = baseText.includes(query);
          if (!matchName && !matchAttr) return false;
        }

        // 2. Solo ofertas
        if (onlyOffers && !isProductOffer(product)) {
          return false;
        }

        // 3. Rango de precio
        const price = getProductPrice(product);
        if (priceRange.min !== undefined && price < priceRange.min) {
          return false;
        }
        if (priceRange.max !== undefined && price > priceRange.max) {
          return false;
        }

        // 4. Atributos seleccionados
        for (const [attrKey, selectedVals] of Object.entries(selectedAttributes)) {
          if (!selectedVals || selectedVals.length === 0) continue;
          const productVal = String(product.baseAttributes?.[attrKey] ?? '').trim();
          if (!selectedVals.includes(productVal)) {
            return false;
          }
        }

        return true;
      })
      .sort((a, b) => {
        const priceA = getProductPrice(a);
        const priceB = getProductPrice(b);

        if (sortOption === 'price-asc') {
          return priceA - priceB;
        }
        if (sortOption === 'price-desc') {
          return priceB - priceA;
        }
        // Por defecto 'relevance': orden original o alfabético
        return 0;
      });
  }, [products, searchTerm, onlyOffers, priceRange, selectedAttributes, sortOption]);

  const toggleAttributeValue = (key: string, value: string) => {
    setSelectedAttributes((prev) => {
      const currentList = prev[key] || [];
      const exists = currentList.includes(value);
      const updatedList = exists
        ? currentList.filter((v) => v !== value)
        : [...currentList, value];

      if (updatedList.length === 0) {
        const next = { ...prev };
        delete next[key];
        return next;
      }
      return { ...prev, [key]: updatedList };
    });
  };

  const clearAllFilters = () => {
    setSearchTerm('');
    setSelectedAttributes({});
    setOnlyOffers(false);
    setPriceRange({});
    setSortOption('relevance');
  };

  const hasActiveFilters = Boolean(
    searchTerm.trim() ||
      onlyOffers ||
      priceRange.min !== undefined ||
      priceRange.max !== undefined ||
      Object.keys(selectedAttributes).length > 0 ||
      sortOption !== 'relevance'
  );

  return {
    filteredProducts,
    totalCount: products.length,
    filteredCount: filteredProducts.length,
    availableFacets,
    priceBounds,
    totalOffersCount,
    // Estados actuales
    searchTerm,
    selectedAttributes,
    onlyOffers,
    priceRange,
    sortOption,
    hasActiveFilters,
    // Modificadores
    setSearchTerm,
    setOnlyOffers,
    setPriceRange,
    setSortOption,
    toggleAttributeValue,
    clearAllFilters,
  };
}
