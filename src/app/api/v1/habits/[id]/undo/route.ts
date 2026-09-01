import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getUserIdFromRequest } from '@/lib/auth';
import { formatDate } from '@/lib/streakEngine';

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const userId = getUserIdFromRequest(request);
  if (!userId) return NextResponse.json({ detail: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const habitId = parseInt(id, 10);
  const habit = db.getHabitById(habitId);

  if (!habit || Number(habit.user_id) !== Number(userId)) {
    return NextResponse.json({ detail: 'Habit not found' }, { status: 404 });
  }

  try {
    const today = formatDate(new Date());
    const existingLogs = db.getHabitLogs(userId).filter((l) => l.habit_id === habitId && l.date === today);

    if (existingLogs.length > 0) {
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

    return NextResponse.json({
      success: true,
      message: 'Habit progress undone.',
      habit: updatedHabit,
      user_stats: userStats,
    });
  } catch (error: any) {
    console.error('Undo habit error:', error);
    return NextResponse.json({ detail: error.message || 'Failed to undo habit.' }, { status: 500 });
  }
}
