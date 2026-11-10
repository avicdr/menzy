import prisma from '../db/prisma';
import { getOwnerSession } from './owner-auth';
import { getStaffSession, canStaffPerform, StaffAction } from './staff-auth';

/**
 * Verify restaurant access for owner operations (table config, staff management, settings)
 */
export async function verifyRestaurantOwnerAccess(restaurantId: string) {
  const ownerSession = await getOwnerSession();
  if (!ownerSession) {
    return { authorized: false as const, status: 401, error: 'Unauthorized: Please log in as restaurant owner.' };
  }

  const isAuto = !restaurantId || restaurantId === 'current' || restaurantId === '_auto';

  const restaurant = isAuto
    ? await prisma.restaurant.findFirst({
        where: {
          organizationId: { in: ownerSession.organizations.map((org) => org.id) },
        },
        include: {
          organization: true,
          theme: true,
          orderingSettings: true,
        },
      })
    : await prisma.restaurant.findFirst({
        where: {
          OR: [{ id: restaurantId }, { slug: restaurantId }],
        },
        include: {
          organization: true,
          theme: true,
          orderingSettings: true,
        },
      });

  if (!restaurant) {
    return { authorized: false as const, status: 404, error: 'Restaurant not found.' };
  }

  // Check if owner belongs to the restaurant's organization
  const hasOrgMembership = ownerSession.organizations.some(
    (org) => org.id === restaurant.organizationId
  );

  if (!hasOrgMembership) {
    return { authorized: false as const, status: 403, error: 'Forbidden: You do not own this restaurant.' };
  }

  return {
    authorized: true as const,
    restaurant,
    ownerSession,
  };
}

/**
 * Verify restaurant access for staff operations (order board, status updates, live feed)
 * Allows either authenticated staff belonging to that restaurant, OR the verified restaurant owner
 */
export async function verifyStaffOrOwnerAccess(
  restaurantId: string,
  requiredAction?: StaffAction
) {
  const isAuto = !restaurantId || restaurantId === 'current' || restaurantId === '_auto';

  // 1. Check if owner is logged in
  const ownerSession = await getOwnerSession();
  if (ownerSession) {
    const restaurant = isAuto
      ? await prisma.restaurant.findFirst({
          where: {
            organizationId: { in: ownerSession.organizations.map((org) => org.id) },
          },
          include: { organization: true, orderingSettings: true, theme: true },
        })
      : await prisma.restaurant.findFirst({
          where: {
            OR: [{ id: restaurantId }, { slug: restaurantId }],
          },
          include: { organization: true, orderingSettings: true, theme: true },
        });

    if (restaurant && ownerSession.organizations.some((org) => org.id === restaurant.organizationId)) {
      return {
        authorized: true as const,
        restaurant,
        actorType: 'OWNER' as const,
        role: 'OWNER' as const,
        actorId: ownerSession.userId,
        actorName: ownerSession.name || ownerSession.email,
      };
    }
  }

  // 2. Check if staff is logged in
  const staffSession = await getStaffSession();
  if (staffSession) {
    const targetRestaurantId = isAuto ? staffSession.restaurantId : restaurantId;

    const restaurant = await prisma.restaurant.findFirst({
      where: {
        OR: [{ id: targetRestaurantId }, { slug: targetRestaurantId }],
      },
      include: { organization: true, orderingSettings: true, theme: true },
    });

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

    return {
      authorized: true as const,
      restaurant,
      actorType: 'STAFF' as const,
      role: staffSession.role,
      actorId: staffSession.staffId,
      actorName: staffSession.displayName,
    };
  }

  return { authorized: false as const, status: 401, error: 'Unauthorized: Please log in to order portal.' };
}

