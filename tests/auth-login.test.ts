import { describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
  },
  auth: {
    verifyPassword: vi.fn(() => true),
    hashPassword: vi.fn(() => 'pbkdf2$210000$new$safe'),
    passwordHashNeedsUpgrade: vi.fn(() => true),
    createOwnerToken: vi.fn(() => 'owner-token'),
    setOwnerSessionCookie: vi.fn(async () => undefined),
  },
  rateLimit: {
    checkLoginRateLimit: vi.fn(async () => ({ allowed: true })),
  },
}));

vi.mock('../src/lib/db/prisma', () => ({ default: mocks.prisma }));
vi.mock('../src/lib/auth/owner-auth', () => mocks.auth);
vi.mock('../src/lib/auth/login-rate-limit', () => mocks.rateLimit);

import { POST } from '../src/app/api/auth/login/route';

describe('owner login', () => {
  it('does not fail a valid login when legacy password migration is temporarily unavailable', async () => {
    mocks.prisma.user.findUnique.mockResolvedValueOnce({
      id: 'user-1',
      email: 'owner@example.com',
      name: 'Owner',
      passwordHash: 'legacy-sha256-hash',
      memberships: [],
    });
    mocks.prisma.user.update.mockRejectedValueOnce(new Error('database write unavailable'));
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);

    const response = await POST(
      new Request('http://localhost/api/auth/login', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ email: 'owner@example.com', password: 'correct-password' }),
      })
    );

    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ success: true, user: { id: 'user-1' } });
    expect(mocks.auth.createOwnerToken).toHaveBeenCalledWith('user-1', 'owner@example.com');
    expect(errorSpy).toHaveBeenCalledWith(
      'Login password upgrade failed; continuing with legacy hash:',
      expect.any(Error)
    );
    errorSpy.mockRestore();
  });
});
