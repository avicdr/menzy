import { NextResponse } from 'next/server';
import { checkDinerAIRateLimit } from '@/lib/cache/rate-limiter';
import { processDinerQuery } from '@/lib/gemini/diner-chat';
import prisma from '@/lib/db/prisma';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { restaurantId, sessionToken, message, selectedDishId, history } = body;

    if (!restaurantId || !message) {
      return NextResponse.json({ error: 'restaurantId and message are required' }, { status: 400 });
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

    // 2. Process grounded query through Gemini
    const response = await processDinerQuery({
      restaurantId,
      userMessage: message,
      selectedDishId,
      history,
    });

    // 3. Persist chat message if session exists
    if (sessionToken) {
      try {
        const dinerSession = await prisma.dinerSession.findUnique({
          where: { sessionToken },
        });

        if (dinerSession) {
          await prisma.chatMessage.createMany({
            data: [
              {
                sessionId: dinerSession.id,
                restaurantId,
                sender: 'USER',
                content: message,
              },
              {
                sessionId: dinerSession.id,
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
          });
        }
      } catch (persistErr) {
        console.warn('Failed to persist diner chat transcript:', persistErr);
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

