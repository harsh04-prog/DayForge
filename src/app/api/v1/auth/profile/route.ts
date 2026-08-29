import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getUserIdFromRequest } from '@/lib/auth';

export async function PUT(request: Request) {
  const userId = getUserIdFromRequest(request);
  if (!userId) {
    return NextResponse.json({ detail: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { full_name, avatar_url, bio, primary_goal, focus_areas } = body;

    if (full_name) {
      db.updateUser(userId, { full_name: full_name.trim() });
    }

    const updatedProfile = db.updateProfile(userId, {
      avatar_url: avatar_url !== undefined ? avatar_url : undefined,
      bio: bio !== undefined ? bio : undefined,
      primary_goal: primary_goal !== undefined ? primary_goal : undefined,
      focus_areas: focus_areas !== undefined ? (Array.isArray(focus_areas) ? focus_areas.join(',') : focus_areas) : undefined,
    });

    const user = db.getUserById(userId);
    const settings = db.getSettingsByUserId(userId);

    return NextResponse.json({
      id: user?.id,
      email: user?.email,
      username: user?.username,
      full_name: user?.full_name,
      is_active: user?.is_active,
      is_onboarded: user?.is_onboarded,
      created_at: user?.created_at,
      profile: updatedProfile,
      settings,
    });
  } catch (error: any) {
    console.error('Update profile error:', error);
    return NextResponse.json({ detail: 'Failed to update profile.' }, { status: 500 });
  }
}
