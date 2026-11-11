import crypto from 'crypto';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import prisma from '../db/prisma';
import {
  buildSubscriptionExpiredPayload,
  evaluateOrganizationAccess,
  OrganizationAccessStatus,
} from '../billing/subscription-access';

const OWNER_COOKIE_NAME = 'dishora_owner_session';

export interface OwnerSession {
  userId: string;
  email: string;
  name: string | null;
  organizations: Array<{
    id: string;
    name: string;
    role: string;
  }>;
}

export function hashPassword(plainText: string): string {
  return crypto.createHash('sha256').update(plainText).digest('hex');
}

export function verifyPassword(plainText: string, storedHash: string): boolean {
  const hash = hashPassword(plainText);
  return crypto.timingSafeEqual(Buffer.from(hash), Buffer.from(storedHash));
}

export function createOwnerToken(userId: string, email: string): string {
  const secret = process.env.ADMIN_SESSION_SECRET || 'dishora-owner-secret-key-32chars';
  const issuedAt = Date.now();
  const expiresAt = issuedAt + 7 * 24 * 60 * 60 * 1000; // 7 days

  const payload = JSON.stringify({ userId, email, expiresAt });
  const base64Payload = Buffer.from(payload).toString('base64url');
  const signature = crypto.createHmac('sha256', secret).update(base64Payload).digest('base64url');

  return `${base64Payload}.${signature}`;
}

export function verifyOwnerToken(token: string): { userId: string; email: string } | null {
  try {
    const secret = process.env.ADMIN_SESSION_SECRET || 'dishora-owner-secret-key-32chars';
    const [base64Payload, signature] = token.split('.');
    if (!base64Payload || !signature) return null;

    const expectedSignature = crypto.createHmac('sha256', secret).update(base64Payload).digest('base64url');
    if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature))) {
      return null;
    }

    const payload = JSON.parse(Buffer.from(base64Payload, 'base64url').toString('utf8'));
    if (
      !payload ||
      typeof payload.userId !== 'string' ||
      payload.userId.length === 0 ||
      typeof payload.email !== 'string' ||
      typeof payload.expiresAt !== 'number' ||
      !Number.isFinite(payload.expiresAt) ||
      Date.now() > payload.expiresAt
    ) {
      return null;
    }

    return { userId: payload.userId, email: payload.email };
  } catch {
    return null;
  }
}

export async function getVerifiedOwnerCookie(): Promise<{ userId: string; email: string } | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(OWNER_COOKIE_NAME)?.value;
  if (!token) return null;
  return verifyOwnerToken(token);
}

export async function getOwnerSession(): Promise<OwnerSession | null> {
  const verified = await getVerifiedOwnerCookie();
  if (!verified) return null;

  const user = await prisma.user.findUnique({
    where: { id: verified.userId },
    select: {
      id: true,
      email: true,
      name: true,
      memberships: {
        select: {
          role: true,
          organization: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      },
    },
  });

  if (!user) return null;

  return {
    userId: user.id,
    email: user.email,
    name: user.name,
    organizations: user.memberships.map((m) => ({
      id: m.organization.id,
      name: m.organization.name,
      role: m.role,
    })),
  };
}

export async function setOwnerSessionCookie(token: string) {
  const cookieStore = await cookies();
  cookieStore.set(OWNER_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 7 * 24 * 60 * 60, // 7 days
  });
}

export async function clearOwnerSessionCookie() {
  const cookieStore = await cookies();
  cookieStore.delete(OWNER_COOKIE_NAME);
}

export interface RequireRestaurantAccessResult {
  authorized: boolean;
  status?: number;
  user: OwnerSession | null;
  restaurant: any | null;
  error?: string;
  access?: OrganizationAccessStatus;
  expiredPayload?: ReturnType<typeof buildSubscriptionExpiredPayload>;
}

