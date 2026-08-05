import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

import {
  hashPassword,
  isHashed,
  needsRehash,
  validatePasswordStrength,
  verifyPassword,
} from './password.ts';

describe('password hashing', () => {
  test('accepts the password it was given', async () => {
    const stored = await hashPassword('Kpi2026abc');
    assert.ok(isHashed(stored));
    assert.equal(await verifyPassword('Kpi2026abc', stored), true);
  });

  test('rejects a wrong password', async () => {
    const stored = await hashPassword('Kpi2026abc');
    assert.equal(await verifyPassword('Kpi2026abd', stored), false);
    assert.equal(await verifyPassword('', stored), false);
  });

  test('never stores the password in readable form', async () => {
    const stored = await hashPassword('Kpi2026abc');
    assert.ok(!stored.includes('Kpi2026abc'));
  });

  test('salts, so the same password hashes differently each time', async () => {
    assert.notEqual(await hashPassword('Kpi2026abc'), await hashPassword('Kpi2026abc'));
  });

  test('rejects anything when no credential is stored', async () => {
    assert.equal(await verifyPassword('anything', null), false);
    assert.equal(await verifyPassword('anything', undefined), false);
    assert.equal(await verifyPassword('anything', ''), false);
  });

  describe('migration from the old plaintext column', () => {
    test('still lets an existing plaintext password through', async () => {
      assert.equal(await verifyPassword('123456', '123456'), true);
      assert.equal(await verifyPassword('1234567', '123456'), false);
    });

    test('flags plaintext for upgrade but not a real hash', async () => {
      assert.equal(needsRehash('123456'), true);
      assert.equal(needsRehash(await hashPassword('123456')), false);
    });
  });

  describe('strength rules', () => {
    test('requires at least eight characters', () => {
      assert.ok(validatePasswordStrength('Kpi123') !== null);
      assert.ok(validatePasswordStrength('') !== null);
    });

    test('requires both letters and digits', () => {
      assert.ok(validatePasswordStrength('abcdefghij') !== null);
      assert.ok(validatePasswordStrength('1234567890') !== null);
    });

    test('accepts a password meeting both rules', () => {
      assert.equal(validatePasswordStrength('Kpi2026abc'), null);
    });
  });
});
