import { NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { getAdminSession, logAdminAction } from '@/lib/auth/admin-auth';

export async function GET() {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const dishes = await prisma.canonicalDish.findMany({
    include: {
      imageAsset: true,
      canonicalAliases: true,
      canonicalAssets: {
        include: { asset: true },
      },
      _count: {
        select: { restaurantMenuItems: true },
      },
    },
    orderBy: { normalizedName: 'asc' },
  });

  return NextResponse.json({ dishes });
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

      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Invalid canonical action' }, { status: 400 });
  } catch (error: any) {
    console.error('Canonical admin error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
