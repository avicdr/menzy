import crypto from 'crypto';
import { cookies } from 'next/headers';
import prisma from '../db/prisma';
import { StaffRole, OrderStatus } from '@prisma/client';

export const STAFF_COOKIE_NAME = 'dishora_staff_session';

export interface StaffSessionPayload {
  staffId: string;
  restaurantId: string;
  restaurantSlug: string;
  restaurantName: string;
  displayName: string;
  loginId: string;
  role: StaffRole;
  organizationId?: string | null;
  isClaimed?: boolean;
  organization?: {
    subscriptions: Array<{
      planKey: string;
      status: string;
      provider: string;
      billingPeriod: string;
      paidThrough: Date | null;
      cancelAtPeriodEnd: boolean;
      createdAt: Date;
    }>;
    entitlements: Array<{
      grantType: string;
      tierOrValue: string | null;
      isActive: boolean;
      expirationDate: Date;
    }>;
  } | null;
}

export type StaffAction =
  | 'VIEW_ORDERS'
  | 'ACCEPT_REJECT_ORDERS'
  | 'UPDATE_PREPARATION'
  | 'MARK_SERVED'
  | 'CANCEL_ORDER'
  | 'VIEW_HISTORY'
  | 'VIEW_ANALYTICS'
  | 'MANAGE_STAFF'
  | 'MANAGE_SETTINGS';

/**
 * Hash password with PBKDF2 (100,000 iterations, sha512) and cryptographic salt
 */
export function hashStaffPassword(plainText: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(plainText, salt, 100000, 64, 'sha512').toString('hex');
  return `${salt}:${hash}`;
}

/**
 * Verify plaintext against stored salt:hash with timing-safe comparison
 */
export function verifyStaffPassword(plainText: string, storedHash: string): boolean {
  try {
    const parts = storedHash.split(':');
    if (parts.length !== 2) return false;
    const [salt, originalHash] = parts;
    const computedHash = crypto.pbkdf2Sync(plainText, salt, 100000, 64, 'sha512').toString('hex');
    return crypto.timingSafeEqual(Buffer.from(computedHash, 'hex'), Buffer.from(originalHash, 'hex'));
  } catch {
    return false;
  }
}

/**
 * Compute SHA-256 hash of a session token for secure database storage
 */
export function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

/**
 * Generate a new random staff session token
 */
export function generateStaffSessionToken(): string {
  return `stf_${crypto.randomBytes(32).toString('hex')}`;
}

/**
 * Verify a raw staff session token against database records
 */
export async function verifyStaffSessionToken(rawToken: string) {
  if (!rawToken || !rawToken.startsWith('stf_')) return null;
  try {
    const sessionTokenHash = hashToken(rawToken);
    const session = await prisma.staffSession.findFirst({
      where: {
        sessionTokenHash,
        revokedAt: null,
        expiresAt: { gt: new Date() },
      },
      include: {
        staff: {
          include: {
            restaurant: {
              select: { id: true, slug: true, displayName: true },
            },
          },
        },
      },
    });

    if (!session || !session.staff || !session.staff.isActive) return null;
    return session;
  } catch {
    return null;
  }
}

/**
 * Check if a staff role is authorized for a specific action
 */
export function canStaffPerform(role: StaffRole, action: StaffAction): boolean {
  switch (action) {
    case 'VIEW_ORDERS':
      return true; // All staff can see incoming/active orders
    case 'ACCEPT_REJECT_ORDERS':
      return role === 'OWNER' || role === 'MANAGER';
    case 'UPDATE_PREPARATION':
      return role === 'OWNER' || role === 'MANAGER' || role === 'KITCHEN';
    case 'MARK_SERVED':
      return role === 'OWNER' || role === 'MANAGER' || role === 'WAITER';
    case 'CANCEL_ORDER':
      return role === 'OWNER' || role === 'MANAGER';
    case 'VIEW_HISTORY':
    case 'VIEW_ANALYTICS':
      return role === 'OWNER' || role === 'MANAGER';
    case 'MANAGE_STAFF':
    case 'MANAGE_SETTINGS':
      return role === 'OWNER';
    default:
      return false;
  }
}

/**
 * Validate allowed order lifecycle status transitions
 */
