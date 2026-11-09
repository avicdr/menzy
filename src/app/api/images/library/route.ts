import { NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const query = searchParams.get('q')?.toLowerCase() || '';

  const canonicalDishes = await prisma.canonicalDish.findMany({
    where: query
      ? {
          OR: [
            { normalizedName: { contains: query, mode: 'insensitive' } },
            { cuisine: { contains: query, mode: 'insensitive' } },
          ],
        }
      : undefined,
    include: {
      imageAsset: true,
      canonicalAssets: {
        include: { asset: true },
      },
    },
    take: 30,
  });

  const libraryAssets = canonicalDishes
    .filter((d) => d.imageAsset != null)
    .map((d) => ({
      canonicalId: d.id,
      dishName: d.normalizedName,
      cuisine: d.cuisine,
      description: d.generalizedDescription,
      asset: d.imageAsset,
    }));

  return NextResponse.json({ assets: libraryAssets });
}

