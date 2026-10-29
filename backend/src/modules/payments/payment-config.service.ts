import { BillingProviderType, PaymentGatewayType } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { AppError } from '@/lib/errors';
import { decryptSecret, encryptSecret, maskSecret } from '@/lib/crypto';
import type { BillingProviderCredentials, PaymentGatewayCredentials } from './payment-types';

export type PaymentConfigView = {
  id: string;
  gateway: PaymentGatewayType;
  appkeyMasked: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
};

export type BillingConfigView = {
  id: string;
  provider: BillingProviderType;
  isEnabled: boolean;
  credentialsMasked: Record<string, string>;
  createdAt: Date;
  updatedAt: Date;
};

export type PaymentConfigInput = {
  gateway: PaymentGatewayType;
  appkey?: string;
  isActive: boolean;
};

export type BillingConfigInput = {
  provider: BillingProviderType;
  isEnabled: boolean;
  credentials?: Record<string, string>;
};

const maskCredentials = (encrypted: Record<string, unknown>): Record<string, string> => {
  const masked: Record<string, string> = {};
  for (const [key, value] of Object.entries(encrypted)) {
    if (typeof value !== 'string') {
      masked[key] = '****';
      continue;
    }
    try {
      masked[key] = maskSecret(decryptSecret(value));
    } catch {
      masked[key] = '****';
    }
  }
  return masked;
};

export const getPaymentConfigs = async (tenantId: string): Promise<PaymentConfigView[]> => {
  const rows = await prisma.tenantPaymentConfig.findMany({
    where: { tenantId },
    orderBy: { gateway: 'asc' },
  });

  return rows.map((row) => ({
    id: row.id,
    gateway: row.gateway,
    appkeyMasked: maskSecret(decryptSecret(row.appkeyEncrypted)),
    isActive: row.isActive,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  }));
};

export const savePaymentConfig = async (
  tenantId: string,
  input: PaymentConfigInput
): Promise<PaymentConfigView> => {
  const existing = await prisma.tenantPaymentConfig.findUnique({
    where: { tenantId_gateway: { tenantId, gateway: input.gateway } },
  });

  if (!input.appkey && !existing) {
    throw new AppError('appkey is required when creating a payment config', 400, 'APPKEY_REQUIRED');
  }

  const appkeyEncrypted = input.appkey ? encryptSecret(input.appkey) : existing!.appkeyEncrypted;

  const row = await prisma.$transaction(async (tx) => {
    if (input.isActive) {
      await tx.tenantPaymentConfig.updateMany({
        where: { tenantId, gateway: { not: input.gateway }, isActive: true },
        data: { isActive: false },
      });
    }

    return tx.tenantPaymentConfig.upsert({
      where: { tenantId_gateway: { tenantId, gateway: input.gateway } },
      create: {
        tenantId,
        gateway: input.gateway,
        appkeyEncrypted,
        isActive: input.isActive,
      },
      update: {
        appkeyEncrypted,
        isActive: input.isActive,
      },
    });
  });

  return {
    id: row.id,
    gateway: row.gateway,
    appkeyMasked: maskSecret(decryptSecret(row.appkeyEncrypted)),
    isActive: row.isActive,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
};

export const getBillingConfigs = async (tenantId: string): Promise<BillingConfigView[]> => {
  const rows = await prisma.tenantBillingConfig.findMany({
    where: { tenantId },
    orderBy: { provider: 'asc' },
  });

  return rows.map((row) => ({
    id: row.id,
    provider: row.provider,
    isEnabled: row.isEnabled,
    credentialsMasked: maskCredentials(row.credentialsEncrypted as Record<string, unknown>),
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  }));
};

export const saveBillingConfig = async (
  tenantId: string,
  input: BillingConfigInput
): Promise<BillingConfigView> => {
  const existing = await prisma.tenantBillingConfig.findUnique({
    where: { tenantId_provider: { tenantId, provider: input.provider } },
  });

  if (input.isEnabled && !input.credentials && !existing) {
    throw new AppError(
      'credentials are required when enabling a billing config',
      400,
      'CREDENTIALS_REQUIRED'
    );
  }

  let credentialsEncrypted: Record<string, string> | undefined;
  if (input.credentials) {
    credentialsEncrypted = Object.fromEntries(
      Object.entries(input.credentials).map(([key, value]) => [key, encryptSecret(value)])
    );
  }

  const row = await prisma.tenantBillingConfig.upsert({
    where: { tenantId_provider: { tenantId, provider: input.provider } },
    create: {
      tenantId,
      provider: input.provider,
      isEnabled: input.isEnabled,
      credentialsEncrypted: credentialsEncrypted ?? {},
    },
    update: {
      isEnabled: input.isEnabled,
      ...(credentialsEncrypted ? { credentialsEncrypted } : {}),
    },
  });

  return {
    id: row.id,
    provider: row.provider,
    isEnabled: row.isEnabled,
    credentialsMasked: maskCredentials(row.credentialsEncrypted as Record<string, unknown>),
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
};

export const getActivePaymentCredentials = async (
  tenantId: string
): Promise<PaymentGatewayCredentials | null> => {
  const row = await prisma.tenantPaymentConfig.findFirst({
    where: { tenantId, isActive: true },
    orderBy: { gateway: 'asc' },
  });

  if (!row) return null;

  return { gateway: row.gateway, appkey: decryptSecret(row.appkeyEncrypted) };
};

export const getActiveBillingCredentials = async (
  tenantId: string
): Promise<BillingProviderCredentials | null> => {
  const row = await prisma.tenantBillingConfig.findFirst({
    where: { tenantId, isEnabled: true, provider: { not: 'LIBELULA_NATIVE' } },
    orderBy: { provider: 'asc' },
  });

  if (!row) return null;

  const credentials: Record<string, string> = {};
  for (const [key, value] of Object.entries(row.credentialsEncrypted as Record<string, unknown>)) {
    if (typeof value === 'string') {
      credentials[key] = decryptSecret(value);
    }
  }

  return { provider: row.provider, credentials };
};
