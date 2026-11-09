import { NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { getAdminSession, logAdminAction } from '@/lib/auth/admin-auth';
import { GrantType } from '@prisma/client';

export async function POST(req: Request) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { organizationId, grantType, tierOrValue, quantity, durationDays, founderReason } = body;

    if (!organizationId || !grantType || !founderReason) {
      return NextResponse.json(
        { error: 'organizationId, grantType, and founderReason are required.' },
        { status: 400 }
      );
    }

    const org = await prisma.organization.findUnique({
      where: { id: organizationId },
    });

    if (!org) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }

    const days = parseInt(durationDays || '14', 10);
    const expirationDate = new Date(Date.now() + days * 24 * 60 * 60 * 1000);

    const grant = await prisma.entitlementGrant.create({
      data: {
        organizationId,
        grantType: grantType as GrantType,
        tierOrValue: tierOrValue || 'PRO',
        quantity: quantity || 0,
        startDate: new Date(),
        expirationDate,
        founderReason,
        createdBy: session.email,
        isActive: true,
      },
    });

    // If granting bonus image credits, also record in CreditLedger
    if (grantType === 'BONUS_IMAGE_CREDITS' && quantity > 0) {
      const currentLedger = await prisma.creditLedger.findMany({
        where: { organizationId, creditType: 'IMAGE_GENERATION' },
      });
      const balance = currentLedger.reduce((acc, c) => acc + c.delta, 0);

      await prisma.creditLedger.create({
        data: {
          organizationId,
          creditType: 'IMAGE_GENERATION',
          delta: quantity,
          balanceAfter: balance + quantity,
          reason: `Founder complimentary grant: ${founderReason}`,
          idempotencyKey: `grant_${grant.id}_${Date.now()}`,
        },
      });
    }

    await logAdminAction({
      adminEmail: session.email,
      action: 'GRANT_ENTITLEMENT',
      entityType: 'ENTITLEMENT_GRANT',
      entityId: grant.id,
      afterState: grant,
      reason: founderReason,
    });

    return NextResponse.json({ success: true, grant });
  } catch (error: any) {
    console.error('Grant entitlement error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}

