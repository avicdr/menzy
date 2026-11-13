import { NextResponse } from 'next/server';
import { verifyAdminPassword, createAdminToken, setAdminSessionCookie, logAdminAction } from '@/lib/auth/admin-auth';
import { checkLoginRateLimit } from '@/lib/auth/login-rate-limit';

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => null);
    if (!body || typeof body !== 'object') {
      return NextResponse.json({ error: 'A valid JSON request body is required.' }, { status: 400 });
    }
    const { email, password } = body as Record<string, unknown>;
    const adminEmail = process.env.ADMIN_EMAIL || 'founder@menzy.app';

    if (typeof email !== 'string' || typeof password !== 'string' || !email || !password) {
      return NextResponse.json({ error: 'Email and password required' }, { status: 400 });
    }

    const rate = await checkLoginRateLimit(req, 'admin', email, 5);
    if (!rate.allowed) {
      return NextResponse.json(
        { error: 'Too many login attempts. Please try again later.' },
        { status: 429, headers: { 'Retry-After': String(rate.retryAfterSeconds) } }
      );
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
