import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Product, Variant } from "../types/product";

export interface CartItem {
  id: string;
  product: Product;
  variant: Variant;
  quantity: number;
}

export interface CartStore {
  items: CartItem[];
  add: (product: Product, variant: Variant, qty: number) => void;
  remove: (id: string) => void;
  update: (id: string, qty: number) => void;
  totalItems: () => number;
  subtotal: () => number;
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      add: (product, variant, qty) =>
        set({
          items: [
            ...get().items,
            { id: crypto.randomUUID(), product, variant, quantity: qty },
          ],
        }),
      remove: (id) =>
        set({ items: get().items.filter((i) => i.id !== id) }),
      update: (id, qty) =>
        set({
          items: get().items.map((i) =>
            i.id === id ? { ...i, quantity: qty } : i
          ),
        }),
      totalItems: () =>
        get().items.reduce((a, i) => a + i.quantity, 0),
      subtotal: () =>
        get().items.reduce((a, i) => a + i.variant.price * i.quantity, 0),
    }),
    { name: "cart-storage" }
  )
);
