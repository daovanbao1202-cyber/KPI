import { test, describe, before } from 'node:test';
import assert from 'node:assert/strict';

import { signSession, verifySession } from './session.ts';

/**
 * A forged session cookie was the vulnerability this module exists to close, so
 * the tampering cases below matter more than the happy path.
 */
before(() => {
  process.env.AUTH_SECRET = 'test-secret-value-long-enough-to-pass';
});

describe('session tokens', () => {
  test('round-trips the signed-in user', async () => {
    const token = await signSession({ uid: 7, email: 'a@b.com', role: 'Manager' });
    const payload = await verifySession(token);

    assert.equal(payload?.uid, 7);
    assert.equal(payload?.email, 'a@b.com');
    assert.equal(payload?.role, 'Manager');
  });

  test('rejects an edited payload', async () => {
    const token = await signSession({ uid: 7, email: 'a@b.com', role: 'User' });
    const [body, signature] = token.split('.');

    // Re-encode the payload claiming Admin, keeping the original signature.
    const forged = JSON.parse(Buffer.from(body, 'base64url').toString());
    forged.role = 'Admin';
    const tampered = `${Buffer.from(JSON.stringify(forged)).toString('base64url')}.${signature}`;

    assert.equal(await verifySession(tampered), null);
  });

  test('rejects a token signed with a different secret', async () => {
    const token = await signSession({ uid: 1, email: 'a@b.com', role: 'Admin' });

    process.env.AUTH_SECRET = 'a-completely-different-secret-value';
    assert.equal(await verifySession(token), null);

    process.env.AUTH_SECRET = 'test-secret-value-long-enough-to-pass';
  });

  test('rejects an expired token', async () => {
    const token = await signSession({ uid: 1, email: 'a@b.com', role: 'Admin' }, -60);
    assert.equal(await verifySession(token), null);
  });

  test('rejects malformed input rather than throwing', async () => {
    for (const value of ['', 'not-a-token', 'a.b.c', undefined, null]) {
      assert.equal(await verifySession(value as string), null);
    }
  });
});
