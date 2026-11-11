import { NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { createTenantAccessDeniedResponse, verifyStaffOrOwnerAccess } from '@/lib/auth/tenant-verify';
import { OrderStatus } from '@prisma/client';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const auth = await verifyStaffOrOwnerAccess(id, 'VIEW_HISTORY', {
      includeDetails: false,
    });
    if (!auth.authorized) {
      return createTenantAccessDeniedResponse(auth);
    }

    const { searchParams } = new URL(req.url);
    const range = searchParams.get('range') || '30d';
    const statusParam = searchParams.get('status');
    const tableId = searchParams.get('tableId');

    const where: any = { restaurantId: auth.restaurant.id };

    const now = new Date();
    if (range === 'today') {
      where.placedAt = { gte: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0) };
    } else if (range === '7d') {
      where.placedAt = { gte: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000) };
    } else if (range === '30d') {
      where.placedAt = { gte: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000) };
    }

    if (statusParam) where.status = statusParam as OrderStatus;
    if (tableId) where.tableId = tableId;

    const orders = await prisma.order.findMany({
      where,
      orderBy: { placedAt: 'desc' },
      take: 1000, // Export cap for safety
      include: {
        table: true,
        items: true,
        statusHistory: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          include: { staff: { select: { displayName: true } } },
        },
      },
    });

    const isUsd = auth.restaurant.currency === 'USD';
    const divider = isUsd ? 100 : 100; // Minor units to major

    // Construct CSV
    const headers = [
      'Order Number',
      'Table',
      'Section',
      'Placed At',
      'Status',
      'Subtotal',
      'Tax',
      'Total',
      'Currency',
      'Payment Status',
      'Items Detail',
      'Handled By Staff',
    ];

    const escapeCsv = (str: string) => `"${str.replace(/"/g, '""')}"`;

    const rows = orders.map((o) => {
      const itemsDetail = o.items
        .map((it) => `${it.quantity}x ${it.dishNameSnapshot}${it.variantSnapshot ? ` (${it.variantSnapshot})` : ''}`)
        .join('; ');

      return [
        o.orderNumber,
        escapeCsv(o.table.name),
        escapeCsv(o.table.section || 'Main Dining'),
        o.placedAt.toISOString(),
        o.status,
        (o.subtotalMinor / divider).toFixed(2),
        (o.taxMinor / divider).toFixed(2),
        (o.totalMinor / divider).toFixed(2),
        o.currency,
        o.paymentStatus,
        escapeCsv(itemsDetail),
        escapeCsv(o.statusHistory[0]?.staff?.displayName || '—'),
      ].join(',');
    });

    const csvContent = [headers.join(','), ...rows].join('\n');

    return new NextResponse(csvContent, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${auth.restaurant.slug}-orders-${new Date().toISOString().split('T')[0]}.csv"`,
      },
    });
  } catch (error: any) {
    console.error('Order export CSV error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