export function isAllowedStatusTransition(
  currentStatus: OrderStatus,
  targetStatus: OrderStatus,
  role: StaffRole
): { allowed: boolean; error?: string } {
  // Terminal states cannot be changed
  if (currentStatus === 'COMPLETED' || currentStatus === 'REJECTED' || currentStatus === 'CANCELLED') {
    return { allowed: false, error: `Order is already in terminal state: ${currentStatus}` };
  }

  // Same status is a no-op
  if (currentStatus === targetStatus) {
    return { allowed: true };
  }

  // Allowed transitions
  const transitions: Record<OrderStatus, OrderStatus[]> = {
    PLACED: ['ACCEPTED', 'REJECTED', 'CANCELLED'],
    ACCEPTED: ['PREPARING', 'CANCELLED'],
    PREPARING: ['READY', 'CANCELLED'],
    READY: ['SERVED', 'CANCELLED'],
    SERVED: ['COMPLETED'],
    COMPLETED: [],
    REJECTED: [],
    CANCELLED: [],
  };

  const allowedTargets = transitions[currentStatus] || [];
  if (!allowedTargets.includes(targetStatus)) {
    return {
      allowed: false,
      error: `Invalid transition from ${currentStatus} to ${targetStatus}`,
    };
  }

  // Role permissions on transitions
  if (targetStatus === 'ACCEPTED' || targetStatus === 'REJECTED') {
    if (!canStaffPerform(role, 'ACCEPT_REJECT_ORDERS')) {
      return { allowed: false, error: 'Only Managers and Owners can accept or reject orders' };
    }
  }

  if (targetStatus === 'PREPARING' || targetStatus === 'READY') {
    if (!canStaffPerform(role, 'UPDATE_PREPARATION')) {
      return { allowed: false, error: 'Only Kitchen Staff, Managers, and Owners can update preparation status' };
    }
  }

  if (targetStatus === 'SERVED' || targetStatus === 'COMPLETED') {
    if (!canStaffPerform(role, 'MARK_SERVED')) {
      return { allowed: false, error: 'Only Wait Staff, Managers, and Owners can mark orders served/completed' };
    }
  }

  if (targetStatus === 'CANCELLED') {
    if (!canStaffPerform(role, 'CANCEL_ORDER')) {
      return { allowed: false, error: 'Only Managers and Owners can cancel active orders' };
    }
  }

  return { allowed: true };
}

/**
 * Get current authenticated staff member from HTTP-only session cookie
 */
export async function getStaffSession(): Promise<StaffSessionPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(STAFF_COOKIE_NAME)?.value;
  if (!token) return null;

  const sessionTokenHash = hashToken(token);

  const now = new Date();
  const session = await prisma.staffSession.findUnique({
    where: { sessionTokenHash },
    include: {
      staff: {
        include: {
          restaurant: {
            select: {
              id: true,
              slug: true,
              displayName: true,
              publicationState: true,
              organizationId: true,
              isClaimed: true,
              organization: {
                select: {
                  subscriptions: {
                    take: 1,
                    select: {
                      planKey: true,
                      status: true,
                      provider: true,
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
                      isActive: true,
                      expirationDate: true,
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  });

  if (!session) return null;
  if (session.revokedAt) return null;
  if (now > session.expiresAt) return null;
  if (!session.staff.isActive) return null; // Disabled staff accounts lose access immediately

  return {
    staffId: session.staff.id,
    restaurantId: session.staff.restaurantId,
    restaurantSlug: session.staff.restaurant.slug,
    restaurantName: session.staff.restaurant.displayName,
    displayName: session.staff.displayName,
    loginId: session.staff.loginId,
    role: session.staff.role,
    organizationId: session.staff.restaurant.organizationId,
    isClaimed: session.staff.restaurant.isClaimed,
    organization: session.staff.restaurant.organization,
  };
}

/**
 * Set HTTP-only secure cookie for staff session
 */
export async function setStaffSessionCookie(token: string, expiresAt: Date) {
  const cookieStore = await cookies();
  cookieStore.set(STAFF_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    expires: expiresAt,
  });
}

/**
 * Clear staff session cookie
 */
export async function clearStaffSessionCookie() {
  const cookieStore = await cookies();
  cookieStore.set(STAFF_COOKIE_NAME, '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  });
}
