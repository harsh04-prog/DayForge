import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getUserIdFromRequest } from '@/lib/auth';

export async function GET(request: Request) {
  const userId = getUserIdFromRequest(request);
  if (!userId) {
    return NextResponse.json({ detail: 'Unauthorized' }, { status: 401 });
  }

  const user = db.getUserById(userId);
  if (!user || !user.is_active) {
    return NextResponse.json({ detail: 'User not found or inactive' }, { status: 401 });
  }

  const profile = db.getProfileByUserId(userId);
  const settings = db.getSettingsByUserId(userId);

  return NextResponse.json({
    id: user.id,
    email: user.email,
    username: user.username,
    full_name: user.full_name,
    is_active: user.is_active,
    is_onboarded: user.is_onboarded,
    created_at: user.created_at,
    profile,
    settings,
  });
}