export function createOwnerAccessDeniedResponse(
  auth: Pick<RequireRestaurantAccessResult, 'status' | 'error' | 'expiredPayload'>,
  fallbackStatus = 403
) {
  if (auth.status === 402 && auth.expiredPayload) {
    return NextResponse.json(auth.expiredPayload, {
      status: 402,
      headers: { 'Cache-Control': 'no-store, max-age=0' },
    });
  }
  return NextResponse.json({ error: auth.error || 'Unauthorized' }, { status: fallbackStatus });
}

/**
 * Strict server-side check ensuring the current user is authorized to manage the requested restaurant
 */
export async function requireRestaurantAccess(
  restaurantIdOrSlug: string,
  options?: {
    allowDuringExpiredSubscription?: boolean;
    includeSettings?: boolean;
    includeTheme?: boolean;
  }
): Promise<RequireRestaurantAccessResult> {
  const verified = await getVerifiedOwnerCookie();
  if (!verified) {
    return { authorized: false, user: null, restaurant: null, error: 'UNAUTHENTICATED' };
  }

  const now = new Date();
  const includeSettings = options?.includeSettings ?? true;
  const includeTheme = options?.includeTheme ?? true;

  const [dbUser, restaurant] = await Promise.all([
    prisma.user.findUnique({
      where: { id: verified.userId },
      select: {
        id: true,
        email: true,
        name: true,
        memberships: {
          select: {
            role: true,
            organization: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    }),
    prisma.restaurant.findFirst({
      where: {
        OR: [{ id: restaurantIdOrSlug }, { slug: restaurantIdOrSlug }],
      },
      include: {
        organization: {
          select: {
            id: true,
            name: true,
            billingCountry: true,
            billingCurrency: true,
            subscriptions: {
              take: 1,
              select: {
                id: true,
                planKey: true,
                status: true,
                provider: true,
                currency: true,
                billingPeriod: true,
                paidThrough: true,
                cancelAtPeriodEnd: true,
                createdAt: true,
              },
            },
            entitlements: {
              where: {
                isActive: true,
                expirationDate: { gt: now },
              },
              select: {
                grantType: true,
                tierOrValue: true,
                quantity: true,
                isActive: true,
                expirationDate: true,
              },
            },
          },
        },
        ...(includeSettings ? { settings: true } : {}),
        ...(includeTheme ? { theme: true } : {}),
      },
    }),
  ]);

  if (!dbUser) {
    return { authorized: false, user: null, restaurant: null, error: 'UNAUTHENTICATED' };
  }

  const user: OwnerSession = {
    userId: dbUser.id,
    email: dbUser.email,
    name: dbUser.name,
    organizations: dbUser.memberships.map((m) => ({
      id: m.organization.id,
      name: m.organization.name,
      role: m.role,
    })),
  };

  if (!restaurant) {
    return { authorized: false, user, restaurant: null, error: 'RESTAURANT_NOT_FOUND' };
  }

  // Verify membership
  const userOrgIds = user.organizations.map((o) => o.id);
  const isMember = restaurant.organizationId && userOrgIds.includes(restaurant.organizationId);

  if (!isMember) {
    return { authorized: false, user, restaurant: null, error: 'FORBIDDEN_TENANT_ACCESS' };
  }

  const access = evaluateOrganizationAccess({
    organizationId: restaurant.organizationId,
    isClaimed: restaurant.isClaimed,
    subscription: restaurant.organization?.subscriptions?.[0] ?? null,
    activeGrants: restaurant.organization?.entitlements ?? [],
    now,
  });

  if (!access.allowed && !options?.allowDuringExpiredSubscription) {
    const expiredPayload = buildSubscriptionExpiredPayload(access, {
      restaurantId: restaurant.id,
      restaurantSlug: restaurant.slug,
      restaurantName: restaurant.displayName,
      audience: 'OWNER',
    });
    return {
      authorized: false,
      status: 402,
      error: expiredPayload.error,
      user,
      restaurant,
      access,
      expiredPayload,
    };
  }

  return { authorized: true, status: 200, user, restaurant, access };
}

