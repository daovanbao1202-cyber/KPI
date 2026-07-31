import { randomBytes, scrypt, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';

/**
 * Password hashing with scrypt from the Node standard library — no extra
 * dependency, and memory-hard so it resists GPU cracking far better than the
 * plaintext comparison this replaces.
 *
 * Stored format: `scrypt$<saltHex>$<hashHex>`
 */

const scryptAsync = promisify(scrypt) as (
  password: string,
  salt: Buffer,
  keylen: number
) => Promise<Buffer>;

const KEY_LENGTH = 64;
const PREFIX = 'scrypt$';

export const MIN_PASSWORD_LENGTH = 8;

export function isHashed(stored: string | undefined | null): boolean {
  return typeof stored === 'string' && stored.startsWith(PREFIX);
}

export async function hashPassword(plain: string): Promise<string> {
  const salt = randomBytes(16);
  const derived = await scryptAsync(plain, salt, KEY_LENGTH);
  return `${PREFIX}${salt.toString('hex')}$${derived.toString('hex')}`;
}

/**
 * Verifies a password against a stored value.
 *
 * Legacy plaintext values are still accepted so nobody is locked out by the
 * migration; callers should re-hash on a successful legacy match (see
 * `needsRehash`).
 */
export async function verifyPassword(plain: string, stored: string | undefined | null): Promise<boolean> {
  if (!stored) return false;

  if (!isHashed(stored)) {
    // Legacy plaintext record.
    const a = Buffer.from(plain);
    const b = Buffer.from(stored);
    return a.length === b.length && timingSafeEqual(a, b);
  }

  const [, saltHex, hashHex] = stored.split('$');
  if (!saltHex || !hashHex) return false;

  try {
    const derived = await scryptAsync(plain, Buffer.from(saltHex, 'hex'), KEY_LENGTH);
    const expected = Buffer.from(hashHex, 'hex');
    return derived.length === expected.length && timingSafeEqual(derived, expected);
  } catch {
    return false;
  }
}

/** True when a stored credential is legacy plaintext and should be upgraded. */
export function needsRehash(stored: string | undefined | null): boolean {
  return !!stored && !isHashed(stored);
}

export function validatePasswordStrength(plain: string): string | null {
  if (!plain || plain.length < MIN_PASSWORD_LENGTH) {
    return `Mật khẩu phải có ít nhất ${MIN_PASSWORD_LENGTH} ký tự.`;
  }
  if (!/[a-zA-Z]/.test(plain) || !/[0-9]/.test(plain)) {
    return 'Mật khẩu phải chứa cả chữ và số.';
  }
  return null;
}
