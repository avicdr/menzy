import { NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { getCache, withSingleflight } from '@/lib/cache/redis';
import { getCanonicalDisplayMeta } from '@/lib/canonical/catalog';
import { REALISTIC_FOOD_ASSET_MANIFEST } from '@/lib/canonical/data/realistic-food-assets';
import {
  getCanonicalVisualStyle,
  getCanonicalVisualStyleLabel,
} from '@/lib/canonical/visual-style';

export const dynamic = 'force-dynamic';

const LIBRARY_CACHE_KEY = 'canonical:library:all';
const LIBRARY_CACHE_TTL_SECONDS = 300;

async function queryCanonicalLibrary(query: string) {
  const assetSelect = {
    id: true,
    storageKey: true,
    publicUrl: true,
    mime: true,
    width: true,
    height: true,
    type: true,
    source: true,
    prompt: true,
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
        select: {
          asset: { select: assetSelect },
        },
      },
    },
    orderBy: { normalizedName: 'asc' },
    take: 2000,
  });

  const rawItems = canonicalDishes.flatMap((d) => {
    const meta = getCanonicalDisplayMeta(d.normalizedName, d.cuisine);
    const allAssets = [
      ...(d.imageAsset ? [d.imageAsset] : []),
      ...d.canonicalAssets.map((entry) => entry.asset),
    ].filter((asset, index, all) => all.findIndex((candidate) => candidate.id === asset.id) === index);

    // Prefer uploaded R2 storage assets over local static placeholders
    const hasStorageAsset = allAssets.some((a) => a.publicUrl?.startsWith('/api/storage/'));
    const activeAssets = hasStorageAsset
      ? allAssets.filter((a) => a.publicUrl?.startsWith('/api/storage/'))
      : allAssets;

    return activeAssets.map((asset) => {
      const style = getCanonicalVisualStyle(asset);
      const manifestEntry = REALISTIC_FOOD_ASSET_MANIFEST.find(
        (m) =>
          asset.storageKey?.includes(m.file) ||
          asset.publicUrl?.includes(m.file) ||
          asset.prompt?.includes(m.file)
      );

      const dishName = manifestEntry?.displayName || meta.displayName;
      const category = manifestEntry?.category || meta.category;
      const cuisine = manifestEntry?.cuisine || meta.cuisine;
      const description =
        manifestEntry?.generalizedDescription || d.generalizedDescription;
      const aliases = manifestEntry?.aliases || (Array.isArray(d.aliases) ? d.aliases : []);

      return {
        canonicalId: d.id,
        normalizedName: manifestEntry?.normalizedName || d.normalizedName,
        dishName,
        category,
        cuisine,
        description,
        aliases,
        style,
        styleLabel: getCanonicalVisualStyleLabel(style),
        asset,
      };
    });
  });

  // Guarantee strict uniqueness: no duplicate dishName and no duplicate image URL
  const seenUrls = new Set<string>();
  const seenNames = new Set<string>();
  const uniqueItems: typeof rawItems = [];

  for (const item of rawItems) {
    const urlKey = item.asset?.publicUrl;
    const nameKey = item.dishName.toLowerCase().trim();
    if (!urlKey || seenUrls.has(urlKey) || seenNames.has(nameKey)) {
      continue;
    }
    seenUrls.add(urlKey);
    seenNames.add(nameKey);
    uniqueItems.push(item);
  }

  return uniqueItems;
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
