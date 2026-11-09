import { describe, it, expect } from 'vitest';
import { createOwnerToken, verifyOwnerToken, hashPassword, verifyPassword } from '../src/lib/auth/owner-auth';

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
  });
});
