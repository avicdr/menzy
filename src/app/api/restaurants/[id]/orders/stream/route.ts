import { createTenantAccessDeniedResponse, verifyStaffOrOwnerAccess } from '@/lib/auth/tenant-verify';
import prisma from '@/lib/db/prisma';

export const dynamic = 'force-dynamic';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const auth = await verifyStaffOrOwnerAccess(id, 'VIEW_ORDERS', { includeDetails: false });
  if (!auth.authorized) {
    return createTenantAccessDeniedResponse(auth);
  }

  const { searchParams } = new URL(req.url);
  const sinceParam = searchParams.get('since');
  let lastCheckedAt = sinceParam ? new Date(sinceParam) : new Date(Date.now() - 60000); // 1 minute lookback by default

  const encoder = new TextEncoder();
  let intervalId: ReturnType<typeof setInterval> | null = null;
  let closed = false;
  let pollInFlight = false;

  const cleanup = () => {
    closed = true;
    if (intervalId) {
      clearInterval(intervalId);
      intervalId = null;
    }
  };

  req.signal?.addEventListener('abort', cleanup, { once: true });

  const stream = new ReadableStream({
    async start(controller) {
      try {
        controller.enqueue(
          encoder.encode(
            `data: ${JSON.stringify({ type: 'CONNECTED', restaurantId: auth.restaurant.id, time: new Date().toISOString() })}\n\n`
          )
        );
      } catch {
        cleanup();
        return;
      }

      intervalId = setInterval(async () => {
        if (closed || pollInFlight) return;
        pollInFlight = true;
        try {
          const events = await prisma.orderEvent.findMany({
            where: {
              restaurantId: auth.restaurant.id,
              createdAt: { gt: lastCheckedAt },
            },
            orderBy: { createdAt: 'asc' },
            take: 20,
            select: {
              id: true,
              restaurantId: true,
              orderId: true,
              eventType: true,
              payload: true,
              createdAt: true,
            },
          });

          if (closed) return;

          if (events.length > 0) {
            lastCheckedAt = events[events.length - 1].createdAt;
            for (const ev of events) {
              controller.enqueue(
                encoder.encode(
                  `id: ${ev.id}\nevent: ${ev.eventType}\ndata: ${JSON.stringify(ev)}\n\n`
                )
              );
            }
          } else {
            controller.enqueue(encoder.encode(`: ping\n\n`));
          }
        } catch (err) {
          if (!closed) {
            console.error('SSE poll error:', err);
          }
        } finally {
          pollInFlight = false;
        }
      }, 2000);
    },
    cancel() {
      cleanup();
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
    },
  });
}

