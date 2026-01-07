import { PRODUCTS } from "@/data/products";
import { ProductCard } from "@/components/product/ProductCard";
import { Header } from "@/components/header/Header";

export default function Home() {
  return (
    <>
      <Header />
      <main className="max-w-7xl mx-auto p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {PRODUCTS.map(p => (
          <ProductCard key={p.id} product={p} />
        ))}
      </main>
    </>
  );
}
