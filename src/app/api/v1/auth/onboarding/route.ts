import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getUserIdFromRequest } from '@/lib/auth';

export async function POST(request: Request) {
  const userId = getUserIdFromRequest(request);
  if (!userId) {
    return NextResponse.json({ detail: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { primary_goal, focus_areas, starter_habits } = body;

    // Update profile
    db.updateProfile(userId, {
      primary_goal: primary_goal || null,
      focus_areas: Array.isArray(focus_areas) ? focus_areas.join(',') : focus_areas || null,
    });

    // Mark user as onboarded
    db.updateUser(userId, { is_onboarded: true });

    // Create starter habits if provided
    if (Array.isArray(starter_habits) && starter_habits.length > 0) {
      starter_habits.forEach((sh: any, index: number) => {
        db.createHabit({
          user_id: userId,
          title: sh.title || 'Morning Habit',
          description: sh.description || null,
          category: sh.category || 'health',
          color: sh.color || '#6C5CE7',
          icon: sh.icon || 'activity',
          frequency_type: sh.frequency_type || 'daily',
          frequency_days: sh.frequency_days || null,
          target_days_per_week: sh.target_days_per_week || null,
          target_value: sh.target_value || 1,
          target_unit: sh.target_unit || 'times',
          target_type: sh.target_type || 'boolean',
          time_of_day: sh.time_of_day || 'morning',
          reminder_time: sh.reminder_time || null,
          reminder_enabled: Boolean(sh.reminder_enabled),
          is_active: true,
          is_archived: false,
          sort_order: index,
          current_streak: 0,
          longest_streak: 0,
          total_completions: 0,
          xp_per_completion: sh.xp_per_completion || 15,
          difficulty: sh.difficulty || 'medium',
        });
      });
    }

    // Award initial welcome XP (50 XP)
    db.addXP(userId, 50, 'onboarding', undefined, 'Completed DayForge Onboarding');

    const user = db.getUserById(userId);
    const profile = db.getProfileByUserId(userId);
    const settings = db.getSettingsByUserId(userId);

    return NextResponse.json({
      id: user?.id,
      email: user?.email,
      username: user?.username,
      full_name: user?.full_name,
      is_active: user?.is_active,
      is_onboarded: true,
      created_at: user?.created_at,
      profile,
      settings,
    });
  } catch (error: any) {
    console.error('Onboarding error:', error);
    return NextResponse.json({ detail: 'Failed to complete onboarding.' }, { status: 500 });
  }
}
