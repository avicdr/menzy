import { verifyStaffOrOwnerAccess } from '@/lib/auth/tenant-verify';
import prisma from '@/lib/db/prisma';

export const dynamic = 'force-dynamic';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const auth = await verifyStaffOrOwnerAccess(id, 'VIEW_ORDERS');
  if (!auth.authorized) {
    return new Response(JSON.stringify({ error: auth.error }), {
      status: auth.status,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const { searchParams } = new URL(req.url);
  const sinceParam = searchParams.get('since');
  let lastCheckedAt = sinceParam ? new Date(sinceParam) : new Date(Date.now() - 60000); // 1 minute lookback by default

  const encoder = new TextEncoder();
  let intervalId: any = null;

  const stream = new ReadableStream({
    async start(controller) {
      // 1. Initial connection greeting
      controller.enqueue(
        encoder.encode(
          `data: ${JSON.stringify({ type: 'CONNECTED', restaurantId: auth.restaurant.id, time: new Date().toISOString() })}\n\n`
        )
      );

      // 2. Poll for new OrderEvents every 2 seconds
      intervalId = setInterval(async () => {
        try {
          const events = await prisma.orderEvent.findMany({
            where: {
              restaurantId: auth.restaurant.id,
              createdAt: { gt: lastCheckedAt },
            },
            orderBy: { createdAt: 'asc' },
            take: 20,
          });

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
            // Heartbeat
            controller.enqueue(encoder.encode(`: ping\n\n`));
          }
        } catch (err) {
          console.error('SSE poll error:', err);
        }
      }, 2000);
    },
    cancel() {
      if (intervalId) clearInterval(intervalId);
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

