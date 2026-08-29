import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getUserIdFromRequest } from '@/lib/auth';
import { formatDate } from '@/lib/streakEngine';

export async function GET(request: Request) {
  const userId = getUserIdFromRequest(request);
  if (!userId) {
    return NextResponse.json({ detail: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const includeArchived = searchParams.get('include_archived') === 'true';

  const habits = db.getHabitsByUserId(userId, includeArchived);
  const today = formatDate(new Date());

  // Attach today's log to each habit
  const enrichedHabits = habits.map((h) => {
    const todayLog = db.getLogByHabitAndDate(h.id, today);
    return {
      ...h,
      today_log: todayLog || null,
    };
  });

  return NextResponse.json(enrichedHabits);
}

export async function POST(request: Request) {
  const userId = getUserIdFromRequest(request);
  if (!userId) {
    return NextResponse.json({ detail: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const {
      title,
      description,
      category,
      color,
      icon,
      frequency_type,
      frequency_days,
      target_days_per_week,
      target_value,
      target_unit,
      target_type,
      time_of_day,
      reminder_time,
      reminder_enabled,
      xp_per_completion,
      difficulty,
    } = body;

    if (!title) {
      return NextResponse.json({ detail: 'Habit title is required.' }, { status: 400 });
    }

    const existingHabits = db.getHabitsByUserId(userId);
    const newHabit = db.createHabit({
      user_id: userId,
      title: title.trim(),
      description: description || null,
      category: category || 'health',
      color: color || '#6C5CE7',
      icon: icon || 'activity',
      frequency_type: frequency_type || 'daily',
      frequency_days: frequency_days || null,
      target_days_per_week: target_days_per_week || null,
      target_value: target_value || 1,
      target_unit: target_unit || 'times',
      target_type: target_type || 'boolean',
      time_of_day: time_of_day || 'anytime',
      reminder_time: reminder_time || null,
      reminder_enabled: Boolean(reminder_enabled),
      is_active: true,
      is_archived: false,
      sort_order: existingHabits.length,
      current_streak: 0,
      longest_streak: 0,
      total_completions: 0,
      xp_per_completion: xp_per_completion || 15,
      difficulty: difficulty || 'medium',
    });

    return NextResponse.json(newHabit, { status: 201 });
  } catch (error: any) {
    console.error('Create habit error:', error);
    return NextResponse.json({ detail: 'Failed to create habit.' }, { status: 500 });
  }
}
