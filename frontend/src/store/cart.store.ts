import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Product } from "../types";

export interface CartItem {
  id: string;
  product: Product;
  quantity: number;
}

export interface CartStore {
  items: CartItem[];
  add: (product: Product, qty: number) => void;
  remove: (id: string) => void;
  update: (id: string, qty: number) => void;
  totalItems: () => number;
  subtotal: () => number;
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      add: (product, qty) =>
        set({
          items: [...get().items, { id: crypto.randomUUID(), product, quantity: qty }],
        }),
      remove: (id) =>
        set({ items: get().items.filter(i => i.id !== id) }),
      update: (id, qty) =>
        set({
          items: get().items.map(i =>
            i.id === id ? { ...i, quantity: qty } : i
          ),
        }),
      totalItems: () =>
        get().items.reduce((a, i) => a + i.quantity, 0),
      subtotal: () =>
        get().items.reduce((a, i) => a + i.product.price * i.quantity, 0),
    }),
    { name: "cart-storage" }
  )
);
