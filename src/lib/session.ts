/**
 * Stateless session tokens signed with HMAC-SHA256.
 *
 * Built on Web Crypto so the same module works in Route Handlers and in
 * `proxy.ts`. Replaces the previous scheme where the client simply wrote
 * `kpi_current_user` into localStorage and every "role check" trusted it.
 */

export const SESSION_COOKIE = 'kpi_session';
const SESSION_MAX_AGE = 60 * 60 * 24 * 7; // 7 days, in seconds

export interface SessionPayload {
  uid: number;
  email: string;
  role: 'Admin' | 'Manager' | 'User';
  /** Expiry, epoch seconds. */
  exp: number;
}

const DEV_FALLBACK_SECRET = 'kpi-app-insecure-development-secret-do-not-use-in-production';

function getSecret(): string {
  const secret = process.env.AUTH_SECRET;
  if (secret && secret.length >= 16) return secret;

  if (process.env.NODE_ENV === 'production') {
    throw new Error(
      'AUTH_SECRET is missing or too short. Set a random value of at least 16 characters ' +
        'in the environment before serving traffic.'
    );
  }
  console.warn('AUTH_SECRET is not set — falling back to an insecure development secret.');
  return DEV_FALLBACK_SECRET;
}

function base64UrlEncode(bytes: Uint8Array): string {
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function base64UrlDecode(value: string): Uint8Array {
  const padded = value.replace(/-/g, '+').replace(/_/g, '/');
  const binary = atob(padded.padEnd(Math.ceil(padded.length / 4) * 4, '='));
  return Uint8Array.from(binary, (char) => char.charCodeAt(0));
}

async function getKey(): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(getSecret()),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify']
  );
}

/** Constant-time comparison so signature checks do not leak timing information. */
function timingSafeEqual(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a[i] ^ b[i];
  return diff === 0;
}

export async function signSession(
  payload: Omit<SessionPayload, 'exp'>,
  maxAgeSeconds: number = SESSION_MAX_AGE
): Promise<string> {
  const full: SessionPayload = {
    ...payload,
    exp: Math.floor(Date.now() / 1000) + maxAgeSeconds,
  };
  const body = base64UrlEncode(new TextEncoder().encode(JSON.stringify(full)));
  const signature = await crypto.subtle.sign('HMAC', await getKey(), new TextEncoder().encode(body));
  return `${body}.${base64UrlEncode(new Uint8Array(signature))}`;
}

/** Returns the payload when the signature is valid and unexpired, otherwise null. */
export async function verifySession(token: string | undefined | null): Promise<SessionPayload | null> {
  if (!token) return null;

  const separator = token.lastIndexOf('.');
  if (separator <= 0) return null;

  const body = token.slice(0, separator);
  const signature = token.slice(separator + 1);

  try {
    const expected = await crypto.subtle.sign(
      'HMAC',
      await getKey(),
      new TextEncoder().encode(body)
    );
    if (!timingSafeEqual(new Uint8Array(expected), base64UrlDecode(signature))) return null;

    const payload = JSON.parse(new TextDecoder().decode(base64UrlDecode(body))) as SessionPayload;
    if (typeof payload.exp !== 'number' || payload.exp < Math.floor(Date.now() / 1000)) return null;
    if (typeof payload.uid !== 'number') return null;

    return payload;
  } catch {
    return null;
  }
}

export function sessionCookieOptions(maxAgeSeconds: number = SESSION_MAX_AGE) {
  return {
    httpOnly: true,
    sameSite: 'lax' as const,
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: maxAgeSeconds,
  };
}

export { SESSION_MAX_AGE };
