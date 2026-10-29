import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';
import { AppError } from '@/lib/errors';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12;
const VERSION_PREFIX = 'v1';

const getKey = (): Buffer => {
  const raw = process.env.PAYMENTS_ENCRYPTION_KEY;

  if (!raw) {
    throw new AppError(
      'PAYMENTS_ENCRYPTION_KEY is not configured',
      500,
      'PAYMENTS_ENCRYPTION_KEY_MISSING'
    );
  }

  if (!/^[0-9a-fA-F]{64}$/.test(raw)) {
    throw new AppError(
      'PAYMENTS_ENCRYPTION_KEY must be a 64 character hex string',
      500,
      'PAYMENTS_ENCRYPTION_KEY_INVALID'
    );
  }

  return Buffer.from(raw, 'hex');
};

export const encryptSecret = (plain: string): string => {
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGORITHM, getKey(), iv);
  const encrypted = Buffer.concat([cipher.update(plain, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();

  return [
    VERSION_PREFIX,
    iv.toString('base64'),
    tag.toString('base64'),
    encrypted.toString('base64'),
  ].join(':');
};

export const decryptSecret = (payload: string): string => {
  const [version, ivRaw, tagRaw, dataRaw] = payload.split(':');

  if (version !== VERSION_PREFIX || !ivRaw || !tagRaw || !dataRaw) {
    throw new AppError('Encrypted secret has an invalid format', 500, 'DECRYPT_FAILED');
  }

  try {
    const decipher = createDecipheriv(ALGORITHM, getKey(), Buffer.from(ivRaw, 'base64'));
    decipher.setAuthTag(Buffer.from(tagRaw, 'base64'));
    const decrypted = Buffer.concat([
      decipher.update(Buffer.from(dataRaw, 'base64')),
      decipher.final(),
    ]);
    return decrypted.toString('utf8');
  } catch {
    throw new AppError('Failed to decrypt secret', 500, 'DECRYPT_FAILED');
  }
};

export const maskSecret = (plain: string): string => {
  if (plain.length <= 4) return '****';
  return `****${plain.slice(-4)}`;
};
