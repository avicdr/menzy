import { NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import crypto from 'crypto';
import { resolveTableFromToken } from '@/lib/tables/table-service';
import {
  evaluateDeviceTableSession,
  getDinerSessionCookieName,
  readCookieFromRequest,
} from '@/lib/diner/table-session';
import { extractTableSessionConfig } from '@/lib/diner/table-session-config';
import {
  createSubscriptionExpiredResponse,
  evaluateOrganizationAccess,
} from '@/lib/billing/subscription-access';

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
    const body = await req.json().catch(() => null);
    if (!body || typeof body !== 'object') {
      return NextResponse.json({ error: 'A valid JSON request body is required.' }, { status: 400 });
    }
    const {
      restaurantSlug,
      tableToken,
      t,
      tableId,
      sessionToken: bodySessionToken,
    } = body as Record<string, unknown>;

    if (typeof restaurantSlug !== 'string' || !restaurantSlug.trim()) {
      return NextResponse.json({ error: 'Restaurant slug is required.' }, { status: 400 });
    }

    const normalizedRestaurantSlug = restaurantSlug.trim();

    const qrTokenCandidate =
      typeof t === 'string' && t.trim()
        ? t.trim()
        : typeof tableToken === 'string' && tableToken.trim()
          ? tableToken.trim()
          : '';
    const attemptedRawTableId =
      !qrTokenCandidate && typeof tableId === 'string' && tableId.trim().length > 0;

    const bodySessionStr =
      typeof bodySessionToken === 'string' && bodySessionToken.trim()
        ? bodySessionToken.trim()
        : null;

    const nowCheck = new Date();
    const [restaurant, prefetchedResolvedTable, bodySessionRecord] = await Promise.all([
      prisma.restaurant.findUnique({
        where: { slug: normalizedRestaurantSlug },
        select: {
          id: true,
          slug: true,
          displayName: true,
          isClaimed: true,
          organizationId: true,
          orderingSettings: {
            select: { notificationSettings: true },
          },
          organization: {
            select: {
              subscriptions: {
                take: 1,
                select: {
                  planKey: true,
                  status: true,
                  provider: true,
                  billingPeriod: true,
                  paidThrough: true,
                  cancelAtPeriodEnd: true,
                  createdAt: true,
                },
              },
              entitlements: {
                where: {
                  isActive: true,
                  expirationDate: { gt: nowCheck },
                },
                select: {
                  grantType: true,
                  tierOrValue: true,
                  isActive: true,
                  expirationDate: true,
                },
              },
            },
          },
        },
      }),
      qrTokenCandidate
        ? resolveTableFromToken(normalizedRestaurantSlug, qrTokenCandidate)
        : Promise.resolve(null),
      bodySessionStr
        ? prisma.dinerSession.findUnique({
            where: { sessionToken: bodySessionStr },
          })
        : Promise.resolve(null),
    ]);

    if (!restaurant) {
      return NextResponse.json({ error: 'Restaurant not found' }, { status: 404 });
    }

    const subAccess = evaluateOrganizationAccess({
      organizationId: restaurant.organizationId,
      isClaimed: restaurant.isClaimed,
      subscription: restaurant.organization?.subscriptions?.[0] ?? null,
      activeGrants: restaurant.organization?.entitlements ?? [],
      now: nowCheck,
    });
    if (!subAccess.allowed) {
      return createSubscriptionExpiredResponse(subAccess, {
        restaurantId: restaurant.id,
        restaurantSlug: restaurant.slug,
        restaurantName: restaurant.displayName,
        audience: 'DINER',
      });
    }

    const sessionConfig = extractTableSessionConfig(
      restaurant.orderingSettings?.notificationSettings
    );
    const scanTimeoutMs = sessionConfig.scanTimeoutMinutes * 60 * 1000;

    const cookieName = getDinerSessionCookieName(restaurant.id);
    const cookieToken = readCookieFromRequest(req, cookieName);
    // Prefer the device's HttpOnly cookie so client body tampering cannot probe another diner's session
    const rawCandidateToken = cookieToken || bodySessionStr || null;

    let existingSession: Awaited<ReturnType<typeof prisma.dinerSession.findUnique>> = null;
    let sessionToken = `ds_${crypto.randomBytes(16).toString('hex')}`;

    const foundSession =
      cookieToken && cookieToken !== bodySessionStr
        ? await prisma.dinerSession.findUnique({
            where: { sessionToken: cookieToken },
          })
        : rawCandidateToken && rawCandidateToken === bodySessionStr
          ? bodySessionRecord
          : null;

    if (rawCandidateToken && typeof rawCandidateToken === 'string') {
      if (!foundSession) {
        if (rawCandidateToken.startsWith('ds_')) {
          sessionToken = rawCandidateToken;
        }
      } else if (foundSession.restaurantId === restaurant.id) {
        existingSession = foundSession;
        sessionToken = foundSession.sessionToken;
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
      const resolvedTable = prefetchedResolvedTable?.table || null;

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
          timeoutMinutes: sessionConfig.scanTimeoutMinutes,
          timeoutKind: 'SCAN',
          scanTimeoutMinutes: sessionConfig.scanTimeoutMinutes,
          orderExtensionMinutes: sessionConfig.orderExtensionMinutes,
          error: attemptedRawTableId
            ? 'Direct table selection via URL is not permitted. Please scan the current QR code on your table.'
            : 'This table QR code is invalid or has been rotated. Please scan the current QR code on your table.',
        });
        setSessionCookie(res, cookieName, session.sessionToken);
        return res;
      }

      const now = new Date();
      const [session] = await Promise.all([
        existingSession
          ? prisma.dinerSession.update({
              where: { id: existingSession.id },
              data: {
                lastActiveAt: now,
                tableId: resolvedTable.id,
                userAgent,
                ipHash,
              },
            })
          : prisma.dinerSession.create({
              data: {
                sessionToken,
                restaurantId: restaurant.id,
                tableId: resolvedTable.id,
                lastActiveAt: now,
                userAgent,
                ipHash,
              },
            }),
        prisma.scanEvent.create({
          data: {
            restaurantId: restaurant.id,
            tableId: resolvedTable.id,
            sessionToken,
            userAgent,
            ipHash,
            timestamp: now,
          },
        }),
      ]);

      const expiresAt = new Date(now.getTime() + scanTimeoutMs);
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
        timeoutMinutes: sessionConfig.scanTimeoutMinutes,
        timeoutKind: 'SCAN',
        scanTimeoutMinutes: sessionConfig.scanTimeoutMinutes,
        orderExtensionMinutes: sessionConfig.orderExtensionMinutes,
        sessionExpired: false,
      });
      setSessionCookie(res, cookieName, session.sessionToken);
      return res;
    }

    // Case 2: No table token passed (browse mode or page reload)
    // Never bump lastActiveAt or record a table scan on passive reloads.
    if (!existingSession) {
      const [session] = await Promise.all([
        prisma.dinerSession.create({
          data: {
            sessionToken,
            restaurantId: restaurant.id,
            tableId: null,
            userAgent,
            ipHash,
          },
        }),
        prisma.scanEvent.create({
          data: {
            restaurantId: restaurant.id,
            tableId: null,
            sessionToken,
            userAgent,
            ipHash,
          },
        }),
      ]);

      const res = NextResponse.json({
        sessionId: session.id,
        sessionToken: session.sessionToken,
        restaurantId: restaurant.id,
        tableId: null,
        tableName: null,
        tableSection: null,
        tableCapacity: null,
        sessionExpired: false,
        timeoutMinutes: sessionConfig.scanTimeoutMinutes,
        timeoutKind: 'SCAN',
        scanTimeoutMinutes: sessionConfig.scanTimeoutMinutes,
        orderExtensionMinutes: sessionConfig.orderExtensionMinutes,
      });
      setSessionCookie(res, cookieName, session.sessionToken);
      return res;
    }

    if (existingSession.tableId) {
      const evaluation = await evaluateDeviceTableSession({
        restaurantId: restaurant.id,
        tableId: existingSession.tableId,
        sessionToken: existingSession.sessionToken,
        scanTimeoutMinutes: sessionConfig.scanTimeoutMinutes,
        orderExtensionMinutes: sessionConfig.orderExtensionMinutes,
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
          timeoutMinutes: evaluation.timeoutMinutes ?? sessionConfig.scanTimeoutMinutes,
          timeoutKind: evaluation.timeoutKind ?? 'SCAN',
          scanTimeoutMinutes: evaluation.scanTimeoutMinutes ?? sessionConfig.scanTimeoutMinutes,
          orderExtensionMinutes:
            evaluation.orderExtensionMinutes ?? sessionConfig.orderExtensionMinutes,
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
        timeoutMinutes: evaluation.timeoutMinutes ?? sessionConfig.scanTimeoutMinutes,
        timeoutKind: evaluation.timeoutKind ?? 'SCAN',
        scanTimeoutMinutes: evaluation.scanTimeoutMinutes ?? sessionConfig.scanTimeoutMinutes,
        orderExtensionMinutes:
          evaluation.orderExtensionMinutes ?? sessionConfig.orderExtensionMinutes,
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
      timeoutMinutes: sessionConfig.scanTimeoutMinutes,
      timeoutKind: 'SCAN',
      scanTimeoutMinutes: sessionConfig.scanTimeoutMinutes,
      orderExtensionMinutes: sessionConfig.orderExtensionMinutes,
    });
    setSessionCookie(res, cookieName, existingSession.sessionToken);
    return res;
  } catch (error: any) {
    console.error('Session init error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
