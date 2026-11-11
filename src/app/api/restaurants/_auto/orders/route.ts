import { NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { getStaffSession } from '@/lib/auth/staff-auth';
import { getOwnerSession } from '@/lib/auth/owner-auth';
import {
  buildSubscriptionExpiredPayload,
  evaluateOrganizationAccess,
} from '@/lib/billing/subscription-access';

export async function GET(_req?: Request) {
  try {
    // Check staff and owner sessions concurrently in 1 round trip
    const [staffSession, ownerSession] = await Promise.all([
      getStaffSession(),
      getOwnerSession(),
    ]);

    const now = new Date();
    let actorName = 'Staff';
    let actorRole = 'KITCHEN';
    let restaurant: {
      id: string;
      displayName: string;
      slug: string;
      currency: string;
      isClaimed: boolean;
      organizationId: string | null;
      organization: {
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
    } | null = null;

    if (staffSession) {
      actorName = staffSession.displayName;
      actorRole = staffSession.role;
      // If getStaffSession already hydrated organization subscription/entitlements, verify without extra query
      if ('organization' in staffSession && staffSession.organization !== undefined) {
        restaurant = {
          id: staffSession.restaurantId,
          displayName: staffSession.restaurantName,
          slug: staffSession.restaurantSlug,
          currency: staffSession.currency ?? 'INR',
          isClaimed: staffSession.isClaimed ?? true,
          organizationId: staffSession.organizationId ?? null,
          organization: staffSession.organization,
        };
      } else {
        restaurant = await prisma.restaurant.findUnique({
          where: { id: staffSession.restaurantId },
          select: {
            id: true,
            displayName: true,
            slug: true,
            currency: true,
            isClaimed: true,
            organizationId: true,
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
                  where: { isActive: true, expirationDate: { gt: now } },
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
        });
      }
    } else if (ownerSession && ownerSession.organizations.length > 0) {
      actorName = ownerSession.name || ownerSession.email;
      actorRole = 'OWNER';
      const orgId = ownerSession.organizations[0].id;
      restaurant = await prisma.restaurant.findFirst({
        where: { organizationId: orgId },
        select: {
          id: true,
          displayName: true,
          slug: true,
          currency: true,
          isClaimed: true,
          organizationId: true,
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
                where: { isActive: true, expirationDate: { gt: now } },
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
      });
    }

    if (!restaurant) {
      return NextResponse.json(
        { error: 'Unauthorized: Please log in to order portal.' },
        { status: 401 }
      );
    }

    const access = evaluateOrganizationAccess({
      organizationId: restaurant.organizationId,
      isClaimed: restaurant.isClaimed,
      subscription: restaurant.organization?.subscriptions?.[0] ?? null,
      activeGrants: restaurant.organization?.entitlements ?? [],
      now,
    });

    if (!access.allowed) {
      return NextResponse.json(
        buildSubscriptionExpiredPayload(access, {
          restaurantId: restaurant.id,
          restaurantSlug: restaurant.slug,
          restaurantName: restaurant.displayName,
          audience: 'STAFF',
        }),
        { status: 402, headers: { 'Cache-Control': 'no-store, max-age=0' } }
      );
    }

    const restaurantId = restaurant.id;

    const orders = await prisma.order.findMany({
      where: {
        restaurantId,
        status: {
          in: ['PLACED', 'ACCEPTED', 'PREPARING', 'READY', 'SERVED'],
        },
      },
      orderBy: { placedAt: 'desc' },
      select: {
        id: true,
        orderNumber: true,
        status: true,
        currency: true,
        subtotalMinor: true,
        taxMinor: true,
        serviceChargeMinor: true,
        totalMinor: true,
        paymentMethod: true,
        paymentStatus: true,
        specialInstructions: true,
        placedAt: true,
        acceptedAt: true,
        preparingAt: true,
        readyAt: true,
        servedAt: true,
        completedAt: true,
        table: { select: { id: true, name: true, section: true } },
        items: {
          select: {
            id: true,
            dishNameSnapshot: true,
            variantSnapshot: true,
            modifierSnapshot: true,
            quantity: true,
            unitPriceMinor: true,
            modifiersTotalMinor: true,
            lineTotalMinor: true,
            specialInstructions: true,
          },
        },
      },
    });

    const formatted = orders.map((o) => ({
      id: o.id,
      orderNumber: o.orderNumber,
      status: o.status,
      currency: o.currency,
      subtotalMinor: o.subtotalMinor,
      taxMinor: o.taxMinor,
      serviceChargeMinor: o.serviceChargeMinor,
      totalMinor: o.totalMinor,
      paymentMethod: o.paymentMethod,
      paymentStatus: o.paymentStatus,
      specialInstructions: o.specialInstructions,
      placedAt: o.placedAt,
      acceptedAt: o.acceptedAt,
      preparingAt: o.preparingAt,
      readyAt: o.readyAt,
      servedAt: o.servedAt,
      completedAt: o.completedAt,
      table: {
        id: o.table.id,
        name: o.table.name,
        section: o.table.section,
      },
      itemCount: o.items.length,
      items: o.items.map((it) => ({
        id: it.id,
        dishName: it.dishNameSnapshot,
        variant: it.variantSnapshot,
        modifiers: it.modifierSnapshot,
        quantity: it.quantity,
        unitPriceMinor: it.unitPriceMinor,
        modifiersTotalMinor: it.modifiersTotalMinor,
        lineTotalMinor: it.lineTotalMinor,
        specialInstructions: it.specialInstructions,
      })),
    }));

    return NextResponse.json({
      restaurantId: restaurant.id,
      restaurantName: restaurant.displayName,
      restaurantSlug: restaurant.slug,
      actor: { name: actorName, role: actorRole },
      orders: formatted,
    });
  } catch (error: any) {
    console.error('Auto orders GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

