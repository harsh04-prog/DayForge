import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { hashPassword, createAccessToken } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, username, full_name, password, avatar_url } = body;

    if (!email || !password || !username || !full_name) {
      return NextResponse.json(
        { detail: 'Please fill in all required registration fields.' },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { detail: 'Password must be at least 8 characters long.' },
        { status: 400 }
      );
    }

    // Check email uniqueness
    const existingEmail = db.getUserByEmail(email);
    if (existingEmail) {
      return NextResponse.json(
        { detail: 'An account with this email already exists.' },
        { status: 400 }
      );
    }

    // Check username uniqueness
    const existingUsername = db.getUserByUsername(username);
    if (existingUsername) {
      return NextResponse.json(
        { detail: 'This username is already taken. Please choose another.' },
        { status: 400 }
      );
    }

    const hashedPassword = await hashPassword(password);

    // Create user
    const newUser = db.createUser({
      email: email.trim().toLowerCase(),
      username: username.trim().toLowerCase(),
      full_name: full_name.trim(),
      hashed_password: hashedPassword,
      is_active: true,
      is_onboarded: false,
    });

    // Create profile
    const profile = db.createProfile({
      user_id: newUser.id,
      avatar_url: avatar_url || null,
      bio: null,
      level: 1,
      xp: 0,
      current_streak: 0,
      longest_streak: 0,
      total_habits_completed: 0,
      overall_consistency: 0,
      available_shields: 2,
      primary_goal: null,
      focus_areas: null,
    });

    // Create user settings
    const settings = db.createSettings({
      user_id: newUser.id,
      habit_reminders: true,
      streak_reminders: true,
      wellness_reminders: true,
      progress_reminders: true,
      motivational_messages: true,
      weekly_review: true,
      challenge_notifications: true,
      max_daily_reminders: 12,
      sound_enabled: true,
      sound_type: 'soft',
      quiet_hours_enabled: true,
      quiet_hours_start: '23:00',
      quiet_hours_end: '07:00',
      theme: 'light',
      week_start_day: 'monday',
      time_format: '12h',
      preferred_units: 'metric',
      profile_visibility: 'private',
    });

    const accessToken = createAccessToken(newUser.id);

    return NextResponse.json({
      access_token: accessToken,
      token_type: 'bearer',
      user: {
        id: newUser.id,
        email: newUser.email,
        username: newUser.username,
        full_name: newUser.full_name,
        is_active: newUser.is_active,
        is_onboarded: newUser.is_onboarded,
        created_at: newUser.created_at,
        profile,
        settings,
      },
    });
  } catch (error: any) {
    console.error('Registration API error:', error);
    return NextResponse.json(
      { detail: 'Server registration error. Please try again.' },
      { status: 500 }
    );
  }
}
