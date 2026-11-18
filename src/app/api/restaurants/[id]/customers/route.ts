import { NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import {
  createTenantAccessDeniedResponse,
  verifyStaffOrOwnerAccess,
} from '@/lib/auth/tenant-verify';
import {
  computeCustomerVisitMetrics,
  CustomerServiceError,
  upsertRestaurantCustomer,
} from '@/lib/customers/customer-service';

export const dynamic = 'force-dynamic';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const auth = await verifyStaffOrOwnerAccess(id, 'VIEW_ORDERS', {
      includeDetails: false,
    });
    if (!auth.authorized) {
      return createTenantAccessDeniedResponse(auth);
    }

    const { searchParams } = new URL(req.url);
    const q = (searchParams.get('q') || '').trim().toLowerCase();
    const filter = searchParams.get('filter') || 'all'; // all | repeat | with_credit
    const sort = searchParams.get('sort') || 'recent'; // recent | revenue | visits | credit

    const [orderingSettings, customers] = await Promise.all([
      prisma.restaurantOrderingSettings.findUnique({
        where: { restaurantId: auth.restaurant.id },
        select: { customerCreditEnabled: true },
      }),
      prisma.customer.findMany({
        where: { restaurantId: auth.restaurant.id },
        orderBy: { updatedAt: 'desc' },
        select: {
          id: true,
          name: true,
          mobile: true,
          creditBalanceMinor: true,
          notes: true,
          createdAt: true,
          updatedAt: true,
          orders: {
            select: {
              status: true,
              totalMinor: true,
              paidMinor: true,
              dueMinor: true,
              paymentStatus: true,
              placedAt: true,
            },
          },
        },
      }),
    ]);

    const now = new Date();
    const enrichedAll = customers.map((c) => {
      const metrics = computeCustomerVisitMetrics(c.orders, now);
      return {
        id: c.id,
        name: c.name,
        mobile: c.mobile,
        creditBalanceMinor: c.creditBalanceMinor,
        notes: c.notes,
        createdAt: c.createdAt.toISOString(),
        updatedAt: c.updatedAt.toISOString(),
        ...metrics,
      };
    });

    const summary = {
      totalCustomers: enrichedAll.length,
      repeatCustomers: enrichedAll.filter((c) => c.visitCount >= 2 || c.totalOrders >= 2).length,
      totalCustomerRevenueMinor: enrichedAll.reduce((sum, c) => sum + c.totalRevenueMinor, 0),
      totalOutstandingCreditMinor: enrichedAll.reduce((sum, c) => sum + c.creditBalanceMinor, 0),
      customersWithCreditCount: enrichedAll.filter((c) => c.creditBalanceMinor > 0).length,
    };

    let filtered = enrichedAll;
    if (q) {
      filtered = filtered.filter(
        (c) => c.name.toLowerCase().includes(q) || c.mobile.toLowerCase().includes(q)
      );
    }
    if (filter === 'repeat') {
      filtered = filtered.filter((c) => c.visitCount >= 2 || c.totalOrders >= 2);
    } else if (filter === 'with_credit') {
      filtered = filtered.filter((c) => c.creditBalanceMinor > 0);
    }

    filtered.sort((a, b) => {
      if (sort === 'revenue') return b.totalRevenueMinor - a.totalRevenueMinor;
      if (sort === 'visits') return b.visitCount - a.visitCount || b.totalOrders - a.totalOrders;
      if (sort === 'credit') return b.creditBalanceMinor - a.creditBalanceMinor;
      const aTime = a.lastVisitAt ? Date.parse(a.lastVisitAt) : Date.parse(a.updatedAt);
      const bTime = b.lastVisitAt ? Date.parse(b.lastVisitAt) : Date.parse(b.updatedAt);
      return bTime - aTime;
    });

    return NextResponse.json(
      {
        customerCreditEnabled: Boolean(orderingSettings?.customerCreditEnabled),
        currency: auth.restaurant.currency || 'INR',
        summary,
        customers: filtered,
      },
      { headers: { 'Cache-Control': 'no-store, max-age=0' } }
    );
  } catch (error: any) {
    console.error('Customers GET error:', error);
    return NextResponse.json({ error: 'Failed to load customers.' }, { status: 500 });
  }
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const auth = await verifyStaffOrOwnerAccess(id, 'VIEW_ORDERS', {
      includeDetails: false,
    });
    if (!auth.authorized) {
      return createTenantAccessDeniedResponse(auth);
    }

    const body = await req.json().catch(() => null);
    const customer = await upsertRestaurantCustomer(prisma, {
      restaurantId: auth.restaurant.id,
      name: typeof body?.name === 'string' ? body.name : '',
      mobile: typeof body?.mobile === 'string' ? body.mobile : '',
    });

    return NextResponse.json({ success: true, customer }, { status: 201 });
  } catch (error: any) {
    if (error instanceof CustomerServiceError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error('Customers POST error:', error);
    return NextResponse.json({ error: 'Failed to save customer.' }, { status: 500 });
  }
}
