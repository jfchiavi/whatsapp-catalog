import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { prisma } from '../src/lib/prisma';
import {
  createVariant,
  getVariantsByProduct,
  getVariantById,
  updateVariant,
  deleteVariant,
} from '../src/modules/variants/variant.service';
import { getCatalogProducts, getCatalogProductById } from '../src/modules/catalog/catalog.service';
import { AppError } from '../src/lib/errors';

// Seed UUIDs from seed-docker.sql
const TEST_TENANT_ID = '0b95f160-f948-5ac3-921a-56029e130fa9';
const TEST_PRODUCT_ID = '0aa15edc-d718-5385-9e43-75b42902d59e';

describe('Variant service', () => {
  let createdVariantId: string;

  afterAll(async () => {
    await prisma.variant.deleteMany({ where: { tenantId: TEST_TENANT_ID, sku: { startsWith: 'TEST-VAR' } } });
    await prisma.$disconnect();
  });

  it('creates a variant with valid data', async () => {
    const variant = await createVariant({
      productId: TEST_PRODUCT_ID,
      sku: 'TEST-VAR-001',
      price: 99.99,
      cost: 50.0,
      attributes: { color: 'rojo', size: 'M' },
      tenantId: TEST_TENANT_ID,
    });

    expect(variant).toBeDefined();
    expect(variant.sku).toBe('TEST-VAR-001');
    expect(variant.price).toBe(99.99);
    expect(variant.tenantId).toBe(TEST_TENANT_ID);
    createdVariantId = variant.id;
  });

  it('rejects duplicate SKU within same tenant', async () => {
    await expect(
      createVariant({
        productId: TEST_PRODUCT_ID,
        sku: 'TEST-VAR-001',
        price: 50,
        cost: 25,
        tenantId: TEST_TENANT_ID,
      })
    ).rejects.toThrow(AppError);
  });

  it('allows same SKU in different tenant', async () => {
    const variant = await createVariant({
      productId: TEST_PRODUCT_ID,
      sku: 'TEST-VAR-001',
      price: 75,
      cost: 30,
      tenantId: 'other-tenant',
    });

    expect(variant.sku).toBe('TEST-VAR-001');
    expect(variant.tenantId).toBe('other-tenant');

    await prisma.variant.delete({ where: { id: variant.id } });
  });

  it('lists variants by product filtered by tenant', async () => {
    const variants = await getVariantsByProduct(TEST_PRODUCT_ID, TEST_TENANT_ID);
    expect(Array.isArray(variants)).toBe(true);
    expect(variants.some((v) => v.id === createdVariantId)).toBe(true);
  });

  it('gets variant by id with tenant filter', async () => {
    const variant = await getVariantById(createdVariantId, TEST_TENANT_ID);
    expect(variant).toBeDefined();
    expect(variant?.id).toBe(createdVariantId);
  });

  it('returns null for variant in different tenant', async () => {
    const variant = await getVariantById(createdVariantId, 'other-tenant');
    expect(variant).toBeNull();
  });

  it('updates variant data', async () => {
    const updated = await updateVariant(createdVariantId, TEST_TENANT_ID, {
      price: 129.99,
      attributes: { color: 'azul' },
    });

    expect(updated.price).toBe(129.99);
    expect(updated.attributes).toEqual({ color: 'azul' });
  });

  it('rejects duplicate SKU on update', async () => {
    await expect(
      updateVariant(createdVariantId, TEST_TENANT_ID, { sku: 'TEST-VAR-001' })
    ).resolves.not.toThrow();

    const otherVariant = await createVariant({
      productId: TEST_PRODUCT_ID,
      sku: 'TEST-VAR-002',
      price: 40,
      cost: 20,
      tenantId: TEST_TENANT_ID,
    });

    await expect(
      updateVariant(otherVariant.id, TEST_TENANT_ID, { sku: 'TEST-VAR-001' })
    ).rejects.toThrow(AppError);

    await prisma.variant.delete({ where: { id: otherVariant.id } });
  });

  it('deletes variant', async () => {
    await expect(
      deleteVariant(createdVariantId, TEST_TENANT_ID)
    ).resolves.not.toThrow();

    const variant = await getVariantById(createdVariantId, TEST_TENANT_ID);
    expect(variant).toBeNull();
  });
});

describe('Catalog service (public, no auth)', () => {
  it('lists active products for a tenant', async () => {
    const products = await getCatalogProducts(TEST_TENANT_ID);
    expect(Array.isArray(products)).toBe(true);
    products.forEach((p) => {
      expect(p.active).toBe(true);
      expect(p.tenantId).toBe(TEST_TENANT_ID);
    });
  });

  it('excludes inactive products from catalog', async () => {
    const inactiveProduct = await prisma.product.create({
      data: {
        name: 'Inactive Test Product',
        active: false,
        tenantId: TEST_TENANT_ID,
      },
    });

    const products = await getCatalogProducts(TEST_TENANT_ID);
    expect(products.some((p) => p.id === inactiveProduct.id)).toBe(false);

    await prisma.product.delete({ where: { id: inactiveProduct.id } });
  });

  it('throws for non-existent tenant', async () => {
    await expect(getCatalogProducts('non-existent-tenant')).rejects.toThrow(AppError);
  });

  it('gets single active product by id', async () => {
    const products = await getCatalogProducts(TEST_TENANT_ID);
    if (products.length > 0) {
      const product = await getCatalogProductById(products[0].id, TEST_TENANT_ID);
      expect(product).toBeDefined();
      expect(product.id).toBe(products[0].id);
    }
  });

  it('returns null for inactive product in catalog', async () => {
    const inactiveProduct = await prisma.product.create({
      data: {
        name: 'Inactive Detail Product',
        active: false,
        tenantId: TEST_TENANT_ID,
      },
    });

    await expect(
      getCatalogProductById(inactiveProduct.id, TEST_TENANT_ID)
    ).rejects.toThrow(AppError);

    await prisma.product.delete({ where: { id: inactiveProduct.id } });
  });

  it('does not leak products from other tenants', async () => {
    const otherTenantProducts = await getCatalogProducts('other-tenant');
    const thisTenantProducts = await getCatalogProducts(TEST_TENANT_ID);

    const otherIds = new Set(otherTenantProducts.map((p) => p.id));
    const leaking = thisTenantProducts.filter((p) => otherIds.has(p.id));
    expect(leaking).toHaveLength(0);
  });
});
