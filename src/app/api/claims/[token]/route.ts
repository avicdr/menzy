import { NextResponse } from 'next/server';
import { getOwnerSession } from '@/lib/auth/owner-auth';
import { getClaimPreviewByToken } from '@/lib/claims/claim-service';
import { FREE_TRIAL_DAYS, TRIAL_PLAN } from '@/lib/payments/plans';
import { SUPPORT_EMAIL } from '@/lib/support/contact';

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;
    const decodedToken = decodeURIComponent(token || '').trim();
    const session = await getOwnerSession();

    const preview = await getClaimPreviewByToken(decodedToken, session?.userId);

    const statusCode =
      preview.valid
        ? 200
        : preview.state === 'ALREADY_CLAIMED'
        ? 409
        : preview.state === 'EXPIRED' || preview.state === 'REVOKED'
        ? 410
        : 404;

    return NextResponse.json(
      {
        ...preview,
        trial: {
          name: TRIAL_PLAN.name,
          days: FREE_TRIAL_DAYS,
          requiresPaymentMethod: false,
        },
        supportEmail: SUPPORT_EMAIL,
        currentUser: session
          ? {
              userId: session.userId,
              email: session.email,
              name: session.name,
            }
          : null,
      },
      { status: statusCode }
    );
  } catch (error: any) {
    console.error('Claim preview GET error:', error);
    return NextResponse.json(
      { valid: false, state: 'INVALID', error: error.message || 'Failed to validate invitation link.' },
      { status: 500 }
    );
  }
}

