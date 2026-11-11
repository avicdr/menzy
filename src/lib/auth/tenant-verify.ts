import { NextResponse } from 'next/server';
import prisma from '../db/prisma';
import { getOwnerSession } from './owner-auth';
import { getStaffSession, canStaffPerform, StaffAction } from './staff-auth';
import {
  buildSubscriptionExpiredPayload,
  evaluateOrganizationAccess,
  OrganizationAccessStatus,
} from '../billing/subscription-access';
import type { StaffRole } from '@prisma/client';

export function createTenantAccessDeniedResponse(auth: {
  status: number;
  error: string;
  expiredPayload?: ReturnType<typeof buildSubscriptionExpiredPayload>;
}) {
  if (auth.status === 402 && auth.expiredPayload) {
    return NextResponse.json(auth.expiredPayload, {
      status: 402,
      headers: { 'Cache-Control': 'no-store, max-age=0' },
    });
  }
  return NextResponse.json({ error: auth.error }, { status: auth.status });
}

/**
 * Verify restaurant access for owner operations (table config, staff management, settings)
 */
export async function verifyRestaurantOwnerAccess(
  restaurantId: string,
  options?: { includeOrderingSettings?: boolean; includeTheme?: boolean }
) {
  const ownerSession = await getOwnerSession();
  if (!ownerSession) {
    return { authorized: false as const, status: 401 as const, error: 'Unauthorized: Please log in as restaurant owner.' };
  }

  const now = new Date();
  const isAuto = !restaurantId || restaurantId === 'current' || restaurantId === '_auto';
  const includeOrderingSettings = options?.includeOrderingSettings ?? true;
  const includeTheme = options?.includeTheme ?? true;

  const organizationSelect = {
    select: {
      id: true,
      name: true,
      billingCountry: true,
      billingCurrency: true,
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
  };

  const restaurant = isAuto
    ? await prisma.restaurant.findFirst({
        where: {
          organizationId: { in: ownerSession.organizations.map((org) => org.id) },
        },
        include: {
          organization: organizationSelect,
          ...(includeTheme ? { theme: true } : {}),
          ...(includeOrderingSettings ? { orderingSettings: true } : {}),
        },
      })
    : await prisma.restaurant.findFirst({
        where: {
          OR: [{ id: restaurantId }, { slug: restaurantId }],
        },
        include: {
          organization: organizationSelect,
          ...(includeTheme ? { theme: true } : {}),
          ...(includeOrderingSettings ? { orderingSettings: true } : {}),
        },
      });

  if (!restaurant) {
    return { authorized: false as const, status: 404 as const, error: 'Restaurant not found.' };
  }

  // Check if owner belongs to the restaurant's organization
  const hasOrgMembership = ownerSession.organizations.some(
    (org) => org.id === restaurant.organizationId
  );

  if (!hasOrgMembership) {
    return { authorized: false as const, status: 403 as const, error: 'Forbidden: You do not own this restaurant.' };
  }

  const access = evaluateOrganizationAccess({
    organizationId: restaurant.organizationId,
    isClaimed: restaurant.isClaimed,
    subscription: restaurant.organization?.subscriptions?.[0] ?? null,
    activeGrants: restaurant.organization?.entitlements ?? [],
    now,
  });

  if (!access.allowed) {
    const expiredPayload = buildSubscriptionExpiredPayload(access, {
      restaurantId: restaurant.id,
      restaurantSlug: restaurant.slug,
      restaurantName: restaurant.displayName,
      audience: 'OWNER',
    });
    return {
      authorized: false as const,
      status: 402 as const,
      error: expiredPayload.error,
      access,
      expiredPayload,
    };
  }

  return {
    authorized: true as const,
    restaurant,
    ownerSession,
    access,
  };
}

export type VerifyStaffOrOwnerResult =
  | {
      authorized: true;
      restaurant: any;
      actorType: 'OWNER' | 'STAFF';
      role: StaffRole;
      actorId: string;
      actorName: string;
      access: OrganizationAccessStatus;
    }
  | {
      authorized: false;
      status: 401 | 402 | 403 | 404;
      error: string;
      access?: OrganizationAccessStatus;
      expiredPayload?: ReturnType<typeof buildSubscriptionExpiredPayload>;
    };

/**
 * Verify restaurant access for staff operations (order board, status updates, live feed)
 * Allows either authenticated staff belonging to that restaurant, OR the verified restaurant owner
 */
export async function verifyStaffOrOwnerAccess(
  restaurantId: string,
  requiredAction?: StaffAction,
  options?: { includeDetails?: boolean }
): Promise<VerifyStaffOrOwnerResult> {
  const isAuto = !restaurantId || restaurantId === 'current' || restaurantId === '_auto';
  const includeDetails = options?.includeDetails ?? true;
  const now = new Date();

  const organizationSubscriptionInclude = {
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
  };

  const organizationAccessSelect = {
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
  };

  // Check owner and staff sessions concurrently in case both cookies are set in the browser
  const [ownerSession, staffSession] = await Promise.all([
    getOwnerSession(),
    getStaffSession(),
  ]);

  // 1. Prefer verified owner session when owner belongs to the restaurant
  if (ownerSession) {
    const ownerOrgIds = ownerSession.organizations.map((org) => org.id);
    const whereClause = isAuto
      ? { organizationId: { in: ownerOrgIds } }
      : { OR: [{ id: restaurantId }, { slug: restaurantId }] };

    const restaurant = includeDetails
      ? await prisma.restaurant.findFirst({
          where: whereClause,
          include: {
            organization: organizationSubscriptionInclude,
            orderingSettings: true,
            theme: true,
          },
        })
      : await prisma.restaurant.findFirst({
          where: whereClause,
          select: {
            id: true,
            slug: true,
            displayName: true,
            isClaimed: true,
            organizationId: true,
            country: true,
            currency: true,
            timezone: true,
            organization: organizationAccessSelect,
          },
        });

    if (restaurant && restaurant.organizationId && ownerOrgIds.includes(restaurant.organizationId)) {
      const access = evaluateOrganizationAccess({
        organizationId: restaurant.organizationId,
        isClaimed: restaurant.isClaimed,
        subscription: restaurant.organization?.subscriptions?.[0] ?? null,
        activeGrants: restaurant.organization?.entitlements ?? [],
        now,
      });

      if (!access.allowed) {
        const expiredPayload = buildSubscriptionExpiredPayload(access, {
          restaurantId: restaurant.id,
          restaurantSlug: restaurant.slug,
          restaurantName: restaurant.displayName,
          audience: 'STAFF',
        });
        return {
          authorized: false as const,
          status: 402,
          error: expiredPayload.error,
          access,
          expiredPayload,
        };
      }

      return {
        authorized: true as const,
        restaurant,
        actorType: 'OWNER' as const,
        role: 'OWNER' as const,
        actorId: ownerSession.userId,
        actorName: ownerSession.name || ownerSession.email,
        access,
      };
    }
  }

  // 2. Check if staff is logged in
  if (staffSession) {
    const targetRestaurantId = isAuto ? staffSession.restaurantId : restaurantId;
    const matchesStaffRestaurant =
      isAuto ||
      targetRestaurantId === staffSession.restaurantId ||
      targetRestaurantId === staffSession.restaurantSlug;

    let restaurant: any;
    if (!includeDetails && matchesStaffRestaurant && 'organization' in staffSession) {
      // Staff session query already verified RestaurantStaff -> Restaurant -> Organization subscription via FK
      restaurant = {
        id: staffSession.restaurantId,
        slug: staffSession.restaurantSlug,
        displayName: staffSession.restaurantName,
        currency: staffSession.currency ?? 'INR',
        timezone: staffSession.timezone ?? 'Asia/Kolkata',
        isClaimed: staffSession.isClaimed ?? true,
        organizationId: staffSession.organizationId ?? null,
        organization: staffSession.organization ?? null,
      };
    } else {
      restaurant = includeDetails
        ? await prisma.restaurant.findFirst({
            where: {
              OR: [{ id: targetRestaurantId }, { slug: targetRestaurantId }],
            },
            include: {
              organization: organizationSubscriptionInclude,
              orderingSettings: true,
              theme: true,
            },
          })
        : await prisma.restaurant.findFirst({
            where: {
              OR: [{ id: targetRestaurantId }, { slug: targetRestaurantId }],
            },
            select: {
              id: true,
              slug: true,
              displayName: true,
              isClaimed: true,
              organizationId: true,
              country: true,
              currency: true,
              timezone: true,
              organization: organizationAccessSelect,
            },
          });
    }

    if (!restaurant) {
      return { authorized: false as const, status: 404, error: 'Restaurant not found.' };
    }

    if (staffSession.restaurantId !== restaurant.id) {
      return { authorized: false as const, status: 403, error: 'Forbidden: Staff cannot access other restaurants.' };
    }

    if (requiredAction && !canStaffPerform(staffSession.role, requiredAction)) {
      return {
        authorized: false as const,
        status: 403,
        error: `Forbidden: Your role (${staffSession.role}) is not authorized for this action.`,
      };
    }

    const access = evaluateOrganizationAccess({
      organizationId: restaurant.organizationId,
      isClaimed: restaurant.isClaimed,
      subscription: restaurant.organization?.subscriptions?.[0] ?? null,
      activeGrants: restaurant.organization?.entitlements ?? [],
      now,
    });

    if (!access.allowed) {
      const expiredPayload = buildSubscriptionExpiredPayload(access, {
        restaurantId: restaurant.id,
        restaurantSlug: restaurant.slug,
        restaurantName: restaurant.displayName,
        audience: 'STAFF',
      });
      return {
        authorized: false as const,
        status: 402,
        error: expiredPayload.error,
        access,
        expiredPayload,
      };
    }

    return {
      authorized: true as const,
      restaurant,
      actorType: 'STAFF' as const,
      role: staffSession.role,
      actorId: staffSession.staffId,
      actorName: staffSession.displayName,
      access,
    };
  }

  return { authorized: false as const, status: 401, error: 'Unauthorized: Please log in to order portal.' };
}

