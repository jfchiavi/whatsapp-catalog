import { useQueryClient } from '@tanstack/react-query';
import { useCart, useAddToCart, useUpdateCartItem, useRemoveCartItem, useSetCartBranch, useSubmitCart } from "../hooks/useCart";
import { useAuthStore } from "./auth.store";
import { useTenant } from "@/hooks/useTenant";
import { createCart } from "@/services/cart.api";
import type { CartItemData } from "../services/cart.api";

const getOrCreateSessionId = (tenantId: string): string => {
  const key = `cart-session-${tenantId}`;
  let sessionId = localStorage.getItem(key);
  if (!sessionId) {
    sessionId = crypto.randomUUID();
    localStorage.setItem(key, sessionId);
  }
  return sessionId;
};

export interface CartItem {
  id: string;
  variantId: string;
  productId: string;
  productName: string;
  productImageUrl?: string;
  variantSku: string;
  variantPrice: number;
  variantAttributes: Record<string, string>;
  quantity: number;
  unitPriceSnapshot: number;
}

export const useCartStore = () => {
  const user = useAuthStore((s) => s.user);
  // La tienda pública no requiere login: el tenant viene del contexto del
  // catálogo (TenantProvider). En el dashboard (sin provider) se usa el del JWT.
  const { tenant: publicTenant } = useTenant();
  const tenantId = publicTenant?.id || user?.tenantId || null;
  const sessionId = tenantId ? getOrCreateSessionId(tenantId) : null;

  const { data: serverCart, isLoading } = useCart(tenantId, sessionId);
  const addToCartMutation = useAddToCart();
  const updateCartItemMutation = useUpdateCartItem();
  const removeCartItemMutation = useRemoveCartItem();
  const setCartBranchMutation = useSetCartBranch();
  const submitCartMutation = useSubmitCart();
  const queryClient = useQueryClient();

  const cartId = serverCart?.id || null;
  const branchId = serverCart?.branchId || null;
  const branch = serverCart?.branch || null;

  const items: CartItem[] = (serverCart?.items || []).map((item: CartItemData) => ({
    id: item.id,
    variantId: item.variantId,
    productId: item.variant.product.id,
    productName: item.variant.product.name,
    productImageUrl: item.variant.product.imageUrl,
    variantSku: item.variant.sku,
    variantPrice: item.variant.price,
    variantAttributes: item.variant.attributes,
    quantity: item.quantity,
    unitPriceSnapshot: item.unitPriceSnapshot,
  }));

  const totalItems = () => items.reduce((a, i) => a + i.quantity, 0);
  const subtotal = () => items.reduce((a, i) => a + i.unitPriceSnapshot * i.quantity, 0);

  // Si el carrito aún no existe (primera carga o query fallida), se crea bajo
  // demanda en vez de ignorar silenciosamente el click del visitante.
  const ensureCart = async (): Promise<{ id: string } | null> => {
    if (cartId) return { id: cartId };
    if (!tenantId || !sessionId) return null;

    const cart = await createCart(tenantId, sessionId);
    localStorage.setItem(`cart-id-${tenantId}`, cart.id);
    queryClient.invalidateQueries({ queryKey: ['cart', tenantId, sessionId] });
    return cart;
  };

  const add = (variantId: string, quantity: number) => {
    if (!tenantId) return;
    void (async () => {
      const cart = await ensureCart();
      if (!cart) return;
      addToCartMutation.mutate({ cartId: cart.id, tenantId, variantId, quantity });
    })();
  };

  const update = (itemId: string, quantity: number) => {
    if (!cartId || !tenantId) return;
    updateCartItemMutation.mutate({ cartId, tenantId, itemId, quantity });
  };

  const remove = (itemId: string) => {
    if (!cartId || !tenantId) return;
    removeCartItemMutation.mutate({ cartId, tenantId, itemId });
  };

  const setBranch = (branchId: string) => {
    if (!cartId || !tenantId) return;
    setCartBranchMutation.mutate({ cartId, tenantId, branchId });
  };

  const submitOrder = (customerName: string, customerPhone: string, customerNotes?: string) => {
    if (!cartId || !tenantId) return;
    return submitCartMutation.mutateAsync({ tenantId, cartId, customerName, customerPhone, customerNotes });
  };

  return {
    tenantId,
    cartId,
    branchId,
    branch,
    items,
    isLoading,
    totalItems,
    subtotal,
    pricing: serverCart?.pricing ?? null,
    add,
    update,
    remove,
    setBranch,
    submitOrder,
    isSubmitting: submitCartMutation.isPending,
  };
};
