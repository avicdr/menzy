import { NextResponse } from 'next/server';
import { clearStaffSessionCookie } from '@/lib/auth/staff-auth';

export async function POST() {
  await clearStaffSessionCookie();
  return NextResponse.json({ success: true, message: 'Logged out successfully.' });
}

