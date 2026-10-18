import { useParams, Link } from 'react-router-dom';
import { useState } from 'react';
import { TenantProvider } from '@/app/providers/TenantProvider';
import { useTenant } from '@/hooks/useTenant';
import { useCatalogProduct } from '@/hooks/useCatalog';
import { Header } from '@/components/header/Header';
import { ProductGallery } from '@/components/product/ProductGallery';
import { QuantitySelector } from '@/components/product/QuantitySelector';
import { ProductActions } from '@/components/product/ProductActions';

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
  codigo: 'Código de producto',
  item_code: 'Código de ítem',
};

function TenantProductDetailContent() {
  const { id } = useParams();
  const { tenant, loading: tenantLoading } = useTenant();
  const { data: product, isLoading, error } = useCatalogProduct(id || '');
  const [qty, setQty] = useState(1);
  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(null);

  if (tenantLoading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-gray-200 border-t-gray-800 rounded-full animate-spin" />
          <p className="text-gray-500 text-sm">Cargando producto...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="p-6 bg-red-50 text-red-700 rounded-xl border border-red-200 text-center max-w-md">
          <p className="font-semibold mb-1">Error al cargar el producto</p>
          <p className="text-sm text-red-600">No se pudo obtener la información en este momento.</p>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="p-6 bg-white border border-gray-200 rounded-xl text-center max-w-md">
          <p className="font-semibold text-gray-800 mb-1">Producto no encontrado</p>
          <p className="text-sm text-gray-500 mb-4">El producto solicitado no existe o fue despublicado.</p>
          <Link
            to={`/t/${tenant?.slug}`}
            className="inline-block px-4 py-2 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-black transition"
          >
            Volver al catálogo
          </Link>
        </div>
      </div>
    );
  }

  const selectedVariant =
    product.variants.find((v) => v.id === selectedVariantId) ||
    product.variants[0];

  const base = product.baseAttributes || {};
  const isOpportunity = Boolean(base.isOpportunity);
  const isFeatured = Boolean(base.isFeatured);
  const isOffer = Boolean(base.isOffer);

  // Filtrar atributos para la ficha técnica
  const technicalAttributes = Object.entries(base).filter(([key, val]) => {
    const lowerKey = key.toLowerCase();
    if (['isoffer', 'isfeatured', 'isopportunity', 'badge', 'originalprice'].includes(lowerKey)) {
      return false;
    }
    return val !== undefined && val !== null && val !== '';
  });

  return (
    <div className="min-h-screen bg-gray-50/30" style={{ '--primary-color': tenant?.primaryColor } as React.CSSProperties}>
      <Header />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumb de navegación */}
        <nav className="mb-6">
          <Link
            to={`/t/${tenant?.slug}`}
            className="text-sm font-medium text-gray-500 hover:text-gray-900 transition flex items-center gap-1.5"
          >
            ← Volver a {tenant?.name}
          </Link>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-14">
          {/* Galería de imágenes */}
          <div>
            <ProductGallery
              images={[product.imageUrl || "https://picsum.photos/600/450"]}
            />
          </div>

          {/* Información y Compra */}
          <div className="space-y-6">
            {/* Badges superiores */}
            <div className="flex flex-wrap gap-2">
              {isOpportunity && (
                <span className="bg-amber-500 text-white text-xs font-bold tracking-wider uppercase px-2.5 py-0.5 rounded-sm shadow-xs">
                  Oportunidad Tendencia
                </span>
              )}
              {isFeatured && (
                <span className="bg-emerald-600 text-white text-xs font-bold tracking-wider uppercase px-2.5 py-0.5 rounded-sm shadow-xs">
                  Destacado
                </span>
              )}
              {isOffer && !isOpportunity && (
                <span className="bg-rose-500 text-white text-xs font-bold tracking-wider uppercase px-2.5 py-0.5 rounded-sm shadow-xs">
                  Oferta
                </span>
              )}
            </div>

            <div>
              <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">
                {product.name}
              </h1>
              {Boolean(base.material) && (
                <p className="mt-1 text-sm font-medium text-gray-500">
                  {String(base.material)}
                  {base.medida ? ` · ${String(base.medida)}` : ''}
                </p>
              )}
            </div>

            {/* Precio */}
            {selectedVariant && (
              <div className="py-2">
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-black text-gray-900">
                    ${selectedVariant.price.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                  <span className="text-sm text-gray-500 font-medium">/m² con IVA incluido</span>
                </div>
                <p className="text-xs text-gray-400 mt-0.5">
                  Retiro en local o depósito central
                </p>
              </div>
            )}

            {/* Variantes */}
            {product.variants.length > 1 && (
              <div className="space-y-2.5 pt-2 border-t border-gray-100">
                <span className="font-semibold text-sm text-gray-900">Variante:</span>
                <div className="flex flex-wrap gap-2">
                  {product.variants.map((variant) => (
                    <button
                      key={variant.id}
                      onClick={() => setSelectedVariantId(variant.id)}
                      className={`px-3 py-1.5 border rounded-lg text-sm font-medium transition cursor-pointer ${
                        selectedVariant?.id === variant.id
                          ? "border-gray-900 bg-gray-900 text-white shadow-xs"
                          : "border-gray-300 text-gray-700 bg-white hover:border-gray-400"
                      }`}
                    >
                      {variant.sku}
                      {Object.entries(variant.attributes).length > 0 && (
                        <span className="ml-1 text-xs opacity-75">
                          ({Object.values(variant.attributes).join(", ")})
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Acciones de compra */}
            {selectedVariant && (
              <div className="space-y-4 pt-2 border-t border-gray-100">
                <div className="flex items-center gap-4">
                  <span className="font-semibold text-sm text-gray-900">Cantidad:</span>
                  <QuantitySelector value={qty} onChange={setQty} />
                </div>

                <ProductActions
                  product={product}
                  variant={selectedVariant}
                  quantity={qty}
                />
              </div>
            )}

            {/* Ficha Técnica / Especificaciones basadas en baseAttributes */}
            {technicalAttributes.length > 0 && (
              <div className="pt-6 border-t border-gray-200">
                <h2 className="text-base font-bold text-gray-900 mb-3">
                  Ficha Técnica y Especificaciones
                </h2>
                <div className="border border-gray-200 rounded-xl overflow-hidden bg-white shadow-2xs divide-y divide-gray-100">
                  {technicalAttributes.map(([key, val]) => (
                    <div
                      key={key}
                      className="flex items-center justify-between px-4 py-2.5 text-sm"
                    >
                      <span className="font-medium text-gray-500">
                        {ATTRIBUTE_LABELS[key.toLowerCase()] ||
                          key.charAt(0).toUpperCase() + key.slice(1)}
                      </span>
                      <span className="font-semibold text-gray-900 text-right">
                        {String(val)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

export default function TenantProductDetail() {
  const { tenantSlug } = useParams();

  return (
    <TenantProvider slug={tenantSlug}>
      <TenantProductDetailContent />
    </TenantProvider>
  );
}
