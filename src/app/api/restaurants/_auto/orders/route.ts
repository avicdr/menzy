import { NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { getStaffSession } from '@/lib/auth/staff-auth';
import { getOwnerSession } from '@/lib/auth/owner-auth';

export async function GET(req: Request) {
  try {
    let restaurantId: string | null = null;
    let actorName = 'Staff';
    let actorRole = 'KITCHEN';

    // 1. Try staff session
    const staffSession = await getStaffSession();
    if (staffSession) {
      restaurantId = staffSession.restaurantId;
      actorName = staffSession.displayName;
      actorRole = staffSession.role;
    } else {
      // 2. Try owner session
      const ownerSession = await getOwnerSession();
      if (ownerSession && ownerSession.organizations.length > 0) {
        const orgId = ownerSession.organizations[0].id;
        const rest = await prisma.restaurant.findFirst({
          where: { organizationId: orgId },
        });
        if (rest) {
          restaurantId = rest.id;
          actorName = ownerSession.name || ownerSession.email;
          actorRole = 'OWNER';
        }
      }
    }

    if (!restaurantId) {
      return NextResponse.json({ error: 'Unauthorized: Please log in to order portal.' }, { status: 401 });
    }

    const restaurant = await prisma.restaurant.findUnique({
      where: { id: restaurantId },
      select: { id: true, displayName: true, slug: true, currency: true },
    });

    if (!restaurant) {
      return NextResponse.json({ error: 'Restaurant not found.' }, { status: 404 });
    }

    const orders = await prisma.order.findMany({
      where: {
        restaurantId,
        status: {
          in: ['PLACED', 'ACCEPTED', 'PREPARING', 'READY', 'SERVED'],
        },
      },
      orderBy: { placedAt: 'desc' },
      include: {
        table: { select: { id: true, name: true, section: true } },
        items: true,
        statusHistory: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          include: { staff: { select: { displayName: true } } },
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

