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
  tenantId: string | null;
  items: CartItem[];
  setTenant: (tenantId: string) => void;
  add: (product: Product, variant: Variant, qty: number) => void;
  remove: (id: string) => void;
  update: (id: string, qty: number) => void;
  clearCart: () => void;
  totalItems: () => number;
  subtotal: () => number;
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      tenantId: null,
      items: [],
      setTenant: (tenantId) => {
        if (get().tenantId !== tenantId) {
          // Clear cart when switching tenants
          set({ tenantId, items: [] });
        }
      },
      add: (product, variant, qty) => {
        const existing = get().items.find(
          (i) => i.product.id === product.id && i.variant.id === variant.id
        );

        if (existing) {
          // Increment quantity for existing item
          set({
            items: get().items.map((i) =>
              i.id === existing.id ? { ...i, quantity: i.quantity + qty } : i
            ),
          });
        } else {
          // Add new item
          set({
            items: [
              ...get().items,
              { id: crypto.randomUUID(), product, variant, quantity: qty },
            ],
          });
        }
      },
      remove: (id) =>
        set({ items: get().items.filter((i) => i.id !== id) }),
      update: (id, qty) =>
        set({
          items: get().items.map((i) =>
            i.id === id ? { ...i, quantity: qty } : i
          ),
        }),
      clearCart: () => set({ items: [] }),
      totalItems: () =>
        get().items.reduce((a, i) => a + i.quantity, 0),
      subtotal: () =>
        get().items.reduce((a, i) => a + i.variant.price * i.quantity, 0),
    }),
    { name: "cart-storage" }
  )
);
