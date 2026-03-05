import { useMemo, useState } from "react";
import { PRODUCTS } from "@/data/products";
import { ProductCard } from "@/components/product/ProductCard";
import { Header } from "@/components/header/Header";
import { CategoryFilter } from "@/components/product/CategoryFilter"; // ajusta ruta si aplica

export default function Home() {
  // 1) Categorías únicas (no hardcodeadas)
  const categories = useMemo(() => {
    return Array.from(new Set(PRODUCTS.map(p => p.category)));
  }, []);

  // 2) Estado: categorías seleccionadas
  const [selected, setSelected] = useState<Set<string>>(new Set());

  // 3) Toggle: agregar / quitar del set (sin mutar el set original)
  const onToggle = (category: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(category)) next.delete(category);
      else next.add(category);
      return next;
    });
  };

  // 4) Productos filtrados
  const filteredProducts = useMemo(() => {
    if (selected.size === 0) return PRODUCTS;
    return PRODUCTS.filter(p => selected.has(p.category));
  }, [selected]);

  return (
    <>
      <Header />

      <main className="max-w-7xl mx-auto p-4">
        <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-8">
          {/* Filtro izquierda */}
          <aside className="lg:sticky lg:top-24 self-start">
            <CategoryFilter
              categories={categories}
              selected={selected}
              onToggle={onToggle}
            />

            {/* (Opcional) Resumen de seleccionados como en tu imagen */}
            {selected.size > 0 && (
              <div className="mt-8 border-t pt-4 text-sm text-gray-600">
                <p className="text-xs font-semibold uppercase text-gray-500">
                  Seleccionados:
                </p>
                <p className="italic">{Array.from(selected).join(", ")}</p>
              </div>
            )}
          </aside>

          {/* Productos derecha */}
          <section>
            {filteredProducts.length === 0 ? (
              <p className="text-gray-500">No se encontraron productos</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredProducts.map(p => (
          <ProductCard key={p.id} product={p} />
        ))}
              </div>
            )}
          </section>
        </div>
      </main>
    </>
  );
}
