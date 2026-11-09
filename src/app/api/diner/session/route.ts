import { NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import crypto from 'crypto';

export async function POST(req: Request) {
  try {
    const { restaurantSlug, tableToken, sessionToken: existingToken } = await req.json();

    const restaurant = await prisma.restaurant.findUnique({
      where: { slug: restaurantSlug },
    });

    if (!restaurant) {
      return NextResponse.json({ error: 'Restaurant not found' }, { status: 404 });
    }

    let table = null;
    if (tableToken) {
      table = await prisma.table.findUnique({
        where: { qrToken: tableToken },
      });
    }

    const sessionToken = existingToken || `ds_${crypto.randomBytes(16).toString('hex')}`;
    const userAgent = req.headers.get('user-agent') || undefined;
    const clientIp = req.headers.get('x-forwarded-for')?.split(',')[0] || req.headers.get('x-real-ip') || '127.0.0.1';
    const ipHash = crypto.createHash('sha256').update(clientIp).digest('hex').substring(0, 16);

    const session = await prisma.dinerSession.upsert({
      where: { sessionToken },
      update: {
        lastActiveAt: new Date(),
        tableId: table?.id || undefined,
      },
      create: {
        sessionToken,
        restaurantId: restaurant.id,
        tableId: table?.id || null,
        userAgent,
        ipHash,
      },
    });

    // Record scan event
    await prisma.scanEvent.create({
      data: {
        restaurantId: restaurant.id,
        tableId: table?.id || null,
        sessionToken,
        userAgent,
        ipHash,
      },
    });

    return NextResponse.json({
      sessionToken: session.sessionToken,
      restaurantId: restaurant.id,
      tableName: table?.tableLabel || null,
    });
  } catch (error: any) {
    console.error('Session init error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
