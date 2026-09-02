import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { db } from '@/lib/db';
import { createAccessToken, createVaultToken, setAuthCookies, parseCookies } from '@/lib/auth';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request: Request) {
  const reqUrl = new URL(request.url);
  const code = reqUrl.searchParams.get('code');
  const state = reqUrl.searchParams.get('state');
  const error = reqUrl.searchParams.get('error');

  const configuredAppUrl = process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_APP_URL;
  const baseUrl = configuredAppUrl
    ? configuredAppUrl.replace(/\/$/, '')
    : `${reqUrl.protocol}//${reqUrl.host}`;

  if (error || !code) {
    console.error('Google OAuth error:', error || 'No code provided');
    return NextResponse.redirect(`${baseUrl}/login?error=${encodeURIComponent(error || 'Google sign-in was cancelled.')}`, 302);
  }

  const cookies = parseCookies(request);
  const savedState = cookies.dayforge_oauth_state;

  if (savedState && state && savedState !== state) {
    console.warn('OAuth state mismatch warning');
  }

  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    console.error('Google OAuth client credentials not set');
    return NextResponse.redirect(`${baseUrl}/login?error=oauth_credentials_missing`, 302);
  }

  const redirectUri = `${baseUrl}/api/v1/auth/google/callback`;

  try {
    // 1. Exchange code for tokens with Google
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }),
    });

    if (!tokenRes.ok) {
      const errText = await tokenRes.text();
      console.error('Failed to exchange code for token:', errText);
      return NextResponse.redirect(`${baseUrl}/login?error=token_exchange_failed`, 302);
    }

    const tokenData = await tokenRes.json();
    const accessToken = tokenData.access_token;

    // 2. Fetch Google User Profile
    const profileRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!profileRes.ok) {
      console.error('Failed to fetch Google profile');
      return NextResponse.redirect(`${baseUrl}/login?error=profile_fetch_failed`, 302);
    }

    const googleUser = await profileRes.json();
    const email = (googleUser.email || '').toLowerCase().trim();
    const fullName = googleUser.name || googleUser.given_name || 'Hero';
    const avatarUrl = googleUser.picture || 'male_1';
    const googleId = googleUser.sub;

    if (!email) {
      return NextResponse.redirect(`${baseUrl}/login?error=email_not_provided_by_google`, 302);
    }

    // 3. Find or Create User directly in Postgres via Prisma
    let user = await prisma.user.findUnique({
      where: { email },
      include: { profile: true, settings: true },
    });

    if (!user) {
      const baseUsername = email.split('@')[0].replace(/[^a-zA-Z0-9_]/g, '').toLowerCase() || 'user';
      let uniqueUsername = baseUsername;
      let counter = 1;
      while (await prisma.user.findUnique({ where: { username: uniqueUsername } })) {
        uniqueUsername = `${baseUsername}${counter}`;
        counter++;
      }

      user = await prisma.user.create({
        data: {
          email,
          username: uniqueUsername,
          full_name: fullName,
          google_id: googleId,
          avatar_url: avatarUrl,
          is_active: true,
          is_onboarded: true,
          profile: {
            create: {
              avatar_url: avatarUrl,
              bio: 'Forging habits one day at a time.',
              level: 1,
              xp: 0,
            },
          },
          settings: {
            create: {},
          },
        },
        include: {
          profile: true,
          settings: true,
        },
      });
    } else {
      if (avatarUrl && (!user.avatar_url || user.avatar_url === 'male_1')) {
        await prisma.user.update({
          where: { id: user.id },
          data: { avatar_url: avatarUrl },
        }).catch(() => null);
      }
    }

    // Sync in-memory store
    db.syncUserFromVault({
      id: user.id,
      email: user.email,
      username: user.username,
      full_name: user.full_name,
      hashed_password: user.hashed_password || '',
      is_active: user.is_active,
      is_onboarded: user.is_onboarded,
      created_at: user.created_at.toISOString(),
    });

    const jwtToken = createAccessToken(user, '30d');

    // 4. Redirect to home with secure, isolated session cookies
    const response = NextResponse.redirect(`${baseUrl}/?auth=success`, 302);
    response.headers.set('Cache-Control', 'private, no-cache, no-store, max-age=0, must-revalidate');

    // Clear oauth state cookie
    response.cookies.set('dayforge_oauth_state', '', { path: '/', maxAge: 0 });

    return setAuthCookies(response, jwtToken, {
      id: user.id,
      email: user.email,
      username: user.username,
      full_name: user.full_name,
      hashed_password: user.hashed_password || '',
      is_active: user.is_active,
      is_onboarded: user.is_onboarded,
      created_at: user.created_at.toISOString(),
    });
  } catch (err: any) {
    console.error('Google OAuth callback error:', err);
    return NextResponse.redirect(`${baseUrl}/login?error=${encodeURIComponent(err.message || 'Authentication error')}`, 302);
  }
}
