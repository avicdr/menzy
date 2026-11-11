import { NextResponse } from 'next/server';
import { clearOwnerSessionCookie, getVerifiedOwnerCookie } from '@/lib/auth/owner-auth';
import prisma from '@/lib/db/prisma';
import { evaluateOrganizationAccess } from '@/lib/billing/subscription-access';
import { SUPPORT_EMAIL } from '@/lib/support/contact';

export const dynamic = 'force-dynamic';

export async function POST() {
  try {
    await clearOwnerSessionCookie();
    return NextResponse.json({ success: true }, { headers: { 'Cache-Control': 'no-store, max-age=0' } });
  } catch (error) {
    console.error('Auth me POST error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to clear session.' },
      { status: 500, headers: { 'Cache-Control': 'no-store, max-age=0' } }
    );
  }
}

export async function GET() {
  try {
    const verified = await getVerifiedOwnerCookie();
    if (!verified?.userId) {
      return NextResponse.json(
        { authenticated: false, user: null },
        { status: 401, headers: { 'Cache-Control': 'no-store, max-age=0' } }
      );
    }

    const now = new Date();
    const user = await prisma.user.findUnique({
      where: { id: verified.userId },
      select: {
        id: true,
        email: true,
        name: true,
        memberships: {
          select: {
            role: true,
            organization: {
              select: {
                id: true,
                name: true,
                billingCountry: true,
                billingCurrency: true,
                restaurants: {
                  orderBy: { createdAt: 'asc' },
                  select: {
                    id: true,
                    organizationId: true,
                    slug: true,
                    displayName: true,
                    description: true,
                    country: true,
                    city: true,
                    timezone: true,
                    currency: true,
                    address: true,
                    phone: true,
                    email: true,
                    logoUrl: true,
                    coverUrl: true,
                    googleReviewUrl: true,
                    publicationState: true,
                    isClaimed: true,
                    createdAt: true,
                    updatedAt: true,
                  },
                },
                subscriptions: {
                  take: 1,
                  select: {
                    id: true,
                    provider: true,
                    planKey: true,
                    status: true,
                    currency: true,
                    billingPeriod: true,
                    paidThrough: true,
                    cancelAtPeriodEnd: true,
                    createdAt: true,
                  },
                },
                entitlements: {
                  where: {
                    isActive: true,
                    expirationDate: { gt: now },
                  },
                  select: {
                    id: true,
                    grantType: true,
                    tierOrValue: true,
                    quantity: true,
                    isActive: true,
                    expirationDate: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json(
        { authenticated: false, user: null },
        { status: 401, headers: { 'Cache-Control': 'no-store, max-age=0' } }
      );
    }

    return NextResponse.json(
      {
        authenticated: true,
        supportEmail: SUPPORT_EMAIL,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          organizations: (user.memberships || [])
            .filter((m) => Boolean(m?.organization))
            .map((m) => {
              const subscription = m.organization.subscriptions?.[0] || null;
              const access = evaluateOrganizationAccess({
                organizationId: m.organization.id,
                isClaimed: true,
                subscription,
                activeGrants: m.organization.entitlements || [],
                now,
              });
              return {
                id: m.organization.id,
                name: m.organization.name,
                role: m.role,
                billingCountry: m.organization.billingCountry,
                billingCurrency: m.organization.billingCurrency,
                restaurants: m.organization.restaurants || [],
                subscription,
                access,
              };
            }),
        },
      },
      { headers: { 'Cache-Control': 'no-store, max-age=0' } }
    );
  } catch (error: any) {
    console.error('Auth me GET error:', error);
    return NextResponse.json(
      {
        authenticated: false,
        user: null,
        error: 'Failed to load authenticated session.',
      },
      { status: 500, headers: { 'Cache-Control': 'no-store, max-age=0' } }
    );
  }
}

