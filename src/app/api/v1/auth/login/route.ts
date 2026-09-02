import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { db } from '@/lib/db';
import {
  verifyPassword,
  createAccessToken,
  createVaultToken,
  setAuthCookies,
} from '@/lib/auth';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password, remember_me } = body;

    if (!email || !password) {
      return NextResponse.json(
        { detail: 'Please enter both your email address and password.' },
        {
          status: 400,
          headers: { 'Cache-Control': 'private, no-cache, no-store, max-age=0, must-revalidate' },
        }
      );
    }

    const cleanIdentifier = email.trim().toLowerCase();

    // 1. Query user directly from Neon Postgres via Prisma
    let user = await prisma.user.findFirst({
      where: {
        OR: [
          { email: cleanIdentifier },
          { username: cleanIdentifier },
        ],
      },
      include: {
        profile: true,
        settings: true,
      },
    });

    // 2. Fallback check from in-memory store if DB was just synced
    if (!user) {
      const localUser = db.getUserByEmail(cleanIdentifier) || db.getUserByUsername(cleanIdentifier);
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

    if (!user || !user.hashed_password) {
      return NextResponse.json(
        { detail: 'Incorrect email or password. Please try again.' },
        {
          status: 401,
          headers: { 'Cache-Control': 'private, no-cache, no-store, max-age=0, must-revalidate' },
        }
      );
    }

    // 3. Verify password with bcrypt
    const isValid = await verifyPassword(password, user.hashed_password);
    if (!isValid) {
      return NextResponse.json(
        { detail: 'Incorrect email or password. Please try again.' },
        {
          status: 401,
          headers: { 'Cache-Control': 'private, no-cache, no-store, max-age=0, must-revalidate' },
        }
      );
    }

    if (!user.is_active) {
      return NextResponse.json(
        { detail: 'This account has been deactivated.' },
        {
          status: 403,
          headers: { 'Cache-Control': 'private, no-cache, no-store, max-age=0, must-revalidate' },
        }
      );
    }

    const expiresIn = remember_me ? '30d' : '7d';
    const accessToken = createAccessToken(user, expiresIn);
    const userVaultToken = createVaultToken({
      id: user.id,
      email: user.email,
      username: user.username,
      full_name: user.full_name,
      hashed_password: user.hashed_password,
      is_active: user.is_active,
      is_onboarded: user.is_onboarded,
      created_at: user.created_at.toISOString(),
    });

    // Also mirror into local db
    db.syncUserFromVault({
      id: user.id,
      email: user.email,
      username: user.username,
      full_name: user.full_name,
      hashed_password: user.hashed_password,
      is_active: user.is_active,
      is_onboarded: user.is_onboarded,
      created_at: user.created_at.toISOString(),
    });

    const res = NextResponse.json({
      access_token: accessToken,
      vault_token: userVaultToken,
      token_type: 'bearer',
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        full_name: user.full_name,
        is_active: user.is_active,
        is_onboarded: user.is_onboarded,
        created_at: user.created_at.toISOString(),
        profile: user.profile,
        settings: user.settings,
      },
    });

    res.headers.set('Cache-Control', 'private, no-cache, no-store, max-age=0, must-revalidate');

    return setAuthCookies(res, accessToken, {
      id: user.id,
      email: user.email,
      username: user.username,
      full_name: user.full_name,
      hashed_password: user.hashed_password,
      is_active: user.is_active,
      is_onboarded: user.is_onboarded,
      created_at: user.created_at.toISOString(),
    });
  } catch (error: any) {
    console.error('Login API error:', error);
    return NextResponse.json(
      { detail: error.message || 'Server login error. Please try again.' },
      {
        status: 500,
        headers: { 'Cache-Control': 'private, no-cache, no-store, max-age=0, must-revalidate' },
      }
    );
  }
}
