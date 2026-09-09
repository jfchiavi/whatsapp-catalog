import { useCatalogProducts } from "@/hooks/useCatalog";
import { ProductCard } from "@/components/product/ProductCard";
import { Header } from "@/components/header/Header";

export default function Home() {
  const { data: products, isLoading, error } = useCatalogProducts();

  return (
    <>
      <Header />
      <main className="max-w-7xl mx-auto p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLoading && <p className="col-span-full text-center">Cargando productos...</p>}
        {error && <p className="col-span-full text-center text-red-600">Error al cargar productos</p>}
        {products?.map((p) => (
          <ProductCard key={p.id} product={p} />
        ))}
        {products?.length === 0 && (
          <p className="col-span-full text-center text-gray-500">No hay productos disponibles</p>
        )}
      </main>
    </>
  );
}
