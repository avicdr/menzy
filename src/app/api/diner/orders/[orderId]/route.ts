import { NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ orderId: string }> }
) {
  try {
    const { orderId } = await params;

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        table: { select: { name: true, section: true } },
        restaurant: { select: { displayName: true, slug: true, currency: true } },
        items: true,
        statusHistory: {
          orderBy: { createdAt: 'asc' },
          select: { newStatus: true, createdAt: true, reason: true },
        },
      },
    });

    if (!order) {
      return NextResponse.json({ error: 'Order not found.' }, { status: 404 });
    }

    return NextResponse.json({
      order: {
        id: order.id,
        orderNumber: order.orderNumber,
        status: order.status,
        currency: order.currency,
        subtotalMinor: order.subtotalMinor,
        taxMinor: order.taxMinor,
        serviceChargeMinor: order.serviceChargeMinor,
        totalMinor: order.totalMinor,
        placedAt: order.placedAt,
        acceptedAt: order.acceptedAt,
        preparingAt: order.preparingAt,
        readyAt: order.readyAt,
        servedAt: order.servedAt,
        completedAt: order.completedAt,
        tableName: order.table.name,
        restaurantName: order.restaurant.displayName,
        items: order.items.map((it) => ({
          id: it.id,
          dishName: it.dishNameSnapshot,
          variant: it.variantSnapshot,
          modifiers: it.modifierSnapshot,
          quantity: it.quantity,
          unitPriceMinor: it.unitPriceMinor,
          lineTotalMinor: it.lineTotalMinor,
          specialInstructions: it.specialInstructions,
        })),
        timeline: order.statusHistory,
      },
    });
  } catch (error: any) {
    console.error('Diner order GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

