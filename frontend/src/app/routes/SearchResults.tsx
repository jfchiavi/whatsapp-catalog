import { useSearchParams } from "react-router-dom";
import { PRODUCTS } from "../../data/products";
import { Header } from "../../components/header/Header";
import { ProductCard } from "../../components/product/ProductCard";

export default function SearchResults() {
  const [params] = useSearchParams();
  const q = params.get("q")?.toLowerCase() || "";

  const results = PRODUCTS.filter(p =>
    `${p.name} ${p.description} ${p.category}`
      .toLowerCase()
      .includes(q)
  );

  return (
    <>
      <Header />

      <main className="max-w-7xl mx-auto p-4">
        <h1 className="font-semibold mb-4">
          Resultados para “{q}”
        </h1>

        {results.length === 0 && (
          <p className="text-gray-500">
            No se encontraron productos
          </p>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {results.map(p => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      </main>
    </>
  );
}
