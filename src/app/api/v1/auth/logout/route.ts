import { NextResponse } from 'next/server';

export async function POST() {
  const isProd = process.env.NODE_ENV === 'production';
  const res = NextResponse.json({ success: true, message: 'Logged out successfully' });
  
  // Invalidate active session cookie only, keep vault for seamless re-login
  res.cookies.set('dayforge_session', '', {
    path: '/',
    httpOnly: true,
    sameSite: 'lax',
    secure: isProd,
    maxAge: 0,
  });

  return res;
}
