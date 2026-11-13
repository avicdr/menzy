import crypto from 'crypto';
import { afterEach, describe, it, expect } from 'vitest';
import {
  createOwnerToken,
  verifyOwnerToken,
  hashPassword,
  passwordHashNeedsUpgrade,
  verifyPassword,
} from '../src/lib/auth/owner-auth';
import { verifyAdminPassword } from '../src/lib/auth/admin-auth';

const originalAdminHash = process.env.ADMIN_PASSWORD_HASH;

afterEach(() => {
  process.env.ADMIN_PASSWORD_HASH = originalAdminHash;
});

describe('Tenant Authentication & Password Hashing', () => {
  it('creates and verifies owner session tokens', () => {
    const token = createOwnerToken('user_uuid_123', 'chef@example.com');
    const verified = verifyOwnerToken(token);

    expect(verified).not.toBeNull();
    expect(verified?.userId).toBe('user_uuid_123');
    expect(verified?.email).toBe('chef@example.com');
  });

  it('rejects tampered or forged tokens', () => {
    const validToken = createOwnerToken('user_uuid_123', 'chef@example.com');
    const tampered = validToken.substring(0, validToken.length - 4) + 'abcd';
    const verified = verifyOwnerToken(tampered);

    expect(verified).toBeNull();
  });

  it('safely verifies hashed passwords', () => {
    const pass = 'SuperSecret2026!';
    const hash = hashPassword(pass);

    expect(verifyPassword(pass, hash)).toBe(true);
    expect(verifyPassword('WrongPassword', hash)).toBe(false);
    expect(hash).toMatch(/^pbkdf2\$210000\$/);
    expect(passwordHashNeedsUpgrade(hash)).toBe(false);
  });

  it('supports legacy owner hashes only for login migration', () => {
    const pass = 'LegacySecret2026!';
    const legacyHash = crypto.createHash('sha256').update(pass).digest('hex');

    expect(verifyPassword(pass, legacyHash)).toBe(true);
    expect(passwordHashNeedsUpgrade(legacyHash)).toBe(true);
  });

  it('does not accept the removed hardcoded founder password', () => {
    delete process.env.ADMIN_PASSWORD_HASH;
    expect(verifyAdminPassword('dishora2026!')).toBe(false);
  });

  it('rejects the admin hash that was published in the example environment', () => {
    process.env.ADMIN_PASSWORD_HASH =
      '5986b3f74376e32c04fe630f9bdbcd70d437235af92b9541144996f95bd38b80';
    expect(verifyAdminPassword('dishora2026!')).toBe(false);
  });
});
