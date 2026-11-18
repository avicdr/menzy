import { NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import {
  createTenantAccessDeniedResponse,
  verifyStaffOrOwnerAccess,
} from '@/lib/auth/tenant-verify';
import { computeCustomerVisitMetrics } from '@/lib/customers/customer-service';

export const dynamic = 'force-dynamic';

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string; customerId: string }> }
) {
  try {
    const { id, customerId } = await params;
    const auth = await verifyStaffOrOwnerAccess(id, 'VIEW_ORDERS', {
      includeDetails: false,
    });
    if (!auth.authorized) {
      return createTenantAccessDeniedResponse(auth);
    }

    const [orderingSettings, customer] = await Promise.all([
      prisma.restaurantOrderingSettings.findUnique({
        where: { restaurantId: auth.restaurant.id },
        select: { customerCreditEnabled: true },
      }),
      prisma.customer.findFirst({
        where: {
          id: customerId,
          restaurantId: auth.restaurant.id,
        },
        include: {
          orders: {
            orderBy: { placedAt: 'desc' },
            include: {
              table: { select: { id: true, name: true, section: true } },
              items: {
                select: {
                  id: true,
                  dishNameSnapshot: true,
                  variantSnapshot: true,
                  quantity: true,
                  lineTotalMinor: true,
                },
              },
            },
          },
          ledgerEntries: {
            orderBy: { createdAt: 'desc' },
            take: 100,
            include: {
              order: { select: { id: true, orderNumber: true } },
            },
          },
        },
      }),
    ]);

    if (!customer) {
      return NextResponse.json({ error: 'Customer not found.' }, { status: 404 });
    }

    const metrics = computeCustomerVisitMetrics(customer.orders);

    return NextResponse.json(
      {
        customerCreditEnabled: Boolean(orderingSettings?.customerCreditEnabled),
        currency: auth.restaurant.currency || 'INR',
        customer: {
          id: customer.id,
          name: customer.name,
          mobile: customer.mobile,
          creditBalanceMinor: customer.creditBalanceMinor,
          notes: customer.notes,
          createdAt: customer.createdAt.toISOString(),
          updatedAt: customer.updatedAt.toISOString(),
          ...metrics,
        },
        orders: customer.orders.map((o) => ({
          id: o.id,
          orderNumber: o.orderNumber,
          status: o.status,
          currency: o.currency,
          subtotalMinor: o.subtotalMinor,
          taxMinor: o.taxMinor,
          serviceChargeMinor: o.serviceChargeMinor,
          totalMinor: o.totalMinor,
          paidMinor: o.paidMinor,
          dueMinor: o.dueMinor,
          paymentStatus: o.paymentStatus,
          placedAt: o.placedAt.toISOString(),
          completedAt: o.completedAt ? o.completedAt.toISOString() : null,
          tableName: o.table?.name || 'Table',
          items: o.items.map((it) => ({
            id: it.id,
            dishName: it.dishNameSnapshot,
            variant: it.variantSnapshot,
            quantity: it.quantity,
            lineTotalMinor: it.lineTotalMinor,
          })),
        })),
        ledgerEntries: customer.ledgerEntries.map((entry) => ({
          id: entry.id,
          type: entry.type,
          amountMinor: entry.amountMinor,
          balanceAfterMinor: entry.balanceAfterMinor,
          note: entry.note,
          recordedBy: entry.recordedBy,
          orderId: entry.orderId,
          orderNumber: entry.order?.orderNumber || null,
          createdAt: entry.createdAt.toISOString(),
        })),
      },
      { headers: { 'Cache-Control': 'no-store, max-age=0' } }
    );
  } catch (error: any) {
    console.error('Customer detail GET error:', error);
    return NextResponse.json({ error: 'Failed to load customer details.' }, { status: 500 });
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string; customerId: string }> }
) {
  try {
    const { id, customerId } = await params;
    const auth = await verifyStaffOrOwnerAccess(id, 'VIEW_ORDERS', {
      includeDetails: false,
    });
    if (!auth.authorized) {
      return createTenantAccessDeniedResponse(auth);
    }

    const body = await req.json().catch(() => null);
    const data: { name?: string; notes?: string | null } = {};

    if (typeof body?.name === 'string') {
      const cleanName = body.name.replace(/\s+/g, ' ').trim();
      if (cleanName.length < 2 || cleanName.length > 80) {
        return NextResponse.json({ error: 'Name must be between 2 and 80 characters.' }, { status: 400 });
      }
      data.name = cleanName;
    }
    if (body?.notes !== undefined) {
      data.notes = typeof body.notes === 'string' && body.notes.trim() ? body.notes.trim().slice(0, 500) : null;
    }

    const existing = await prisma.customer.findFirst({
      where: { id: customerId, restaurantId: auth.restaurant.id },
      select: { id: true },
    });
    if (!existing) {
      return NextResponse.json({ error: 'Customer not found.' }, { status: 404 });
    }

    const updated = await prisma.customer.update({
      where: { id: existing.id },
      data,
    });

    return NextResponse.json({ success: true, customer: updated });
  } catch (error: any) {
    console.error('Customer PATCH error:', error);
    return NextResponse.json({ error: 'Failed to update customer.' }, { status: 500 });
  }
}
