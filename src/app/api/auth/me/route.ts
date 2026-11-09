import { NextResponse } from 'next/server';
import { clearOwnerSessionCookie, getOwnerSession } from '@/lib/auth/owner-auth';
import prisma from '@/lib/db/prisma';

export async function POST() {
  await clearOwnerSessionCookie();
  return NextResponse.json({ success: true });
}

export async function GET() {
  const session = await getOwnerSession();
  if (!session) {
    return NextResponse.json({ authenticated: false, user: null }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    include: {
      memberships: {
        include: {
          organization: {
            include: {
              restaurants: true,
              subscriptions: true,
            },
          },
        },
      },
    },
  });

  return NextResponse.json({
    authenticated: true,
    user: {
      id: user?.id,
      email: user?.email,
      name: user?.name,
      organizations: user?.memberships.map((m) => ({
        id: m.organization.id,
        name: m.organization.name,
        role: m.role,
        restaurants: m.organization.restaurants,
        subscription: m.organization.subscriptions[0] || null,
      })),
    },
  });
}

