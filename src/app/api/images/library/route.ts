import { NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { getCache, withSingleflight } from '@/lib/cache/redis';
import { getCanonicalDisplayMeta } from '@/lib/canonical/catalog';

export const dynamic = 'force-dynamic';

const LIBRARY_CACHE_KEY = 'canonical:library:all';
const LIBRARY_CACHE_TTL_SECONDS = 300;

async function queryCanonicalLibrary(query: string) {
  const assetSelect = {
    id: true,
    publicUrl: true,
    mime: true,
    width: true,
    height: true,
    type: true,
  } as const;

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
    select: {
      id: true,
      normalizedName: true,
      cuisine: true,
      generalizedDescription: true,
      aliases: true,
      imageAsset: { select: assetSelect },
      canonicalAssets: {
        where: { isApproved: true },
        take: 1,
        select: {
          asset: { select: assetSelect },
        },
      },
    },
    orderBy: { normalizedName: 'asc' },
    take: 2000,
  });

  return canonicalDishes
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
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const query = searchParams.get('q')?.toLowerCase().trim() || '';

  if (!query) {
    const cache = getCache();
    const cached = await cache.get(LIBRARY_CACHE_KEY);
    if (cached) {
      try {
        const parsed = JSON.parse(cached) as Awaited<ReturnType<typeof queryCanonicalLibrary>>;
        return NextResponse.json(
          { assets: parsed },
          {
            headers: {
              'Cache-Control': 'public, s-maxage=120, stale-while-revalidate=300',
              'X-Cache': 'HIT',
            },
          }
        );
      } catch {
        // Fall through to refresh corrupt cache payload
      }
    }

    const libraryAssets = await withSingleflight(LIBRARY_CACHE_KEY, async () => {
      const assets = await queryCanonicalLibrary('');
      await cache.set(LIBRARY_CACHE_KEY, JSON.stringify(assets), 'EX', LIBRARY_CACHE_TTL_SECONDS);
      return assets;
    });

    return NextResponse.json(
      { assets: libraryAssets },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=120, stale-while-revalidate=300',
          'X-Cache': 'MISS',
        },
      }
    );
  }

  const libraryAssets = await queryCanonicalLibrary(query);

  return NextResponse.json(
    { assets: libraryAssets },
    { headers: { 'Cache-Control': 'private, max-age=60, stale-while-revalidate=120' } }
  );
}

