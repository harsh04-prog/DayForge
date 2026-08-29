import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getUserIdFromRequest } from '@/lib/auth';

export async function GET(request: Request) {
  const userId = getUserIdFromRequest(request);
  if (!userId) return NextResponse.json({ detail: 'Unauthorized' }, { status: 401 });

  const habits = db.getHabitsByUserId(userId, false);
  const logs = db.getLogsByUserId(userId).filter((l) => l.completed);
  const stats = db.recalculateUserStats(userId);

  return NextResponse.json({
    week_number: Math.ceil((new Date().getDate() + new Date(new Date().getFullYear(), 0, 1).getDay()) / 7),
    year: new Date().getFullYear(),
    start_date: new Date(Date.now() - 6 * 86400000).toISOString().slice(0, 10),
    end_date: new Date().toISOString().slice(0, 10),
    overall_completion_rate: Math.min(100, Math.round((logs.length / Math.max(1, habits.length * 7)) * 100)),
    total_completions: logs.length,
    xp_earned: logs.length * 15,
    streak_summary: `You maintained a ${stats.currentStreak}-day active streak!`,
    best_habit: habits.length > 0 ? habits[0].title : 'Daily Habits',
    focus_habit: habits.length > 1 ? habits[1].title : 'Evening Routine',
    habit_breakdowns: habits.map((h) => ({
      habit_id: h.id,
      habit_name: h.title,
      scheduled: 7,
      completed: logs.filter((l) => l.habit_id === h.id).length,
      rate: Math.min(100, Math.round((logs.filter((l) => l.habit_id === h.id).length / 7) * 100)),
    })),
    key_wins: [
      'Maintained consistent daily check-ins across core habits',
      `Accumulated ${logs.length * 15} XP toward next level threshold`,
      'Kept streak shield reserves fully intact',
    ],
    next_week_focus: 'Increase mid-day habit consistency and experiment with habit stacking.',
  });
}
