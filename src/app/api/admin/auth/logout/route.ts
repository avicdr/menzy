import { NextResponse } from 'next/server';
import { clearAdminSessionCookie, getAdminSession, logAdminAction } from '@/lib/auth/admin-auth';

export async function POST() {
  const session = await getAdminSession();
  if (session) {
    await logAdminAction({
      adminEmail: session.email,
      action: 'ADMIN_LOGOUT',
      entityType: 'ADMIN_SESSION',
      entityId: session.email,
    });
  }
  await clearAdminSessionCookie();
  return NextResponse.json({ success: true });
}

