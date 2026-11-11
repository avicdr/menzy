import { NextResponse } from 'next/server';
import { checkDinerAIRateLimit } from '@/lib/cache/rate-limiter';
import { processDinerQuery } from '@/lib/gemini/diner-chat';
import prisma from '@/lib/db/prisma';
import {
  checkRestaurantSubscriptionAccess,
  createSubscriptionExpiredResponse,
} from '@/lib/billing/subscription-access';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { restaurantId, sessionToken, message, selectedDishId, history } = body;

    if (!restaurantId || !message) {
      return NextResponse.json({ error: 'restaurantId and message are required' }, { status: 400 });
    }

    const subAccess = await checkRestaurantSubscriptionAccess(restaurantId, { byIdOnly: true });
    if (subAccess.found && !subAccess.access.allowed) {
      return createSubscriptionExpiredResponse(subAccess.access, {
        restaurantId: subAccess.restaurant?.id || restaurantId,
        restaurantSlug: subAccess.restaurant?.slug,
        restaurantName: subAccess.restaurant?.displayName,
        audience: 'DINER',
      });
    }

    // Extract trusted client IP
    const forwardedFor = req.headers.get('x-forwarded-for');
    const clientIp = forwardedFor ? forwardedFor.split(',')[0].trim() : req.headers.get('x-real-ip') || '127.0.0.1';

    // 1. Mandatory 25 req / 5 min rolling window rate limit check
    const rateLimit = await checkDinerAIRateLimit(
      sessionToken || 'anon-session',
      clientIp,
      restaurantId
    );

    if (!rateLimit.allowed) {
      return NextResponse.json(
        {
          error: rateLimit.error || 'RATE_LIMITED',
          message: rateLimit.message || "You've reached the chat limit for now.",
          limit: rateLimit.limit,
          remaining: 0,
          retryAfterSeconds: rateLimit.retryAfterSeconds,
          retryAt: rateLimit.retryAt,
        },
        {
          status: 429,
          headers: {
            'Retry-After': String(rateLimit.retryAfterSeconds),
          },
        }
      );
    }

    // 2. Process grounded query through Gemini concurrently with diner session lookup
    const shouldPersistTelemetry = sessionToken !== 'owner-test-session';
    const [response, dinerSession] = await Promise.all([
      processDinerQuery({
        restaurantId,
        userMessage: message,
        selectedDishId,
        history,
      }),
      shouldPersistTelemetry && sessionToken
        ? prisma.dinerSession
            .findUnique({
              where: { sessionToken },
              select: { id: true, restaurantId: true },
            })
            .catch(() => null)
        : Promise.resolve(null),
    ]);

    // 3. Persist chat message & dish inquiry telemetry in parallel for real diner sessions
    if (shouldPersistTelemetry) {
      const validSession =
        dinerSession && dinerSession.restaurantId === restaurantId ? dinerSession : null;
      const resolvedSessionId = validSession?.id ?? null;

      const engagedDishIds = Array.from(
        new Set(
          [
            response.selectedDishId,
            ...(Array.isArray(response.dishIds) ? response.dishIds : []),
            response.pairingDishId,
          ].filter((id): id is string => typeof id === 'string' && id.length > 0)
        )
      ).slice(0, 5);

      const persistenceTasks: Promise<unknown>[] = [];

      if (validSession) {
        persistenceTasks.push(
          prisma.chatMessage
            .createMany({
              data: [
                {
                  sessionId: validSession.id,
                  restaurantId,
                  sender: 'USER',
                  content: message,
                },
                {
                  sessionId: validSession.id,
                  restaurantId,
                  sender: 'ASSISTANT',
                  content: response.message,
                  recommendedDishIds: response.dishIds,
                  metadata: {
                    selectedDishId: response.selectedDishId,
                    pairingDishId: response.pairingDishId,
                    safetyNotice: response.safetyNotice,
                  },
                },
              ],
            })
            .catch((persistErr) =>
              console.warn('Failed to persist diner chat transcript:', persistErr)
            )
        );
      }

      if (engagedDishIds.length > 0) {
        persistenceTasks.push(
          prisma.dishInteractionEvent
            .createMany({
              data: engagedDishIds.map((dishId) => ({
                restaurantId,
                menuItemId: dishId,
                eventType:
                  response.pairingDishId &&
                  dishId === response.pairingDishId &&
                  dishId !== response.selectedDishId
                    ? 'PAIRING_CLICK'
                    : 'CHAT_QUERY',
                sessionId: resolvedSessionId,
              })),
            })
            .catch((telemetryErr) =>
              console.warn('Failed to record chat dish interaction events:', telemetryErr)
            )
        );
      }

      if (persistenceTasks.length > 0) {
        await Promise.all(persistenceTasks);
      }
    }

    return NextResponse.json({
      ...response,
      rateLimit: {
        limit: rateLimit.limit,
        remaining: rateLimit.remaining,
      },
    });
  } catch (error: any) {
    console.error('Diner chat error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}

