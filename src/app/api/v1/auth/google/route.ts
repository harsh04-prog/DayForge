import { NextResponse } from 'next/server';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request: Request) {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  if (!clientId) {
    return NextResponse.json(
      { detail: 'Google OAuth client ID is not configured on the server.' },
      {
        status: 500,
        headers: { 'Cache-Control': 'private, no-cache, no-store, max-age=0, must-revalidate' },
      }
    );
  }

  // Determine base URL dynamically or from environment
  const reqUrl = new URL(request.url);
  const configuredAppUrl = process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_APP_URL;
  const baseUrl = configuredAppUrl
    ? configuredAppUrl.replace(/\/$/, '')
    : `${reqUrl.protocol}//${reqUrl.host}`;

  const redirectUri = `${baseUrl}/api/v1/auth/google/callback`;
  const state = crypto.randomBytes(24).toString('hex');

  const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
  authUrl.searchParams.set('client_id', clientId);
  authUrl.searchParams.set('redirect_uri', redirectUri);
  authUrl.searchParams.set('response_type', 'code');
  authUrl.searchParams.set('scope', 'openid email profile');
  authUrl.searchParams.set('prompt', 'select_account');
  authUrl.searchParams.set('state', state);

  const response = NextResponse.redirect(authUrl.toString(), 302);
  const isProd = process.env.NODE_ENV === 'production';

  response.cookies.set('dayforge_oauth_state', state, {
    path: '/',
    httpOnly: true,
    sameSite: 'lax',
    secure: isProd,
    maxAge: 10 * 60, // 10 minutes
  });

  response.headers.set('Cache-Control', 'private, no-cache, no-store, max-age=0, must-revalidate');
  return response;
}
