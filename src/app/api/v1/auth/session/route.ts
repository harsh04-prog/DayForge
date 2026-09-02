import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { db } from '@/lib/db';
import {
  getAuthUserFromRequest,
  setAuthCookies,
  createAccessToken,
  getUserVaultDataFromRequest,
  createUserDataVaultToken,
} from '@/lib/auth';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request: Request) {
  try {
    const authUser = getAuthUserFromRequest(request);
    if (!authUser) {
      return NextResponse.json(
        { detail: 'Unauthorized' },
        {
          status: 401,
          headers: { 'Cache-Control': 'private, no-cache, no-store, max-age=0, must-revalidate' },
        }
      );
    }

    // 1. Fetch user directly from Neon Postgres via Prisma
    let user = await prisma.user.findUnique({
      where: { id: authUser.userId },
      include: {
        profile: true,
        settings: true,
      },
    });

    if (!user) {
      // Check in-memory/vault fallback
      const localUser = db.getUserById(authUser.userId);
      if (localUser) {
        user = {
          id: localUser.id,
          email: localUser.email,
          username: localUser.username,
          full_name: localUser.full_name,
          hashed_password: localUser.hashed_password,
          google_id: null,
          avatar_url: 'male_1',
          is_active: localUser.is_active,
          is_onboarded: localUser.is_onboarded,
          created_at: new Date(localUser.created_at),
          updated_at: new Date(),
          profile: db.getProfileByUserId(localUser.id) as any,
          settings: db.getSettingsByUserId(localUser.id) as any,
        };
      }
    }

    if (!user || !user.is_active) {
      const response = NextResponse.json(
        { detail: 'User not found or inactive' },
        {
          status: 401,
          headers: { 'Cache-Control': 'private, no-cache, no-store, max-age=0, must-revalidate' },
        }
      );
      response.cookies.set('dayforge_session', '', { path: '/', maxAge: 0 });
      return response;
    }

    const profile = user.profile || db.getProfileByUserId(user.id);
    const settings = user.settings || db.getSettingsByUserId(user.id);
    const refreshedToken = createAccessToken(user, '30d');

    const latestVaultData = db.getUserVaultData(user.id);
    const vaultToken = createUserDataVaultToken(latestVaultData);

    const res = NextResponse.json({
      id: user.id,
      email: user.email,
      username: user.username,
      full_name: user.full_name,
      is_active: user.is_active,
      is_onboarded: user.is_onboarded,
      created_at: user.created_at.toISOString(),
      profile,
      settings,
      access_token: refreshedToken,
      vault_token: vaultToken,
    });

    res.headers.set('x-dayforge-vault-token', vaultToken);
    res.headers.set('Cache-Control', 'private, no-cache, no-store, max-age=0, must-revalidate');

    return setAuthCookies(res, refreshedToken, {
      id: user.id,
      email: user.email,
      username: user.username,
      full_name: user.full_name,
      hashed_password: user.hashed_password || '',
      is_active: user.is_active,
      is_onboarded: user.is_onboarded,
      created_at: user.created_at.toISOString(),
    });
  } catch (error: any) {
    console.error('Session retrieval error:', error);
    return NextResponse.json(
      { detail: error.message || 'Failed to retrieve session' },
      {
        status: 500,
        headers: { 'Cache-Control': 'private, no-cache, no-store, max-age=0, must-revalidate' },
      }
    );
  }
}
