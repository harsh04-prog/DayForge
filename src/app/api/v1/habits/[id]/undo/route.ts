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

  const reqUrl = new URL(request.url);
  const clientDate = reqUrl.searchParams.get('date') || request.headers.get('x-client-date');
  const today = clientDate && /^\d{4}-\d{2}-\d{2}$/.test(clientDate) ? clientDate : formatDate(new Date());

  try {
    const existingLog = await prisma.habitLog.findUnique({
      where: {
        habit_id_date: {
          habit_id: habitId,
          date: today,
        },
      },
    });

    const habit = await prisma.habit.findUnique({
      where: { id: habitId },
    }) || db.getHabitById(habitId);

    if (existingLog && existingLog.completed) {
      const xpToDeduct = existingLog.xp_earned || habit?.xp_per_completion || 10;
      db.addXp(userId, -xpToDeduct, 'habit_undo', habitId, `Undid ${habit?.title || habit?.name || 'Habit'}`);

      await prisma.profile.updateMany({
        where: { user_id: userId },
        data: { xp: { decrement: xpToDeduct } },
      }).catch(() => null);

      await prisma.xPTransaction.create({
        data: {
          user_id: userId,
          amount: -xpToDeduct,
          source_type: 'habit_undo',
          source_id: habitId,
          description: `Undid ${habit?.title || habit?.name || 'Habit'}`,
        },
      }).catch(() => null);

      await prisma.habitLog.update({
        where: { id: existingLog.id },
        data: {
          value: 0,
          completed: false,
          xp_earned: 0,
          completed_at: null,
          note: 'Undone',
        },
      });
    }

    db.createHabitLog({
      habit_id: habitId,
      user_id: userId,
      date: today,
      value: 0,
      completed: false,
      xp_earned: 0,
      note: 'Undone',
    });

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
    res.headers.set('Cache-Control', 'private, no-cache, no-store, max-age=0, must-revalidate');
    return res;
  } catch (error: any) {
    console.error('Undo habit error:', error);
    return NextResponse.json(
      { detail: error.message || 'Failed to undo habit.' },
      {
        status: 500,
        headers: { 'Cache-Control': 'private, no-cache, no-store, max-age=0, must-revalidate' },
      }
    );
  }
}
