import { NextResponse } from 'next/server';
import { clearOwnerSessionCookie, getVerifiedOwnerCookie } from '@/lib/auth/owner-auth';
import prisma from '@/lib/db/prisma';
import { evaluateOrganizationAccess } from '@/lib/billing/subscription-access';
import { SUPPORT_PHONE } from '@/lib/support/contact';

export const dynamic = 'force-dynamic';

export async function POST() {
  await clearOwnerSessionCookie();
  return NextResponse.json({ success: true });
}

export async function GET() {
  const verified = await getVerifiedOwnerCookie();
  if (!verified) {
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
              restaurants: true,
              subscriptions: {
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
      supportPhone: SUPPORT_PHONE,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        organizations: user.memberships.map((m) => {
          const subscription = m.organization.subscriptions[0] || null;
          const access = evaluateOrganizationAccess({
            organizationId: m.organization.id,
            isClaimed: true,
            subscription,
            activeGrants: m.organization.entitlements,
            now,
          });
          return {
            id: m.organization.id,
            name: m.organization.name,
            role: m.role,
            billingCountry: m.organization.billingCountry,
            billingCurrency: m.organization.billingCurrency,
            restaurants: m.organization.restaurants,
            subscription,
            access,
          };
        }),
      },
    },
    { headers: { 'Cache-Control': 'no-store, max-age=0' } }
  );
}

