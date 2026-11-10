import { NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { getCanonicalDisplayMeta } from '@/lib/canonical/catalog';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const query = searchParams.get('q')?.toLowerCase().trim() || '';

  const canonicalDishes = await prisma.canonicalDish.findMany({
    where: query
      ? {
          OR: [
            { normalizedName: { contains: query, mode: 'insensitive' } },
            { cuisine: { contains: query, mode: 'insensitive' } },
            { generalizedDescription: { contains: query, mode: 'insensitive' } },
            {
              canonicalAliases: {
                some: {
                  normalizedAlias: { contains: query, mode: 'insensitive' },
                },
              },
            },
          ],
        }
      : undefined,
    include: {
      imageAsset: true,
      canonicalAliases: true,
      canonicalAssets: {
        where: { isApproved: true },
        include: { asset: true },
      },
    },
    orderBy: { normalizedName: 'asc' },
    take: 2000,
  });

  const libraryAssets = canonicalDishes
    .map((d) => {
      const resolvedAsset = d.imageAsset || d.canonicalAssets?.[0]?.asset || null;
      if (!resolvedAsset) return null;
      const meta = getCanonicalDisplayMeta(d.normalizedName, d.cuisine);
      return {
        canonicalId: d.id,
        normalizedName: d.normalizedName,
        dishName: meta.displayName,
        category: meta.category,
        cuisine: meta.cuisine,
        description: d.generalizedDescription,
        aliases: Array.isArray(d.aliases) ? d.aliases : [],
        asset: resolvedAsset,
      };
    })
    .filter((entry): entry is NonNullable<typeof entry> => entry !== null);

  return NextResponse.json(
    { assets: libraryAssets },
    { headers: { 'Cache-Control': 'no-store, max-age=0' } }
  );
}

