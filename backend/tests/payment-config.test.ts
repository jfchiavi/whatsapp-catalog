import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { NextRequest } from 'next/server';
import { prisma } from '../src/lib/prisma';
import { AppError } from '../src/lib/errors';
import { decryptSecret, encryptSecret, maskSecret } from '../src/lib/crypto';
import { generateAccessToken } from '../src/lib/auth';
import {
  getBillingConfigs,
  getPaymentConfigs,
  saveBillingConfig,
  savePaymentConfig,
} from '../src/modules/payments/payment-config.service';
import {
  GET as getPaymentRoute,
  PUT as putPaymentRoute,
} from '../src/app/api/tenants/payment-config/route';
import {
  GET as getBillingRoute,
  PUT as putBillingRoute,
} from '../src/app/api/tenants/billing-config/route';

describe('Payment and billing config', () => {
  const suffix = Date.now().toString();
  const tenantAId = `test-paycfg-a-${suffix}`;
  const tenantBId = `test-paycfg-b-${suffix}`;
  const appkey = `appkey-secret-${suffix}`;

  beforeAll(async () => {
    await prisma.tenant.createMany({
      data: [
        { id: tenantAId, name: 'PayCfg Tenant A', slug: `paycfg-a-${suffix}` },
        { id: tenantBId, name: 'PayCfg Tenant B', slug: `paycfg-b-${suffix}` },
      ],
    });
  });

  afterAll(async () => {
    await prisma.tenantPaymentConfig.deleteMany({ where: { tenantId: { in: [tenantAId, tenantBId] } } });
    await prisma.tenantBillingConfig.deleteMany({ where: { tenantId: { in: [tenantAId, tenantBId] } } });
    await prisma.tenant.deleteMany({ where: { id: { in: [tenantAId, tenantBId] } } });
    await prisma.$disconnect();
  });

  describe('crypto', () => {
    it('roundtrips encrypt/decrypt and never exposes the plaintext', () => {
      const payload = encryptSecret(appkey);
      expect(payload).not.toContain(appkey);
      expect(decryptSecret(payload)).toBe(appkey);
    });

    it('rejects tampered payloads', () => {
      const payload = encryptSecret(appkey);
      const [version, iv, tag, data] = payload.split(':');
      const tampered = Buffer.from(data, 'base64');
      tampered[0] ^= 0xff;
      expect(() => decryptSecret(`${version}:${iv}:${tag}:${tampered.toString('base64')}`)).toThrow(
        AppError
      );
    });

    it('fails clearly when the encryption key env is missing', async () => {
      const original = process.env.PAYMENTS_ENCRYPTION_KEY;
      delete process.env.PAYMENTS_ENCRYPTION_KEY;
      try {
        expect(() => encryptSecret(appkey)).toThrow(AppError);
        try {
          encryptSecret(appkey);
        } catch (error) {
          expect((error as AppError).code).toBe('PAYMENTS_ENCRYPTION_KEY_MISSING');
        }
      } finally {
        process.env.PAYMENTS_ENCRYPTION_KEY = original;
      }
    });

    it('masks secrets keeping only the last four characters', () => {
      expect(maskSecret('1234567890')).toBe('****7890');
      expect(maskSecret('abc')).toBe('****');
    });
  });

  describe('payment config service', () => {
    it('stores the appkey encrypted and returns only a mask', async () => {
      const saved = await savePaymentConfig(tenantAId, { gateway: 'LIBELULA', appkey, isActive: true });

      expect(saved.appkeyMasked).toBe(maskSecret(appkey));
      expect(saved.appkeyMasked).not.toContain(appkey);

      const row = await prisma.tenantPaymentConfig.findUnique({
        where: { tenantId_gateway: { tenantId: tenantAId, gateway: 'LIBELULA' } },
      });
      expect(row).toBeTruthy();
      expect(row!.appkeyEncrypted).not.toContain(appkey);
      expect(decryptSecret(row!.appkeyEncrypted)).toBe(appkey);
    });

    it('enforces uniqueness per (tenantId, gateway) via upsert', async () => {
      await savePaymentConfig(tenantAId, { gateway: 'LIBELULA', appkey: `${appkey}-updated`, isActive: true });

      const rows = await prisma.tenantPaymentConfig.findMany({
        where: { tenantId: tenantAId, gateway: 'LIBELULA' },
      });
      expect(rows).toHaveLength(1);
      expect(decryptSecret(rows[0].appkeyEncrypted)).toBe(`${appkey}-updated`);
    });

    it('requires an appkey when the config does not exist yet', async () => {
      await expect(
        savePaymentConfig(tenantBId, { gateway: 'LIBELULA', isActive: true })
      ).rejects.toThrow(AppError);
    });

    it('keeps only one active payment config per tenant', async () => {
      await savePaymentConfig(tenantAId, { gateway: 'CUCU', appkey: `cucu-${suffix}`, isActive: true });

      const rows = await getPaymentConfigs(tenantAId);
      const libelula = rows.find((row) => row.gateway === 'LIBELULA');
      const cucu = rows.find((row) => row.gateway === 'CUCU');
      expect(libelula?.isActive).toBe(false);
      expect(cucu?.isActive).toBe(true);

      await savePaymentConfig(tenantAId, { gateway: 'LIBELULA', isActive: true });
      const reactivated = await getPaymentConfigs(tenantAId);
      expect(reactivated.find((row) => row.gateway === 'LIBELULA')?.isActive).toBe(true);
      expect(reactivated.find((row) => row.gateway === 'CUCU')?.isActive).toBe(false);
    });

    it('isolates configs between tenants', async () => {
      const tenantBConfigs = await getPaymentConfigs(tenantBId);
      expect(tenantBConfigs).toHaveLength(0);

      const savedB = await savePaymentConfig(tenantBId, {
        gateway: 'LIBELULA',
        appkey: `b-${appkey}-other`,
        isActive: true,
      });

      const tenantAConfigs = await getPaymentConfigs(tenantAId);
      expect(tenantAConfigs).toHaveLength(2);
      expect(tenantAConfigs.some((row) => row.id === savedB.id)).toBe(false);

      const rowsB = await prisma.tenantPaymentConfig.findMany({ where: { tenantId: tenantBId } });
      expect(rowsB).toHaveLength(1);
      expect(decryptSecret(rowsB[0].appkeyEncrypted)).toBe(`b-${appkey}-other`);
    });
  });

  describe('billing config service', () => {
    it('encrypts credentials and returns only masks', async () => {
      const saved = await saveBillingConfig(tenantAId, {
        provider: 'FACTELEC',
        isEnabled: true,
        credentials: { apiToken: `fct-token-${suffix}` },
      });

      expect(saved.credentialsMasked.apiToken).toBe(maskSecret(`fct-token-${suffix}`));
      expect(JSON.stringify(saved.credentialsMasked)).not.toContain(`fct-token-${suffix}`);

      const row = await prisma.tenantBillingConfig.findUnique({
        where: { tenantId_provider: { tenantId: tenantAId, provider: 'FACTELEC' } },
      });
      const stored = row!.credentialsEncrypted as Record<string, string>;
      expect(JSON.stringify(stored)).not.toContain(`fct-token-${suffix}`);
      expect(decryptSecret(stored.apiToken)).toBe(`fct-token-${suffix}`);
    });

    it('rejects enabling a new config without credentials', async () => {
      await expect(
        saveBillingConfig(tenantBId, { provider: 'FACTELEC', isEnabled: true })
      ).rejects.toThrow(AppError);
    });

    it('keeps existing credentials when re-enabling without resending them', async () => {
      await saveBillingConfig(tenantAId, { provider: 'FACTELEC', isEnabled: false });

      const reenabled = await saveBillingConfig(tenantAId, { provider: 'FACTELEC', isEnabled: true });
      expect(reenabled.isEnabled).toBe(true);
      expect(reenabled.credentialsMasked.apiToken).toBe(maskSecret(`fct-token-${suffix}`));

      const rows = await prisma.tenantBillingConfig.findMany({
        where: { tenantId: tenantAId, provider: 'FACTELEC' },
      });
      expect(rows).toHaveLength(1);
    });

    it('isolates billing configs between tenants', async () => {
      expect(await getBillingConfigs(tenantBId)).toHaveLength(0);
    });
  });

  describe('config API routes', () => {
    const headersFor = (role: 'ADMIN' | 'SELLER' | 'SUPER_ADMIN', tenantId?: string | null) => ({
      Authorization: `Bearer ${generateAccessToken({
        userId: `user-${role.toLowerCase()}-${suffix}`,
        role,
        tenantId,
      })}`,
      'Content-Type': 'application/json',
    });

    it('saves and reads the payment config derived from the JWT tenant', async () => {
      const putResponse = await putPaymentRoute(
        new NextRequest('http://localhost/api/tenants/payment-config', {
          method: 'PUT',
          headers: headersFor('ADMIN', tenantBId),
          body: JSON.stringify({ gateway: 'LIBELULA', appkey: `route-${appkey}`, isActive: true }),
        })
      );
      expect(putResponse.status).toBe(200);
      const putData = await putResponse.json();
      expect(putData.success).toBe(true);
      expect(putData.data.appkeyMasked).toBe(maskSecret(`route-${appkey}`));
      expect(JSON.stringify(putData.data)).not.toContain(`route-${appkey}`);

      const getResponse = await getPaymentRoute(
        new NextRequest('http://localhost/api/tenants/payment-config', {
          headers: headersFor('ADMIN', tenantBId),
        })
      );
      expect(getResponse.status).toBe(200);
      const getData = await getResponse.json();
      expect(getData.data).toHaveLength(1);
      expect(getData.data[0].gateway).toBe('LIBELULA');
      expect(JSON.stringify(getData.data)).not.toContain(`route-${appkey}`);
    });

    it('returns only the configs of the JWT tenant', async () => {
      const response = await getPaymentRoute(
        new NextRequest('http://localhost/api/tenants/payment-config', {
          headers: headersFor('ADMIN', tenantBId),
        })
      );
      const data = await response.json();
      expect(data.data.map((row: { gateway: string }) => row.gateway)).toEqual(['LIBELULA']);
    });

    it('rejects invalid payloads with 400', async () => {
      const response = await putBillingRoute(
        new NextRequest('http://localhost/api/tenants/billing-config', {
          method: 'PUT',
          headers: headersFor('ADMIN', tenantAId),
          body: JSON.stringify({ provider: 'UNKNOWN', isEnabled: true }),
        })
      );
      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('VALIDATION_ERROR');
    });

    it('saves the billing config scoped to the JWT tenant', async () => {
      const response = await putBillingRoute(
        new NextRequest('http://localhost/api/tenants/billing-config', {
          method: 'PUT',
          headers: headersFor('ADMIN', tenantBId),
          body: JSON.stringify({
            provider: 'FACTELEC',
            isEnabled: true,
            credentials: { apiToken: `route-token-${suffix}` },
          }),
        })
      );
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.data.credentialsMasked.apiToken).toBe(maskSecret(`route-token-${suffix}`));
      expect(JSON.stringify(data.data)).not.toContain(`route-token-${suffix}`);
    });

    it('forbids roles without the settings permission', async () => {
      const sellerResponse = await getPaymentRoute(
        new NextRequest('http://localhost/api/tenants/payment-config', {
          headers: headersFor('SELLER', tenantAId),
        })
      );
      expect(sellerResponse.status).toBe(403);

      const superAdminResponse = await putPaymentRoute(
        new NextRequest('http://localhost/api/tenants/payment-config', {
          method: 'PUT',
          headers: headersFor('SUPER_ADMIN', null),
          body: JSON.stringify({ gateway: 'LIBELULA', appkey, isActive: true }),
        })
      );
      expect(superAdminResponse.status).toBe(403);
    });

    it('requires an authenticated tenant', async () => {
      const response = await getBillingRoute(
        new NextRequest('http://localhost/api/tenants/billing-config', {
          headers: headersFor('ADMIN', null),
        })
      );
      expect(response.status).toBe(403);
      const data = await response.json();
      expect(data.error.code).toBe('TENANT_REQUIRED');
    });
  });
});
