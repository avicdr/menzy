import { NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import {
  verifyPassword,
  hashPassword,
  passwordHashNeedsUpgrade,
  createOwnerToken,
  setOwnerSessionCookie,
} from '@/lib/auth/owner-auth';
import { checkLoginRateLimit } from '@/lib/auth/login-rate-limit';

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();

    if (typeof email !== 'string' || typeof password !== 'string' || !email || !password) {
      return NextResponse.json({ error: 'Email and password are required.' }, { status: 400 });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const rate = await checkLoginRateLimit(req, 'owner', normalizedEmail, 10);
    if (!rate.allowed) {
      return NextResponse.json(
        { error: 'Too many login attempts. Please try again later.' },
        { status: 429, headers: { 'Retry-After': String(rate.retryAfterSeconds) } }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
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

    if (passwordHashNeedsUpgrade(user.passwordHash)) {
      await prisma.user.update({
        where: { id: user.id },
        data: { passwordHash: hashPassword(password) },
      });
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
