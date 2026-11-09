import { NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { verifyPassword, createOwnerToken, setOwnerSessionCookie } from '@/lib/auth/owner-auth';

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required.' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      include: {
        memberships: {
          include: {
            organization: {
              include: {
                restaurants: true,
              },
            },
          },
        },
      },
    });

    if (!user || !user.passwordHash) {
      return NextResponse.json({ error: 'Invalid email or password.' }, { status: 401 });
    }

    const isValid = verifyPassword(password, user.passwordHash);
    if (!isValid) {
      return NextResponse.json({ error: 'Invalid email or password.' }, { status: 401 });
    }

    const token = createOwnerToken(user.id, user.email);
    await setOwnerSessionCookie(token);

    const firstRestaurant = user.memberships[0]?.organization?.restaurants[0];

    return NextResponse.json({
      success: true,
      user: { id: user.id, email: user.email, name: user.name },
      defaultRestaurantId: firstRestaurant?.id || null,
      defaultRestaurantSlug: firstRestaurant?.slug || null,
    });
  } catch (error: any) {
    console.error('Login error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
