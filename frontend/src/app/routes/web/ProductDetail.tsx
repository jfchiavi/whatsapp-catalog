import { useParams, Link } from "react-router-dom";
import { Header } from "../../../components/header/Header";
import { ProductGallery } from "../../../components/product/ProductGallery";
import { QuantitySelector } from "../../../components/product/QuantitySelector";
import { ProductActions } from "../../../components/product/ProductActions";
import { useState } from "react";
import { useCatalogProduct } from "@/hooks/useCatalog";

export default function ProductDetail() {
  const { id } = useParams();
  const { data: product, isLoading, error } = useCatalogProduct(id || "");
  const [qty, setQty] = useState(1);
  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(null);

  if (isLoading) return <p className="p-4">Cargando producto...</p>;
  if (error) return <p className="p-4 text-red-600">Error al cargar producto</p>;
  if (!product) return <p className="p-4">Producto no encontrado</p>;

  const selectedVariant =
    product.variants.find((v) => v.id === selectedVariantId) ||
    product.variants[0];

  return (
    <>
      <Header />

      <main className="max-w-7xl mx-auto p-4 grid grid-cols-1 md:grid-cols-2 gap-8">
        <ProductGallery
          images={[product.imageUrl || "https://picsum.photos/400/300"]}
        />

        <div className="space-y-4">
          <Link to="/" className="text-sm text-blue-600">
            ← Volver
          </Link>

          <h1 className="text-2xl font-bold">{product.name}</h1>

          {selectedVariant && (
            <p className="text-xl font-semibold">
              ${selectedVariant.price.toFixed(2)}
            </p>
          )}

          {product.variants.length > 1 && (
            <div className="space-y-2">
              <span className="font-medium text-sm">Variante:</span>
              <div className="flex flex-wrap gap-2">
                {product.variants.map((variant) => (
                  <button
                    key={variant.id}
                    onClick={() => setSelectedVariantId(variant.id)}
                    className={`px-3 py-1 border rounded text-sm ${
                      selectedVariant?.id === variant.id
                        ? "border-black bg-black text-white"
                        : "border-gray-300 hover:border-gray-500"
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

          {selectedVariant && (
            <>
              <div className="space-y-2">
                <span className="font-medium">Cantidad</span>
                <QuantitySelector value={qty} onChange={setQty} />
              </div>

              <ProductActions
                product={product}
                variant={selectedVariant}
                quantity={qty}
              />
            </>
          )}
        </div>
      </main>
    </>
  );
}
