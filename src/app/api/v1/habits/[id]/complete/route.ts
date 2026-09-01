import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getUserIdFromRequest, getUserVaultDataFromRequest, createUserDataVaultToken } from '@/lib/auth';
import { getLevelForXp } from '@/lib/gamification';
import { formatDate } from '@/lib/streakEngine';

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const userId = getUserIdFromRequest(request);
  if (!userId) return NextResponse.json({ detail: 'Unauthorized' }, { status: 401 });

  const resolvedParams = await params;
  const habitId = parseInt(resolvedParams.id, 10);
  if (isNaN(habitId)) {
    return NextResponse.json({ detail: 'Invalid habit ID' }, { status: 400 });
  }

  // 1. Reconcile client vault if cold serverless container
  const userVault = getUserVaultDataFromRequest(request);
  if (userVault && Number(userVault.userId) === Number(userId)) {
    db.syncUserDataFromVault(userId, userVault);
  }

  const habit = db.getHabitById(habitId);
  if (!habit || Number(habit.user_id) !== Number(userId)) {
    return NextResponse.json({ detail: 'Habit not found' }, { status: 404 });
  }

  try {
    let body: any = {};
    try {
      body = await request.json();
    } catch {}

    const { date, value, current_value, completed, notes, note } = body;
    const logDate = date || formatDate(new Date());

    const targetVal = habit.target_value || 1;
    const logValue = value !== undefined ? Number(value) : current_value !== undefined ? Number(current_value) : targetVal;
    const isCompleted = completed !== undefined ? Boolean(completed) : logValue >= targetVal;

    // Capture initial profile state
    const initialProfile = db.getProfileByUserId(userId);
    const initialLevel = initialProfile ? initialProfile.level : 1;

    let xpEarned = 0;
    if (isCompleted) {
      xpEarned = habit.xp_per_completion || (habit.difficulty === 'hard' ? 15 : habit.difficulty === 'easy' ? 5 : 10);
      db.addXp(userId, xpEarned, 'habit_completion', habitId, `Completed ${habit.title || habit.name}`);
    }

    const logRecord = db.createHabitLog({
      habit_id: habitId,
      user_id: userId,
      date: logDate,
      value: logValue,
      completed: isCompleted,
      xp_earned: xpEarned,
      note: notes || note || null,
    });

    const userStats = db.recalculateUserStats(userId);
    const updatedHabit = db.getHabitById(habitId);
    const updatedProfile = db.getProfileByUserId(userId);
    const currentLevel = updatedProfile ? updatedProfile.level : 1;
    const levelInfo = getLevelForXp(updatedProfile?.xp || 0);

    const latestVaultData = db.getUserVaultData(userId);
    const vaultToken = createUserDataVaultToken(latestVaultData);

    const res = NextResponse.json({
      success: true,
      log: logRecord,
      habit: updatedHabit,
      user_stats: userStats,
      xp_awarded: xpEarned,
      new_xp: updatedProfile?.xp || 0,
      new_level: currentLevel,
      level_up: currentLevel > initialLevel,
      level_info: levelInfo,
      profile: updatedProfile,
      vault_token: vaultToken,
    });

    res.headers.set('x-dayforge-vault-token', vaultToken);
    return res;
  } catch (error: any) {
    console.error('Complete habit error:', error);
    return NextResponse.json({ detail: error.message || 'Failed to complete habit.' }, { status: 500 });
  }
}
