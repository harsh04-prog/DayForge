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

  if (!habit || habit.user_id !== userId) {
    return NextResponse.json({ detail: 'Habit not found' }, { status: 404 });
  }

  try {
    const body = await request.json();
    const { date, value, completed, note } = body;
    const logDate = date || formatDate(new Date());

    const isCompleted = completed !== undefined ? Boolean(completed) : true;
    const logValue = value !== undefined ? Number(value) : habit.target_value;

    let xpEarned = 0;
    if (isCompleted) {
      xpEarned = habit.xp_per_completion || 15;
      db.addXp(userId, xpEarned, 'habit_completion', habitId, `Completed ${habit.title}`);
    }

    const logRecord = db.createHabitLog({
      habit_id: habitId,
      user_id: userId,
      date: logDate,
      value: logValue,
      completed: isCompleted,
      xp_earned: xpEarned,
      note: note || null,
    });

    const userStats = db.recalculateUserStats(userId);
    const updatedHabit = db.getHabitById(habitId);

    return NextResponse.json({
      log: logRecord,
      habit: updatedHabit,
      user_stats: userStats,
    });
  } catch (error: any) {
    console.error('Save habit log error:', error);
    return NextResponse.json({ detail: error.message || 'Failed to record habit progress.' }, { status: 500 });
  }
}
