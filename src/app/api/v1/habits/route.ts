import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getUserIdFromRequest, getUserVaultDataFromRequest, createUserDataVaultToken } from '@/lib/auth';
import { formatDate } from '@/lib/streakEngine';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request: Request) {
  const userId = getUserIdFromRequest(request);
  if (!userId) {
    return NextResponse.json(
      { detail: 'Unauthorized' },
      {
        status: 401,
        headers: { 'Cache-Control': 'private, no-cache, no-store, max-age=0, must-revalidate' },
      }
    );
  }

  // Reconcile client vault if container has missing data
  const userVault = getUserVaultDataFromRequest(request);
  if (userVault && Number(userVault.userId) === Number(userId)) {
    db.syncUserDataFromVault(userId, userVault);
  }

  const { searchParams } = new URL(request.url);
  const includeArchived = searchParams.get('include_archived') === 'true';
  const clientDate = searchParams.get('date') || request.headers.get('x-client-date');
  const today = clientDate && /^\d{4}-\d{2}-\d{2}$/.test(clientDate) ? clientDate : formatDate(new Date());

  const habits = db.getHabitsByUserId(userId, includeArchived);

  // Attach today's log to each habit
  const enrichedHabits = habits.map((h) => {
    const todayLog = db.getLogByHabitAndDate(h.id, today);
    const isCompleted = Boolean(todayLog?.completed);
    const habitName = h.name || h.title || 'Daily Habit';
    return {
      ...h,
      title: habitName,
      name: habitName,
      today_completed: isCompleted,
      today_progress: isCompleted ? (h.target_value || 1) : 0,
      today_log: todayLog || null,
      completed_today: isCompleted,
    };
  });

  const latestVaultData = db.getUserVaultData(userId);
  const vaultToken = createUserDataVaultToken(latestVaultData);

  const res = NextResponse.json(enrichedHabits);
  res.headers.set('x-dayforge-vault-token', vaultToken);
  res.headers.set('Cache-Control', 'private, no-cache, no-store, max-age=0, must-revalidate');
  return res;
}

export async function POST(request: Request) {
  const userId = getUserIdFromRequest(request);
  if (!userId) {
    return NextResponse.json(
      { detail: 'Unauthorized' },
      {
        status: 401,
        headers: { 'Cache-Control': 'private, no-cache, no-store, max-age=0, must-revalidate' },
      }
    );
  }

  // Reconcile client vault if container has missing data
  const userVault = getUserVaultDataFromRequest(request);
  if (userVault && Number(userVault.userId) === Number(userId)) {
    db.syncUserDataFromVault(userId, userVault);
  }

  try {
    const body = await request.json();
    const habitName = (body.name || body.title || '').trim();

    if (!habitName) {
      return NextResponse.json({ detail: 'Habit name is required.' }, { status: 400 });
    }

    const targetVal = body.target_value !== undefined ? (Number(body.target_value) > 0 ? Number(body.target_value) : 1) : 1;
    const unit = (body.unit || body.target_unit || (targetVal > 1 ? 'units' : 'times')).trim();
    const habitType = body.habit_type || (targetVal > 1 ? 'quantitative' : 'binary');

    const existingHabits = db.getHabitsByUserId(userId);
    const newHabit = db.createHabit({
      user_id: userId,
      title: habitName,
      name: habitName,
      description: body.description ? body.description.trim() : null,
      category: body.category || 'General',
      color: body.color || '#6C5CE7',
      icon: body.icon || 'sparkles',
      frequency_type: body.frequency_type || 'daily',
      frequency_days: body.frequency_days || '0,1,2,3,4,5,6',
      target_days_per_week: body.target_days_per_week || null,
      target_value: targetVal,
      target_unit: unit,
      unit: unit,
      target_type: body.target_type || (targetVal > 1 ? 'numeric' : 'boolean'),
      habit_type: habitType,
      time_of_day: body.preferred_time || body.time_of_day || 'anytime',
      preferred_time: body.preferred_time || body.time_of_day || 'anytime',
      reminder_time: body.reminder_time || null,
      reminder_enabled: Boolean(body.reminder_enabled || body.reminder_time),
      is_active: true,
      is_archived: false,
      sort_order: existingHabits.length,
      current_streak: 0,
      longest_streak: 0,
      total_completions: 0,
      xp_per_completion: body.xp_per_completion || (body.difficulty === 'hard' ? 15 : body.difficulty === 'easy' ? 5 : 10),
      difficulty: body.difficulty || 'medium',
    });

    const latestVaultData = db.getUserVaultData(userId);
    const vaultToken = createUserDataVaultToken(latestVaultData);

    const res = NextResponse.json(newHabit, { status: 201 });
    res.headers.set('x-dayforge-vault-token', vaultToken);
    res.headers.set('Cache-Control', 'private, no-cache, no-store, max-age=0, must-revalidate');
    return res;
  } catch (error: any) {
    console.error('Create habit error:', error);
    return NextResponse.json({ detail: 'Failed to create habit.' }, { status: 500 });
  }
}
