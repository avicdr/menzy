import { NextResponse } from 'next/server';
import { createOwnerAccessDeniedResponse, requireRestaurantAccess } from '@/lib/auth/owner-auth';
import { sanitizeThemePersistenceInput, validateThemeAccessibility } from '@/lib/theme/theme-presets';
import prisma from '@/lib/db/prisma';
import { getCache } from '@/lib/cache/redis';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { restaurantId, isPublishing, ...rawThemeFields } = body;

    if (!restaurantId) {
      return NextResponse.json({ error: 'restaurantId required' }, { status: 400 });
    }

    const auth = await requireRestaurantAccess(restaurantId);
    if (!auth.authorized) {
      return createOwnerAccessDeniedResponse(auth, 403);
    }

    const themeFields = sanitizeThemePersistenceInput(rawThemeFields);

    // Check accessibility & contrast
    const accessCheck = validateThemeAccessibility(themeFields);
    if (!accessCheck.isValid && isPublishing) {
      return NextResponse.json(
        {
          error: 'THEME_ACCESSIBILITY_FAILED',
          message: 'The selected color combination does not meet minimum readability standards.',
          warnings: accessCheck.warnings,
        },
        { status: 422 }
      );
    }

    const theme = await prisma.restaurantTheme.upsert({
      where: { restaurantId },
      update: {
        ...themeFields,
        isPublished: isPublishing ? true : undefined,
        publishedAt: isPublishing ? new Date() : undefined,
      },
      create: {
        restaurantId,
        ...themeFields,
        isPublished: Boolean(isPublishing),
        publishedAt: isPublishing ? new Date() : undefined,
      },
    });

    // Always invalidate diner menu cache so saved or published fonts/styles apply immediately
    const cache = getCache();
    await cache.del(`menu:slug:${auth.restaurant.slug}`);

    return NextResponse.json({
      success: true,
      theme,
      warnings: accessCheck.warnings,
    });
  } catch (error: any) {
    console.error('Update theme error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}

