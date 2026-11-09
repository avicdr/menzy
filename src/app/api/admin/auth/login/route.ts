import { NextResponse } from 'next/server';
import { verifyAdminPassword, createAdminToken, setAdminSessionCookie, logAdminAction } from '@/lib/auth/admin-auth';

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();
    const adminEmail = process.env.ADMIN_EMAIL || 'founder@dishora.app';

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password required' }, { status: 400 });
    }

    if (email.toLowerCase() !== adminEmail.toLowerCase()) {
      return NextResponse.json({ error: 'Invalid admin credentials' }, { status: 401 });
    }

    const isValid = verifyAdminPassword(password);
    if (!isValid) {
      return NextResponse.json({ error: 'Invalid admin credentials' }, { status: 401 });
    }

    const token = createAdminToken(adminEmail);
    await setAdminSessionCookie(token);

    await logAdminAction({
      adminEmail,
      action: 'ADMIN_LOGIN',
      entityType: 'ADMIN_SESSION',
      entityId: adminEmail,
      reason: 'Founder authenticated into super-admin portal',
    });

    return NextResponse.json({ success: true, email: adminEmail });
  } catch (error: any) {
    console.error('Admin login error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

