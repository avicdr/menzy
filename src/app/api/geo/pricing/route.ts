import { NextResponse } from 'next/server';
import { getPlansForCountry, TRIAL_PLAN } from '@/lib/payments/plans';
import { SUPPORT_PHONE } from '@/lib/support/contact';
import { detectRegionFromTimezoneAndLocale } from '@/lib/geo/region-shared';
import { resolveVisitorRegion } from '@/lib/geo/region-server';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const geo = await resolveVisitorRegion(req.headers);

  let region = geo.region;
  if (!geo.authoritative) {
    const { searchParams } = new URL(req.url);
    const tz = searchParams.get('tz');
    const locale = searchParams.get('locale');
    if (tz || locale) {
      region = detectRegionFromTimezoneAndLocale(tz, locale);
    }
  }

  return NextResponse.json(
    {
      region,
      authoritative: geo.authoritative,
      trialPlan: TRIAL_PLAN,
      plans: getPlansForCountry(region),
      supportPhone: SUPPORT_PHONE,
    },
    {
      headers: {
        'Cache-Control': 'private, no-store',
      },
    }
  );
}

