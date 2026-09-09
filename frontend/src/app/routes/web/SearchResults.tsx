import { useSearchParams } from "react-router-dom";
import { useCatalogProducts } from "@/hooks/useCatalog";
import { Header } from "../../../components/header/Header";
import { ProductCard } from "../../../components/product/ProductCard";

export default function SearchResults() {
  const [params] = useSearchParams();
  const q = params.get("q")?.toLowerCase() || "";
  const { data: products, isLoading } = useCatalogProducts();

  const results =
    products?.filter((p) =>
      `${p.name} ${p.batch || ""}`
        .toLowerCase()
        .includes(q)
    ) || [];

  return (
    <>
      <Header />

      <main className="max-w-7xl mx-auto p-4">
        <h1 className="font-semibold mb-4">
          Resultados para "{q}"
        </h1>

        {isLoading && <p>Cargando...</p>}

        {results.length === 0 && !isLoading && (
          <p className="text-gray-500">No se encontraron productos</p>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {results.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      </main>
    </>
  );
}
