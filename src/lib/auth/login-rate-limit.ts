import crypto from 'crypto';
import { getCache } from '../cache/redis';

export async function checkLoginRateLimit(
  req: Request,
  scope: 'owner' | 'staff' | 'admin',
  identifier: string,
  limit: number
) {
  const clientIp =
    req.headers.get('cf-connecting-ip') ||
    req.headers.get('x-real-ip') ||
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    'unknown';
  const keyHash = crypto
    .createHash('sha256')
    .update(`${clientIp}:${identifier.trim().toLowerCase()}`)
    .digest('hex');

  return getCache().slidingWindowCheck(`rate:login:${scope}:${keyHash}`, limit, 15 * 60);
}
