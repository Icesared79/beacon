import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

// Test credentials — replace with Supabase Auth once GoTrue is restored
const USERS: Record<string, { password: string; name: string; role: string }> = {
  'paul@redplanetdata.com': { password: 'beacon2026', name: 'Paul Daswani', role: 'admin' },
  'demo@consumercredit.com': { password: 'beacon2026', name: 'Demo Counselor', role: 'counselor' },
};

function makeToken(email: string): string {
  const secret = process.env.NEXTAUTH_SECRET || 'beacon_secret_2026';
  return crypto
    .createHmac('sha256', secret)
    .update(email + '|' + Math.floor(Date.now() / 86400000))
    .digest('hex');
}

export async function POST(request: NextRequest) {
  const { email, password } = await request.json();

  const user = USERS[email?.toLowerCase()];
  if (!user || user.password !== password) {
    return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
  }

  const token = makeToken(email);
  const res = NextResponse.json({
    ok: true,
    user: { email, name: user.name, role: user.role },
  });

  res.cookies.set('beacon_session', `${email}|${token}`, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 7, // 7 days
  });

  return res;
}

export async function DELETE() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set('beacon_session', '', { path: '/', maxAge: 0 });
  return res;
}
