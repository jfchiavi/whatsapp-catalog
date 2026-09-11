import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { prisma } from '../src/lib/prisma';
import {
  getOrCreateCart,
  addToCart,
  updateCartItem,
  removeCartItem,
  setCartBranch,
  submitCart,
} from '../src/modules/cart/cart.service';
import { AppError } from '../src/lib/errors';

const TEST_TENANT_ID = '0b95f160-f948-5ac3-921a-56029e130fa9';
const BRANCH_CENTRAL = '1075ea0b-a199-5f89-ad10-bcb83627b8a6';
const VARIANT_REM_S = 'a9fbfe58-6361-557b-90c0-7dadf311090d';
const TEST_SESSION_ID = 'test-session-123';

describe('Cart service', () => {
  let cartId: string;

  afterAll(async () => {
    await prisma.order.deleteMany({ where: { tenantId: TEST_TENANT_ID, customerName: 'Test Customer' } });
    await prisma.cart.deleteMany({ where: { tenantId: TEST_TENANT_ID, sessionId: TEST_SESSION_ID } });
    await prisma.$disconnect();
  });

  it('creates or gets a cart', async () => {
    const cart = await getOrCreateCart(TEST_TENANT_ID, TEST_SESSION_ID);
    expect(cart).toBeDefined();
    expect(cart.tenantId).toBe(TEST_TENANT_ID);
    expect(cart.sessionId).toBe(TEST_SESSION_ID);
    expect(cart.status).toBe('active');
    cartId = cart.id;
  });

  it('returns same cart on second call', async () => {
    const cart2 = await getOrCreateCart(TEST_TENANT_ID, TEST_SESSION_ID);
    expect(cart2.id).toBe(cartId);
  });

  it('adds item to cart', async () => {
    const item = await addToCart(TEST_TENANT_ID, cartId, VARIANT_REM_S, 2);
    expect(item).toBeDefined();
    expect(item.quantity).toBe(2);
    expect(item.variantId).toBe(VARIANT_REM_S);
  });

  it('increments quantity for existing item', async () => {
    const item = await addToCart(TEST_TENANT_ID, cartId, VARIANT_REM_S, 3);
    expect(item.quantity).toBe(5);
  });

  it('updates cart item quantity', async () => {
    const cart = await getOrCreateCart(TEST_TENANT_ID, TEST_SESSION_ID);
    const itemId = cart.items[0].id;
    const updated = await updateCartItem(TEST_TENANT_ID, cartId, itemId, 1);
    expect(updated.quantity).toBe(1);
  });

  it('sets cart branch', async () => {
    const cart = await setCartBranch(TEST_TENANT_ID, cartId, BRANCH_CENTRAL);
    expect(cart.branchId).toBe(BRANCH_CENTRAL);
    expect(cart.branch).toBeDefined();
  });

  it('submits cart as order', async () => {
    const order = await submitCart(
      TEST_TENANT_ID,
      cartId,
      'Test Customer',
      '+5491112345678',
      'Test notes'
    );

    expect(order).toBeDefined();
    expect(order.customerName).toBe('Test Customer');
    expect(order.customerPhone).toBe('+5491112345678');
    expect(order.status).toBe('pending');
    expect(order.whatsappMessage).toContain('Test Customer');
    expect(order.whatsappMessage).toContain('Total:');
    expect(order.whatsappUrl).toContain('wa.me/');
    expect(order.items.length).toBeGreaterThan(0);
  });

  it('rejects submit on empty cart', async () => {
    const emptyCart = await getOrCreateCart(TEST_TENANT_ID, 'empty-session');
    await expect(
      submitCart(TEST_TENANT_ID, emptyCart.id, 'Test', '+5491112345678')
    ).rejects.toThrow(AppError);
  });
});
