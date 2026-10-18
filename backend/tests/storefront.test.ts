import { afterAll, describe, expect, it } from 'vitest';
import { NextRequest } from 'next/server';
import { prisma } from '../src/lib/prisma';
import { hasPermission } from '../src/lib/permissions';
import { generateAccessToken } from '../src/lib/auth';
import { GET as getAdminDraft, PUT as putAdminDraft } from '../src/app/api/storefront/admin/route';
import { POST as postPublish } from '../src/app/api/storefront/admin/publish/route';
import { GET as getPublicHome } from '../src/app/api/storefront/[slug]/route';
import { normalizeTenantHomeContent, tenantHomeV2Schema } from '../src/validators/tenant.schema';
import {
  getOrCreateTenantHomePage,
  getTenantHomePublicationHistory,
  getPublishedTenantHome,
  publishTenantHomeDraft,
  restoreTenantHomePublicationToDraft,
  saveTenantHomeDraft,
  type TenantHomeContent,
} from '../src/modules/storefront/storefront.service';

describe('Storefront service', () => {
  const suffix = Date.now().toString();
  const tenantAId = `test-storefront-a-${suffix}`;
  const tenantBId = `test-storefront-b-${suffix}`;
  const slugA = `test-storefront-a-${suffix}`;
  const slugB = `test-storefront-b-${suffix}`;
  const routeTenantAId = `test-storefront-route-a-${suffix}`;
  const routeTenantBId = `test-storefront-route-b-${suffix}`;
  const routeSlugA = `test-storefront-route-a-${suffix}`;
  const routeSlugB = `test-storefront-route-b-${suffix}`;

  const content = (title: string): TenantHomeContent => ({
    version: 2,
    industry: 'electronics',
    sections: [{
      id: 'hero-main',
      type: 'hero',
      enabled: true,
      title,
      description: `Description for ${title}`,
      imageUrl: null,
      ctaLabel: 'Ver catálogo',
    }],
  });

  const heroTitle = (value: TenantHomeContent) =>
    value.sections.find((section) => section.type === 'hero')?.title;

  it('grants storefront management only to tenant admins and platform admins', () => {
    expect(hasPermission('ADMIN', 'storefront')).toBe(true);
    expect(hasPermission('SUPER_ADMIN', 'storefront')).toBe(false);
    expect(hasPermission('BRANCH_MANAGER', 'storefront')).toBe(false);
    expect(hasPermission('SELLER', 'storefront')).toBe(false);
  });

  it('normalizes existing version 1 hero content to version 2 sections', () => {
    const normalized = normalizeTenantHomeContent({
      version: 1,
      industry: 'construction',
      hero: {
        title: 'Legacy home',
        description: 'Existing published content',
        imageUrl: null,
        ctaLabel: 'Ver catálogo',
      },
    });

    expect(normalized.version).toBe(2);
    expect(heroTitle(normalized)).toBe('Legacy home');
  });

  it('requires promotion end to be after its start', () => {
    const parsed = tenantHomeV2Schema.safeParse({
      version: 2,
      industry: 'home',
      sections: [{
        id: 'promotion-one',
        type: 'promotion',
        enabled: true,
        title: 'Sale',
        description: 'Limited promotion',
        imageUrl: null,
        ctaLabel: 'Shop',
        startsAt: '2026-10-20T00:00:00.000Z',
        endsAt: '2026-10-19T00:00:00.000Z',
      }],
    });
    expect(parsed.success).toBe(false);
  });

  afterAll(async () => {
    await prisma.product.deleteMany({
      where: { tenantId: { in: [tenantAId, tenantBId, routeTenantAId, routeTenantBId] } },
    });
    await prisma.tenant.deleteMany({
      where: { id: { in: [tenantAId, tenantBId, routeTenantAId, routeTenantBId] } },
    });
    await prisma.$disconnect();
  });

  it('keeps draft private until publish and publishes only its tenant content', async () => {
    await prisma.tenant.createMany({
      data: [
        { id: tenantAId, name: 'Storefront A', slug: slugA },
        { id: tenantBId, name: 'Storefront B', slug: slugB },
      ],
    });

    const foreignProduct = await prisma.product.create({
      data: {
        tenantId: tenantBId,
        name: 'Tenant B product',
        baseAttributes: { material: 'Wood' },
      },
    });

    const initial = await getOrCreateTenantHomePage(tenantAId);
    expect(heroTitle(initial.draftContent)).toBe('Storefront A');
    expect(await getPublishedTenantHome(slugA)).toBeNull();

    await saveTenantHomeDraft(tenantAId, content('Published hero'));
    expect(await getPublishedTenantHome(slugA)).toBeNull();

    const firstPublication = await publishTenantHomeDraft(tenantAId);
    expect(firstPublication.revision).toBe(1);
    expect(heroTitle((await getPublishedTenantHome(slugA))!.content)).toBe('Published hero');
    expect(await getPublishedTenantHome(slugB)).toBeNull();

    await expect(saveTenantHomeDraft(tenantAId, {
      version: 2,
      industry: 'electronics',
      sections: [{ id: 'featured', type: 'featuredProducts', enabled: true, title: 'Featured', productIds: [foreignProduct.id] }],
    })).rejects.toThrow('active products from this tenant');

    await expect(saveTenantHomeDraft(tenantAId, {
      version: 2,
      industry: 'electronics',
      sections: [{ id: 'categories', type: 'categories', enabled: true, title: 'Browse', items: [{ label: 'Stone', attributeKey: 'material', attributeValue: 'Stone' }] }],
    })).rejects.toThrow('existing product attributes from this tenant');

    await saveTenantHomeDraft(tenantAId, content('Unpublished revision'));
    expect(heroTitle((await getPublishedTenantHome(slugA))!.content)).toBe('Published hero');

    const history = await getTenantHomePublicationHistory(tenantAId);
    expect(history).toHaveLength(1);
    expect(history[0].revision).toBe(1);
    const restored = await restoreTenantHomePublicationToDraft(tenantAId, 1);
    expect(heroTitle(restored.draftContent)).toBe('Published hero');
    expect(heroTitle((await getPublishedTenantHome(slugA))!.content)).toBe('Published hero');
  });

  it('derives the tenant from the authenticated token, ignoring tenant IDs in requests', async () => {
    process.env.JWT_ACCESS_SECRET = 'storefront-test-secret';
    await prisma.tenant.createMany({
      data: [
        { id: routeTenantAId, name: 'Route Store A', slug: routeSlugA },
        { id: routeTenantBId, name: 'Route Store B', slug: routeSlugB },
      ],
    });
    const token = generateAccessToken({ userId: 'admin-a', role: 'ADMIN', tenantId: routeTenantAId });
    const headers = { authorization: `Bearer ${token}`, 'content-type': 'application/json' };

    const getResponse = await getAdminDraft(new NextRequest('http://localhost/api/storefront/admin', { headers }));
    expect(getResponse.status).toBe(200);
    const getBody = await getResponse.json();
    expect(getBody.data.tenant.id).toBe(routeTenantAId);

    const putResponse = await putAdminDraft(new NextRequest('http://localhost/api/storefront/admin', {
      method: 'PUT',
      headers,
      body: JSON.stringify({ content: content('Tenant A draft'), tenantId: routeTenantBId }),
    }));
    expect(putResponse.status).toBe(400);

    const validPutResponse = await putAdminDraft(new NextRequest('http://localhost/api/storefront/admin', {
      method: 'PUT',
      headers,
      body: JSON.stringify({ content: content('Tenant A draft') }),
    }));
    expect(validPutResponse.status).toBe(200);

    const publishResponse = await postPublish(new NextRequest('http://localhost/api/storefront/admin/publish', {
      method: 'POST',
      headers,
    }));
    expect(publishResponse.status).toBe(200);

    const tenantBPublic = await getPublicHome(new NextRequest(`http://localhost/api/storefront/${routeSlugB}`), {
      params: Promise.resolve({ slug: routeSlugB }),
    });
    expect((await tenantBPublic.json()).data).toBeNull();
  });
});
