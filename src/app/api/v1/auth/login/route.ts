import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifyPassword, createAccessToken } from '@/lib/auth';

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

    const user = db.getUserByEmail(email.trim().toLowerCase());
    if (!user) {
      return NextResponse.json(
        { detail: 'Incorrect email or password. Please try again.' },
        { status: 401 }
      );
    }

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
    const accessToken = createAccessToken(user.id, expiresIn);

    return NextResponse.json({
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
  } catch (error: any) {
    console.error('Login API error:', error);
    return NextResponse.json(
      { detail: 'Server login error. Please try again.' },
      { status: 500 }
    );
  }
}
