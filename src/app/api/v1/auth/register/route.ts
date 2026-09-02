import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { db } from '@/lib/db';
import { hashPassword, createAccessToken, createVaultToken, setAuthCookies } from '@/lib/auth';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, username, full_name, password, avatar_url } = body;

    if (!email || !password || !username || !full_name) {
      return NextResponse.json(
        { detail: 'Please fill in all required registration fields.' },
        {
          status: 400,
          headers: { 'Cache-Control': 'private, no-cache, no-store, max-age=0, must-revalidate' },
        }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { detail: 'Password must be at least 8 characters long.' },
        {
          status: 400,
          headers: { 'Cache-Control': 'private, no-cache, no-store, max-age=0, must-revalidate' },
        }
      );
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanUsername = username.trim().toLowerCase();

    // 1. Check uniqueness directly in Postgres via Prisma
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [{ email: cleanEmail }, { username: cleanUsername }],
      },
    });

    if (existingUser) {
      if (existingUser.email.toLowerCase() === cleanEmail) {
        return NextResponse.json(
          { detail: 'An account with this email already exists.' },
          {
            status: 400,
            headers: { 'Cache-Control': 'private, no-cache, no-store, max-age=0, must-revalidate' },
          }
        );
      }
      return NextResponse.json(
        { detail: 'This username is already taken. Please choose another.' },
        {
          status: 400,
          headers: { 'Cache-Control': 'private, no-cache, no-store, max-age=0, must-revalidate' },
        }
      );
    }

    const hashedPassword = await hashPassword(password);
    const chosenAvatar = avatar_url || 'male_1';

    // 2. Create User, Profile, and Settings in Postgres via Prisma
    const newUser = await prisma.user.create({
      data: {
        email: cleanEmail,
        username: cleanUsername,
        full_name: full_name.trim(),
        hashed_password: hashedPassword,
        avatar_url: chosenAvatar,
        is_active: true,
        is_onboarded: false,
        profile: {
          create: {
            avatar_url: chosenAvatar,
            bio: 'Forging habits one day at a time.',
            level: 1,
            xp: 0,
            current_streak: 0,
            longest_streak: 0,
            total_habits_completed: 0,
            overall_consistency: 0,
            available_shields: 2,
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

    // Also mirror into in-memory db for backward compatibility
    db.syncUserFromVault({
      id: newUser.id,
      email: newUser.email,
      username: newUser.username,
      full_name: newUser.full_name,
      hashed_password: newUser.hashed_password || '',
      is_active: newUser.is_active,
      is_onboarded: newUser.is_onboarded,
      created_at: newUser.created_at.toISOString(),
    });

    const accessToken = createAccessToken(newUser, '30d');
    const vaultToken = createVaultToken({
      id: newUser.id,
      email: newUser.email,
      username: newUser.username,
      full_name: newUser.full_name,
      hashed_password: newUser.hashed_password || '',
      is_active: newUser.is_active,
      is_onboarded: newUser.is_onboarded,
      created_at: newUser.created_at.toISOString(),
    });

    const res = NextResponse.json({
      access_token: accessToken,
      vault_token: vaultToken,
      token_type: 'bearer',
      user: {
        id: newUser.id,
        email: newUser.email,
        username: newUser.username,
        full_name: newUser.full_name,
        is_active: newUser.is_active,
        is_onboarded: newUser.is_onboarded,
        created_at: newUser.created_at.toISOString(),
        profile: newUser.profile,
        settings: newUser.settings,
      },
    });

    res.headers.set('Cache-Control', 'private, no-cache, no-store, max-age=0, must-revalidate');

    return setAuthCookies(res, accessToken, {
      id: newUser.id,
      email: newUser.email,
      username: newUser.username,
      full_name: newUser.full_name,
      hashed_password: newUser.hashed_password || '',
      is_active: newUser.is_active,
      is_onboarded: newUser.is_onboarded,
      created_at: newUser.created_at.toISOString(),
    });
  } catch (error: any) {
    console.error('Registration API error:', error);
    return NextResponse.json(
      { detail: error.message || 'Server registration error. Please try again.' },
      {
        status: 500,
        headers: { 'Cache-Control': 'private, no-cache, no-store, max-age=0, must-revalidate' },
      }
    );
  }
}
