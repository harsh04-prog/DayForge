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
    let body: any = {};
    try {
      body = await request.json();
    } catch {}

    const { date, value, current_value, completed, notes, note } = body;
    const logDate = date || formatDate(new Date());

    const targetVal = habit.target_value || 1;
    const logValue = value !== undefined ? Number(value) : current_value !== undefined ? Number(current_value) : targetVal;
    const isCompleted = completed !== undefined ? Boolean(completed) : logValue >= targetVal;

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
      note: notes || note || null,
    });

    const userStats = db.recalculateUserStats(userId);
    const updatedHabit = db.getHabitById(habitId);

    return NextResponse.json({
      success: true,
      log: logRecord,
      habit: updatedHabit,
      user_stats: userStats,
      xp_awarded: xpEarned,
    });
  } catch (error: any) {
    console.error('Complete habit error:', error);
    return NextResponse.json({ detail: error.message || 'Failed to complete habit.' }, { status: 500 });
  }
}
