import React from 'react';
import { Link } from 'react-router-dom';
import { ShoppingCart } from 'lucide-react';
import type { Product } from '@/types/product';
import { useCartStore } from '@/store/cart.store';

interface TenantProductCardProps {
  product: Product;
  tenantSlug?: string;
}

export const TenantProductCard: React.FC<TenantProductCardProps> = ({
  product,
  tenantSlug,
}) => {
  const { add } = useCartStore();
  const defaultVariant = product.variants?.[0];
  const price = defaultVariant?.price ?? 0;

  // Atributos base
  const base = product.baseAttributes || {};

  // Badges
  const isOpportunity = Boolean(base.isOpportunity);
  const isFeatured = Boolean(base.isFeatured);
  const isOffer = Boolean(base.isOffer);
  const customBadge = typeof base.badge === 'string' ? base.badge : null;

  // Precios tachados / de lista
  const originalPrice = base.originalPrice ? Number(base.originalPrice) : null;
  const hasDiscount = originalPrice && originalPrice > price;

  // Subtítulo técnico (material · medida o formato)
  const subtitleParts: string[] = [];
  if (base.material) subtitleParts.push(String(base.material));
  if (base.medida) subtitleParts.push(String(base.medida));
  else if (base.espesor) subtitleParts.push(String(base.espesor));
  const technicalSubtitle = subtitleParts.join(' · ');

  // URL del detalle
  const detailUrl = tenantSlug
    ? `/t/${tenantSlug}/product/${product.id}`
    : `/product/${product.id}`;

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!defaultVariant) return;
    add(defaultVariant.id, 1);
  };

  return (
    <div className="group flex flex-col bg-white rounded-xl border border-gray-200/90 overflow-hidden shadow-2xs hover:shadow-md transition-all duration-200">
      {/* Contenedor de Imagen y Badges */}
      <Link to={detailUrl} className="relative block aspect-4/3 w-full overflow-hidden bg-gray-50">
        <img
          src={product.imageUrl || 'https://picsum.photos/400/300?blur=2'}
          alt={product.name}
          className="h-full w-full object-cover object-center group-hover:scale-105 transition-transform duration-300"
          loading="lazy"
        />

        {/* Badges superpuestos en la esquina superior izquierda */}
        <div className="absolute top-2.5 left-2.5 flex flex-col gap-1 items-start z-10">
          {isOpportunity && (
            <span className="bg-amber-500 text-white text-[10px] font-bold tracking-wider uppercase px-2 py-0.5 rounded-sm shadow-xs">
              Oportunidad Tendencia
            </span>
          )}
          {isFeatured && (
            <span className="bg-emerald-600 text-white text-[10px] font-bold tracking-wider uppercase px-2 py-0.5 rounded-sm shadow-xs">
              Destacado
            </span>
          )}
          {isOffer && !isOpportunity && (
            <span className="bg-rose-500 text-white text-[10px] font-bold tracking-wider uppercase px-2 py-0.5 rounded-sm shadow-xs">
              Oferta
            </span>
          )}
          {customBadge && (
            <span className="bg-gray-900 text-white text-[10px] font-bold tracking-wider uppercase px-2 py-0.5 rounded-sm shadow-xs">
              {customBadge}
            </span>
          )}
        </div>
      </Link>

      {/* Contenido / Información */}
      <div className="flex flex-col flex-1 p-4 justify-between">
        <div>
          {/* Título del producto */}
          <Link to={detailUrl} className="block group-hover:text-primary transition-colors">
            <h3 className="font-semibold text-gray-900 text-base leading-snug line-clamp-2">
              {product.name}
            </h3>
          </Link>

          {/* Subtítulo técnico */}
          {technicalSubtitle && (
            <p className="mt-1 text-xs text-gray-500 line-clamp-1 font-medium">
              {technicalSubtitle}
            </p>
          )}
        </div>

        {/* Sección de Precio y Botón de Compra */}
        <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between gap-2">
          <div>
            <div className="flex items-baseline gap-1.5 flex-wrap">
              <span className="text-lg font-bold text-gray-900">
                ${price.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
              <span className="text-xs text-gray-500 font-normal">/m²</span>

              {hasDiscount && (
                <span className="text-xs text-gray-400 line-through ml-1">
                  ${originalPrice.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              )}
            </div>
            {product.variants.length > 1 && (
              <span className="text-[11px] text-gray-400 block mt-0.5">
                {product.variants.length} variantes
              </span>
            )}
          </div>

          <button
            onClick={handleAddToCart}
            disabled={!defaultVariant}
            aria-label="Agregar al carrito"
            title="Agregar al carrito"
            className="flex items-center justify-center p-2.5 rounded-lg bg-gray-900 text-white hover:bg-primary transition-colors disabled:opacity-40 disabled:cursor-not-allowed shadow-2xs"
          >
            <ShoppingCart size={16} />
          </button>
        </div>
      </div>
    </div>
  );
};
