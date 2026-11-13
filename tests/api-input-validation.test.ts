import { describe, expect, it } from 'vitest';
import { POST as ownerLoginPost } from '../src/app/api/auth/login/route';
import { POST as adminLoginPost } from '../src/app/api/admin/auth/login/route';
import { POST as staffLoginPost } from '../src/app/api/staff/login/route';
import { POST as dinerSessionPost } from '../src/app/api/diner/session/route';

function malformedRequest(path: string) {
  return new Request(`http://localhost${path}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: '{',
  });
}

describe('API input validation', () => {
  it.each([
    ['/api/auth/login', ownerLoginPost],
    ['/api/admin/auth/login', adminLoginPost],
    ['/api/staff/login', staffLoginPost],
    ['/api/diner/session', dinerSessionPost],
  ])('returns 400 for malformed JSON on %s', async (path, handler) => {
    const response = await handler(malformedRequest(path));
    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toMatchObject({
      error: 'A valid JSON request body is required.',
    });
  });

  it('returns 400 before database access when diner session restaurant slug is missing', async () => {
    const response = await dinerSessionPost(
      new Request('http://localhost/api/diner/session', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: '{}',
      })
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({ error: 'Restaurant slug is required.' });
  });
});
