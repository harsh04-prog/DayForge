import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getUserIdFromRequest } from '@/lib/auth';
import { formatDate } from '@/lib/streakEngine';

export async function GET(request: Request) {
  const userId = getUserIdFromRequest(request);
  if (!userId) return NextResponse.json({ detail: 'Unauthorized' }, { status: 401 });

  const logs = db.getHabitLogs(userId).filter((l) => l.completed);
  const stats = db.recalculateUserStats(userId);

  // Generate 365 days
  const days: Array<{ date: string; count: number; level: number }> = [];
  const today = new Date();

  for (let i = 364; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const dStr = formatDate(d);
    const count = logs.filter((l) => l.date === dStr).length;
    const level = count === 0 ? 0 : count === 1 ? 1 : count <= 3 ? 2 : count <= 5 ? 3 : 4;
    days.push({ date: dStr, count, level });
  }

  const activeDays = new Set(logs.map((l) => l.date)).size;

  return NextResponse.json({
    days,
    total_active_days: activeDays,
    longest_streak: stats.longestStreak,
    current_streak: stats.currentStreak,
  });
}
