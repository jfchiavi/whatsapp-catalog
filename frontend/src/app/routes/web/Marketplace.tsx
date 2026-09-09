import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getMarketplaceProducts, type MarketplaceProduct } from '@/services/marketplace.api';

export default function Marketplace() {
  const [searchQuery, setSearchQuery] = useState('');

  const { data, isLoading, error } = useQuery({
    queryKey: ['marketplace-products', searchQuery],
    queryFn: () => getMarketplaceProducts({ q: searchQuery || undefined }),
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <h1 className="text-3xl font-bold text-gray-900">Marketplace</h1>
          <p className="mt-2 text-gray-600">Encuentra productos de múltiples tiendas</p>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <input
            type="text"
            placeholder="Buscar productos..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full md:w-96 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {isLoading && <p className="text-center">Cargando productos...</p>}
        {error && <p className="text-center text-red-600">Error al cargar productos</p>}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {data?.products?.map((product) => (
            <MarketplaceProductCard key={product.id} product={product} />
          ))}
        </div>

        {data?.products?.length === 0 && (
          <p className="text-center text-gray-500">No se encontraron productos</p>
        )}
      </main>
    </div>
  );
}

function MarketplaceProductCard({ product }: { product: MarketplaceProduct }) {
  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
      <Link to={`/t/${product.tenant.slug}/product/${product.id}`}>
        <img
          src={product.imageUrl || "https://picsum.photos/400/300"}
          alt={product.name}
          className="w-full h-48 object-cover"
        />
      </Link>
      <div className="p-4">
        <div className="flex items-center gap-2 mb-2">
          {product.tenant.logoUrl ? (
            <img
              src={product.tenant.logoUrl}
              alt={product.tenant.name}
              className="w-6 h-6 rounded-full"
            />
          ) : (
            <div
              className="w-6 h-6 rounded-full"
              style={{ backgroundColor: product.tenant.primaryColor }}
            />
          )}
          <Link
            to={`/t/${product.tenant.slug}`}
            className="text-sm text-gray-600 hover:text-gray-900"
          >
            {product.tenant.name}
          </Link>
        </div>
        <Link to={`/t/${product.tenant.slug}/product/${product.id}`}>
          <h3 className="font-semibold text-gray-900 hover:text-blue-600">
            {product.name}
          </h3>
        </Link>
        {product.variants?.length > 0 && (
          <p className="mt-2 text-lg font-bold text-gray-900">
            ${product.variants[0].price.toFixed(2)}
          </p>
        )}
        {product.variants?.length > 1 && (
          <p className="text-sm text-gray-500">
            {product.variants.length} opciones disponibles
          </p>
        )}
      </div>
    </div>
  );
}
