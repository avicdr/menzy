import { NextResponse } from 'next/server';
import { getPlansForCountry } from '@/lib/payments/plans';
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
      plans: getPlansForCountry(region),
    },
    {
      headers: {
        'Cache-Control': 'private, no-store',
      },
    }
  );
}

