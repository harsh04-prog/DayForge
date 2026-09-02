import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { db } from '@/lib/db';
import { getUserIdFromRequest, getUserVaultDataFromRequest, createUserDataVaultToken } from '@/lib/auth';
import { getLevelForXp } from '@/lib/gamification';
import { formatDate } from '@/lib/streakEngine';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
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

  const resolvedParams = await params;
  const habitId = parseInt(resolvedParams.id, 10);
  if (isNaN(habitId)) {
    return NextResponse.json(
      { detail: 'Invalid habit ID' },
      {
        status: 400,
        headers: { 'Cache-Control': 'private, no-cache, no-store, max-age=0, must-revalidate' },
      }
    );
  }

  // 1. Reconcile client vault if cold serverless container
  const userVault = getUserVaultDataFromRequest(request);
  if (userVault && Number(userVault.userId) === Number(userId)) {
    db.syncUserDataFromVault(userId, userVault);
  }

  let habit = await prisma.habit.findUnique({
    where: { id: habitId },
  });

  if (!habit || Number(habit.user_id) !== Number(userId)) {
    const localHabit = db.getHabitById(habitId);
    if (!localHabit || Number(localHabit.user_id) !== Number(userId)) {
      return NextResponse.json(
        { detail: 'Habit not found' },
        {
          status: 404,
          headers: { 'Cache-Control': 'private, no-cache, no-store, max-age=0, must-revalidate' },
        }
      );
    }
  }

  try {
    let body: any = {};
    try {
      body = await request.json();
    } catch {}

    const { date, value, current_value, completed, notes, note } = body;
    const reqUrl = new URL(request.url);
    const clientDate = date || reqUrl.searchParams.get('date') || request.headers.get('x-client-date');
    const logDate = clientDate && /^\d{4}-\d{2}-\d{2}$/.test(clientDate) ? clientDate : formatDate(new Date());

    // 1. Fetch existing log from Neon Postgres to check previous completion state
    const existingLog = await prisma.habitLog.findUnique({
      where: {
        habit_id_date: {
          habit_id: habitId,
          date: logDate,
        },
      },
    });

    const wasAlreadyCompleted = Boolean(existingLog?.completed);
    const existingXpEarned = existingLog?.xp_earned || 0;

    const targetVal = habit?.target_value || 1;
    const logValue = value !== undefined ? Number(value) : current_value !== undefined ? Number(current_value) : targetVal;
    const isCompleted = completed !== undefined ? Boolean(completed) : logValue >= targetVal;

    // Capture initial profile state
    const initialProfile = db.getProfileByUserId(userId);
    const initialLevel = initialProfile ? initialProfile.level : 1;

    // 2. DATABASE-LEVEL ENFORCEMENT:
    // XP is awarded ONCE and ONLY ONCE when transitioning from uncompleted to completed.
    let xpEarned = 0;
    const baseReward = habit?.xp_per_completion || (habit?.difficulty === 'hard' ? 15 : habit?.difficulty === 'easy' ? 5 : 10);

    if (isCompleted && !wasAlreadyCompleted && existingXpEarned === 0) {
      // First time reaching goal today!
      xpEarned = baseReward;
      db.addXp(userId, xpEarned, 'habit_completion', habitId, `Completed ${habit?.title || habit?.name || 'Habit'}`);

      // Persist XP increment to Neon Postgres Profile
      await prisma.profile.updateMany({
        where: { user_id: userId },
        data: { xp: { increment: xpEarned } },
      }).catch(() => null);

      await prisma.xPTransaction.create({
        data: {
          user_id: userId,
          amount: xpEarned,
          source_type: 'habit_completion',
          source_id: habitId,
          description: `Completed ${habit?.title || habit?.name || 'Habit'}`,
        },
      }).catch(() => null);
    } else {
      // Goal already met previously or not met yet -> ZERO new XP
      xpEarned = 0;
    }

    const totalLogXp = wasAlreadyCompleted ? existingXpEarned : xpEarned;

    // 3. Persist date-based HabitLog directly to Postgres via Prisma
    const habitLog = await prisma.habitLog.upsert({
      where: {
        habit_id_date: {
          habit_id: habitId,
          date: logDate,
        },
      },
      update: {
        value: logValue,
        completed: isCompleted,
        xp_earned: totalLogXp,
        note: notes || note || null,
        completed_at: isCompleted ? (existingLog?.completed_at || new Date()) : null,
      },
      create: {
        habit_id: habitId,
        user_id: userId,
        date: logDate,
        value: logValue,
        completed: isCompleted,
        xp_earned: totalLogXp,
        note: notes || note || null,
        completed_at: isCompleted ? new Date() : null,
      },
    }).catch((e) => {
      console.warn('Prisma HabitLog upsert warning:', e.message);
      return null;
    });

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
      log: habitLog || logRecord,
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
    res.headers.set('Cache-Control', 'private, no-cache, no-store, max-age=0, must-revalidate');
    return res;
  } catch (error: any) {
    console.error('Complete habit error:', error);
    return NextResponse.json(
      { detail: error.message || 'Failed to complete habit.' },
      {
        status: 500,
        headers: { 'Cache-Control': 'private, no-cache, no-store, max-age=0, must-revalidate' },
      }
    );
  }
}
