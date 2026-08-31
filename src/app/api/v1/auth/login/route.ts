import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifyPassword, createAccessToken, getVaultFromRequest, setAuthCookies } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password, remember_me } = body;

    if (!email || !password) {
      return NextResponse.json(
        { detail: 'Please enter both your email address and password.' },
        { status: 400 }
      );
    }

    const cleanIdentifier = email.trim().toLowerCase();

    // 1. Check local instance DB
    let user = db.getUserByEmail(cleanIdentifier) || db.getUserByUsername(cleanIdentifier);

    // 2. If cold container has not seen this user yet, check signed vault cookie
    if (!user) {
      const vault = getVaultFromRequest(request);
      if (
        vault &&
        (vault.email.toLowerCase() === cleanIdentifier || vault.username.toLowerCase() === cleanIdentifier)
      ) {
        user = db.syncUserFromVault(vault);
      }
    }

    if (!user) {
      return NextResponse.json(
        { detail: 'Incorrect email or password. Please try again.' },
        { status: 401 }
      );
    }

    // 3. Verify password with bcrypt
    const isValid = await verifyPassword(password, user.hashed_password);
    if (!isValid) {
      return NextResponse.json(
        { detail: 'Incorrect email or password. Please try again.' },
        { status: 401 }
      );
    }

    if (!user.is_active) {
      return NextResponse.json(
        { detail: 'This account has been deactivated.' },
        { status: 403 }
      );
    }

    const profile = db.getProfileByUserId(user.id);
    const settings = db.getSettingsByUserId(user.id);
    const expiresIn = remember_me ? '30d' : '7d';
    const accessToken = createAccessToken(user, expiresIn);

    const res = NextResponse.json({
      access_token: accessToken,
      token_type: 'bearer',
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        full_name: user.full_name,
        is_active: user.is_active,
        is_onboarded: user.is_onboarded,
        created_at: user.created_at,
        profile,
        settings,
      },
    });

    // Set secure authentication and recovery cookies
    return setAuthCookies(res, accessToken, {
      id: user.id,
      email: user.email,
      username: user.username,
      full_name: user.full_name,
      hashed_password: user.hashed_password,
      is_active: user.is_active,
      is_onboarded: user.is_onboarded,
      created_at: user.created_at,
    });
  } catch (error: any) {
    console.error('Login API error:', error);
    return NextResponse.json(
      { detail: error.message || 'Server login error. Please try again.' },
      { status: 500 }
    );
  }
}
