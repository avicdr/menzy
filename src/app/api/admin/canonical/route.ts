import { NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { getAdminSession, logAdminAction } from '@/lib/auth/admin-auth';
import { getCanonicalDisplayMeta } from '@/lib/canonical/catalog';
import { invalidateCanonicalIndexCache } from '@/lib/canonical/matcher';

export const dynamic = 'force-dynamic';

export async function GET() {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const rawDishes = await prisma.canonicalDish.findMany({
    select: {
      id: true,
      normalizedName: true,
      cuisine: true,
      generalizedDescription: true,
      reviewState: true,
      aliases: true,
      imageAsset: {
        select: {
          publicUrl: true,
        },
      },
      canonicalAliases: {
        select: {
          normalizedAlias: true,
        },
      },
    },
    orderBy: { normalizedName: 'asc' },
  });

  const dishes = rawDishes.map((dish) => {
    const meta = getCanonicalDisplayMeta(dish.normalizedName, dish.cuisine);
    const aliasList = Array.isArray(dish.aliases) && dish.aliases.length > 0
      ? dish.aliases
      : dish.canonicalAliases.map((a) => a.normalizedAlias);

    return {
      ...dish,
      canonicalName: meta.displayName,
      displayName: meta.displayName,
      category: meta.category,
      cuisineRegion: meta.cuisine,
      culinaryBackground: dish.generalizedDescription || '',
      aliases: aliasList,
    };
  });

  return NextResponse.json(
    { dishes },
    { headers: { 'Cache-Control': 'no-store, max-age=0' } }
  );
}

export async function POST(req: Request) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { action, canonicalId, normalizedName, cuisine, description, aliases, assetId, isApproved } = body;

    if (action === 'CREATE' && normalizedName) {
      const dish = await prisma.canonicalDish.create({
        data: {
          normalizedName: normalizedName.toLowerCase().trim(),
          cuisine: cuisine || 'General',
          generalizedDescription: description || null,
        },
      });

      await logAdminAction({
        adminEmail: session.email,
        action: 'CREATE_CANONICAL_DISH',
        entityType: 'CANONICAL_DISH',
        entityId: dish.id,
        afterState: dish,
        reason: 'Added new archetypal dish to shared library',
      });

      invalidateCanonicalIndexCache();
      return NextResponse.json({ success: true, dish });
    }

    if (action === 'APPROVE_ASSET' && canonicalId && assetId) {
      await prisma.canonicalAsset.upsert({
        where: { canonicalId_assetId: { canonicalId, assetId } },
        update: { isApproved: isApproved !== false },
        create: { canonicalId, assetId, isApproved: true },
      });

      await logAdminAction({
        adminEmail: session.email,
        action: 'APPROVE_CANONICAL_ASSET',
        entityType: 'CANONICAL_ASSET',
        entityId: `${canonicalId}:${assetId}`,
        reason: isApproved ? 'Approved illustration for shared reuse' : 'Rejected illustration',
      });

      invalidateCanonicalIndexCache();
      return NextResponse.json({ success: true });
    }

    if (action === 'ADD_ALIAS' && canonicalId && aliases) {
      const aliasList = Array.isArray(aliases) ? aliases : [aliases];
      for (const a of aliasList) {
        await prisma.canonicalAlias.upsert({
          where: {
            canonicalId_normalizedAlias: {
              canonicalId,
              normalizedAlias: a.toLowerCase().trim(),
            },
          },
          update: {},
          create: {
            canonicalId,
            normalizedAlias: a.toLowerCase().trim(),
          },
        });
      }

      invalidateCanonicalIndexCache();
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Invalid canonical action' }, { status: 400 });
  } catch (error: any) {
    console.error('Canonical admin error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}

