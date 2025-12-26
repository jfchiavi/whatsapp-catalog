import type { Product } from "../types";

export const PRODUCTS: Product[] = Array.from({ length: 20 }, (_, i) => ({
  id: i + 1,
  name: `Producto ${i + 1}`,
  description: "Descripción completa del producto.",
  category: ["Electrónicos", "Ropa", "Hogar"][i % 3],
  price: 10000 + i * 500,
  image: "https://placehold.co/400x300",
  inStock: i % 4 !== 0,
}));
