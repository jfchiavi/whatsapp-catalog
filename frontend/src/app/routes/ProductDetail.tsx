import { useParams, Link } from "react-router-dom";
import { PRODUCTS } from "../../data/products";
import { Header } from "../../components/header/Header";
import { ProductGallery } from "../../components/product/ProductGallery";
import { QuantitySelector } from "../../components/product/QuantitySelector";
import { ProductActions } from "../../components/product/ProductActions";
import { useState } from "react";

export default function ProductDetail() {
  const { id } = useParams();
  const product = PRODUCTS.find(p => p.id === Number(id));
  const [qty, setQty] = useState(1);

  if (!product) {
    return <p className="p-4">Producto no encontrado</p>;
  }

  return (
    <>
      <Header />

      <main className="max-w-7xl mx-auto p-4 grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Galería */}
        <ProductGallery images={[product.image, product.image]} />

        {/* Info */}
        <div className="space-y-4">
          <Link to="/" className="text-sm text-blue-600">
            ← Volver
          </Link>

          <h1 className="text-2xl font-bold">{product.name}</h1>

          <p className="text-xl font-semibold">
            ${product.price.toLocaleString()}
          </p>

          <p className="text-gray-600">
            {product.description}
          </p>

          <div className="space-y-2">
            <span className="font-medium">Cantidad</span>
            <QuantitySelector value={qty} onChange={setQty} />
          </div>

          <ProductActions product={product} quantity={qty} />
        </div>
      </main>
    </>
  );
}
