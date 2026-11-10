import { NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import crypto from 'crypto';
import { resolveTableFromToken } from '@/lib/tables/table-service';
import {
  evaluateDeviceTableSession,
  getDinerSessionCookieName,
  readCookieFromRequest,
  TABLE_SESSION_TIMEOUT_MINUTES,
  TABLE_SESSION_TIMEOUT_MS,
} from '@/lib/diner/table-session';

function setSessionCookie(res: NextResponse, cookieName: string, sessionToken: string) {
  res.cookies.set(cookieName, sessionToken, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 24 * 7,
  });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      restaurantSlug,
      tableToken,
      t,
      tableId,
      sessionToken: bodySessionToken,
    } = body;

    const qrTokenCandidate =
      typeof t === 'string' && t.trim()
        ? t.trim()
        : typeof tableToken === 'string' && tableToken.trim()
          ? tableToken.trim()
          : '';
    const attemptedRawTableId =
      !qrTokenCandidate && typeof tableId === 'string' && tableId.trim().length > 0;

    const restaurant = await prisma.restaurant.findUnique({
      where: { slug: restaurantSlug },
    });

    if (!restaurant) {
      return NextResponse.json({ error: 'Restaurant not found' }, { status: 404 });
    }

    const cookieName = getDinerSessionCookieName(restaurant.id);
    const cookieToken = readCookieFromRequest(req, cookieName);
    // Prefer the device's HttpOnly cookie so client body tampering cannot probe another diner's session
    const rawCandidateToken = cookieToken || bodySessionToken || null;

    let existingSession: Awaited<ReturnType<typeof prisma.dinerSession.findUnique>> = null;
    let sessionToken = `ds_${crypto.randomBytes(16).toString('hex')}`;

    if (rawCandidateToken && typeof rawCandidateToken === 'string') {
      const found = await prisma.dinerSession.findUnique({
        where: { sessionToken: rawCandidateToken },
      });
      if (!found) {
        if (rawCandidateToken.startsWith('ds_')) {
          sessionToken = rawCandidateToken;
        }
      } else if (found.restaurantId === restaurant.id) {
        existingSession = found;
        sessionToken = found.sessionToken;
      }
    }

    const userAgent = req.headers.get('user-agent') || undefined;
    const clientIp =
      req.headers.get('x-forwarded-for')?.split(',')[0] ||
      req.headers.get('x-real-ip') ||
      '127.0.0.1';
    const ipHash = crypto.createHash('sha256').update(clientIp).digest('hex').substring(0, 16);

    // Case 1: Explicit QR scan / cryptographic table token provided in URL
    // Note: Raw database `tableId` UUIDs are NEVER trusted or resolved directly.
    if (qrTokenCandidate || attemptedRawTableId) {
      const resolved = qrTokenCandidate
        ? await resolveTableFromToken(restaurantSlug, qrTokenCandidate)
        : null;
      const resolvedTable = resolved?.table || null;

      if (!resolvedTable) {
        // Explicit QR token or raw tableId failed to resolve -> do not bind or keep stale table access
        const session = existingSession
          ? await prisma.dinerSession.update({
              where: { id: existingSession.id },
              data: { tableId: null },
            })
          : await prisma.dinerSession.create({
              data: {
                sessionToken,
                restaurantId: restaurant.id,
                tableId: null,
                userAgent,
                ipHash,
              },
            });

        const res = NextResponse.json({
          sessionId: session.id,
          sessionToken: session.sessionToken,
          restaurantId: restaurant.id,
          tableId: null,
          tableName: null,
          tableSection: null,
          tableCapacity: null,
          invalidTableToken: true,
          sessionExpired: false,
          timeoutMinutes: TABLE_SESSION_TIMEOUT_MINUTES,
          error: attemptedRawTableId
            ? 'Direct table selection via URL is not permitted. Please scan the current QR code on your table.'
            : 'This table QR code is invalid or has been rotated. Please scan the current QR code on your table.',
        });
        setSessionCookie(res, cookieName, session.sessionToken);
        return res;
      }

      const now = new Date();
      const session = existingSession
        ? await prisma.dinerSession.update({
            where: { id: existingSession.id },
            data: {
              lastActiveAt: now,
              tableId: resolvedTable.id,
              userAgent,
              ipHash,
            },
          })
        : await prisma.dinerSession.create({
            data: {
              sessionToken,
              restaurantId: restaurant.id,
              tableId: resolvedTable.id,
              lastActiveAt: now,
              userAgent,
              ipHash,
            },
          });

      await prisma.scanEvent.create({
        data: {
          restaurantId: restaurant.id,
          tableId: resolvedTable.id,
          sessionToken: session.sessionToken,
          userAgent,
          ipHash,
          timestamp: now,
        },
      });

      const expiresAt = new Date(now.getTime() + TABLE_SESSION_TIMEOUT_MS);
      const res = NextResponse.json({
        sessionId: session.id,
        sessionToken: session.sessionToken,
        restaurantId: restaurant.id,
        tableId: resolvedTable.id,
        tableName: resolvedTable.name,
        tableSection: resolvedTable.section,
        tableCapacity: resolvedTable.capacity,
        tableVerifiedAt: now.toISOString(),
        lastOrderAt: null,
        expiresAt: expiresAt.toISOString(),
        timeoutMinutes: TABLE_SESSION_TIMEOUT_MINUTES,
        sessionExpired: false,
      });
      setSessionCookie(res, cookieName, session.sessionToken);
      return res;
    }

    // Case 2: No table token passed (browse mode or page reload)
    // Never bump lastActiveAt or record a table scan on passive reloads.
    if (!existingSession) {
      const session = await prisma.dinerSession.create({
        data: {
          sessionToken,
          restaurantId: restaurant.id,
          tableId: null,
          userAgent,
          ipHash,
        },
      });

      await prisma.scanEvent.create({
        data: {
          restaurantId: restaurant.id,
          tableId: null,
          sessionToken: session.sessionToken,
          userAgent,
          ipHash,
        },
      });

      const res = NextResponse.json({
        sessionId: session.id,
        sessionToken: session.sessionToken,
        restaurantId: restaurant.id,
        tableId: null,
        tableName: null,
        tableSection: null,
        tableCapacity: null,
        sessionExpired: false,
        timeoutMinutes: TABLE_SESSION_TIMEOUT_MINUTES,
      });
      setSessionCookie(res, cookieName, session.sessionToken);
      return res;
    }

    if (existingSession.tableId) {
      const evaluation = await evaluateDeviceTableSession({
        restaurantId: restaurant.id,
        tableId: existingSession.tableId,
        sessionToken: existingSession.sessionToken,
      });

      if (evaluation.valid && evaluation.table) {
        const res = NextResponse.json({
          sessionId: existingSession.id,
          sessionToken: existingSession.sessionToken,
          restaurantId: restaurant.id,
          tableId: evaluation.table.id,
          tableName: evaluation.table.name,
          tableSection: evaluation.table.section,
          tableCapacity: evaluation.table.capacity,
          tableVerifiedAt: evaluation.lastScanAt?.toISOString() ?? null,
          lastOrderAt: evaluation.lastOrderAt?.toISOString() ?? null,
          expiresAt: evaluation.expiresAt?.toISOString() ?? null,
          timeoutMinutes: TABLE_SESSION_TIMEOUT_MINUTES,
          sessionExpired: false,
        });
        setSessionCookie(res, cookieName, existingSession.sessionToken);
        return res;
      }

      const res = NextResponse.json({
        sessionId: existingSession.id,
        sessionToken: existingSession.sessionToken,
        restaurantId: restaurant.id,
        tableId: null,
        tableName: null,
        tableSection: null,
        tableCapacity: null,
        sessionExpired: evaluation.code === 'TABLE_SCAN_EXPIRED',
        expiredTableName: evaluation.tableName || null,
        expiredAt: evaluation.expiredAt?.toISOString() ?? null,
        reason: evaluation.code,
        error: evaluation.error,
        timeoutMinutes: TABLE_SESSION_TIMEOUT_MINUTES,
      });
      setSessionCookie(res, cookieName, existingSession.sessionToken);
      return res;
    }

    const res = NextResponse.json({
      sessionId: existingSession.id,
      sessionToken: existingSession.sessionToken,
      restaurantId: restaurant.id,
      tableId: null,
      tableName: null,
      tableSection: null,
      tableCapacity: null,
      sessionExpired: false,
      timeoutMinutes: TABLE_SESSION_TIMEOUT_MINUTES,
    });
    setSessionCookie(res, cookieName, existingSession.sessionToken);
    return res;
  } catch (error: any) {
    console.error('Session init error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
