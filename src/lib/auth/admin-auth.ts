import crypto from 'crypto';
import { cookies } from 'next/headers';
import prisma from '../db/prisma';

const ADMIN_COOKIE_NAME = 'dishora_admin_session';

export interface AdminSession {
  email: string;
  authenticatedAt: number;
  expiresAt: number;
}

/**
 * Validates founder password against the configured ADMIN_PASSWORD_HASH in .env
 */
export function verifyAdminPassword(plainPassword: string): boolean {
  const configuredHash = process.env.ADMIN_PASSWORD_HASH;
  if (!configuredHash) return false;

  // Supports sha256 hash
  const hash = crypto.createHash('sha256').update(plainPassword).digest('hex');
  return crypto.timingSafeEqual(Buffer.from(hash), Buffer.from(configuredHash));
}

/**
 * Creates a signed, encrypted-like session token using ADMIN_SESSION_SECRET
 */
export function createAdminToken(email: string): string {
  const secret = process.env.ADMIN_SESSION_SECRET || 'dishora-super-secret-admin-session-key-32chars';
  const authenticatedAt = Date.now();
  const expiresAt = authenticatedAt + 24 * 60 * 60 * 1000; // 24 hours

  const payload = JSON.stringify({ email, authenticatedAt, expiresAt });
  const base64Payload = Buffer.from(payload).toString('base64url');
  const signature = crypto.createHmac('sha256', secret).update(base64Payload).digest('base64url');

  return `${base64Payload}.${signature}`;
}

/**
 * Verifies the admin session token
 */
export function verifyAdminToken(token: string): AdminSession | null {
  try {
    const secret = process.env.ADMIN_SESSION_SECRET || 'dishora-super-secret-admin-session-key-32chars';
    const [base64Payload, signature] = token.split('.');
    if (!base64Payload || !signature) return null;

    const expectedSignature = crypto.createHmac('sha256', secret).update(base64Payload).digest('base64url');
    if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature))) {
      return null;
    }

    const session: AdminSession = JSON.parse(Buffer.from(base64Payload, 'base64url').toString('utf8'));
    if (Date.now() > session.expiresAt) {
      return null;
    }

    return session;
  } catch {
    return null;
  }
}

/**
 * Server-side helper to check if the current request is from an authorized founder admin
 */
export async function getAdminSession(): Promise<AdminSession | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(ADMIN_COOKIE_NAME)?.value;
  if (!token) return null;
  return verifyAdminToken(token);
}

/**
 * Sets the admin session cookie with HTTP-only, Secure, SameSite=Lax flags
 */
export async function setAdminSessionCookie(token: string) {
  const cookieStore = await cookies();
  cookieStore.set(ADMIN_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 24 * 60 * 60, // 24 hours
  });
}

/**
 * Clears the admin session cookie on logout
 */
export async function clearAdminSessionCookie() {
  const cookieStore = await cookies();
  cookieStore.delete(ADMIN_COOKIE_NAME);
}

/**
 * Writes an immutable audit log record for founder actions
 */
export async function logAdminAction(params: {
  adminEmail: string;
  action: string;
  entityType: string;
  entityId: string;
  beforeState?: any;
  afterState?: any;
  reason?: string;
  ipAddress?: string;
}) {
  try {
    await prisma.adminAuditLog.create({
      data: {
        adminEmail: params.adminEmail,
        action: params.action,
        entityType: params.entityType,
        entityId: params.entityId,
        beforeState: params.beforeState ?? null,
        afterState: params.afterState ?? null,
        reason: params.reason ?? null,
        ipAddress: params.ipAddress ?? null,
      },
    });
  } catch (error) {
    console.error('Failed to create admin audit log:', error);
  }
}

