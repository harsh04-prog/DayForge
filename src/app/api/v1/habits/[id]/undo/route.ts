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

  // 1. Reconcile client vault if cold container
  const userVault = getUserVaultDataFromRequest(request);
  if (userVault && Number(userVault.userId) === Number(userId)) {
    db.syncUserDataFromVault(userId, userVault);
  }

  const habit = db.getHabitById(habitId);
  if (!habit || Number(habit.user_id) !== Number(userId)) {
    return NextResponse.json({ detail: 'Habit not found' }, { status: 404 });
  }

  try {
    const today = formatDate(new Date());
    const existingLog = db.getLogByHabitAndDate(habitId, today);

    if (existingLog && existingLog.completed) {
      const xpToDeduct = existingLog.xp_earned || habit.xp_per_completion || (habit.difficulty === 'hard' ? 15 : habit.difficulty === 'easy' ? 5 : 10);
      db.addXp(userId, -xpToDeduct, 'habit_undo', habitId, `Undid ${habit.title || habit.name}`);

      db.createHabitLog({
        habit_id: habitId,
        user_id: userId,
        date: today,
        value: 0,
        completed: false,
        xp_earned: 0,
        note: 'Undone',
      });
    }

    const userStats = db.recalculateUserStats(userId);
    const updatedHabit = db.getHabitById(habitId);
    const updatedProfile = db.getProfileByUserId(userId);
    const levelInfo = getLevelForXp(updatedProfile?.xp || 0);

    const latestVaultData = db.getUserVaultData(userId);
    const vaultToken = createUserDataVaultToken(latestVaultData);

    const res = NextResponse.json({
      success: true,
      message: 'Habit progress undone.',
      habit: updatedHabit,
      user_stats: userStats,
      new_xp: updatedProfile?.xp || 0,
      new_level: updatedProfile?.level || 1,
      level_info: levelInfo,
      profile: updatedProfile,
      vault_token: vaultToken,
    });

    res.headers.set('x-dayforge-vault-token', vaultToken);
    return res;
  } catch (error: any) {
    console.error('Undo habit error:', error);
    return NextResponse.json({ detail: error.message || 'Failed to undo habit.' }, { status: 500 });
  }
}
