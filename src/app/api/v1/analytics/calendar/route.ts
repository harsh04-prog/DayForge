import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getUserIdFromRequest } from '@/lib/auth';
import { formatDate } from '@/lib/streakEngine';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request: Request) {
  const userId = getUserIdFromRequest(request);
  if (!userId) {
    return NextResponse.json(
      { detail: 'Unauthorized' },
      { status: 401, headers: { 'Cache-Control': 'private, no-cache, no-store, max-age=0, must-revalidate' } }
    );
  }

  const { searchParams } = new URL(request.url);
  const now = new Date();
  const year = parseInt(searchParams.get('year') || String(now.getFullYear()), 10);
  const month = parseInt(searchParams.get('month') || String(now.getMonth() + 1), 10);

  // 1. Fetch user habits and month completion logs from Neon Postgres
  const habits = await prisma.habit.findMany({
    where: { user_id: userId, is_archived: false },
  });

  const monthStr = String(month).padStart(2, '0');
  const monthPrefix = `${year}-${monthStr}`;

  const monthLogs = await prisma.habitLog.findMany({
    where: {
      user_id: userId,
      date: { startsWith: monthPrefix },
      completed: true,
    },
    include: { habit: true },
  });

  const daysInMonth = new Date(year, month, 0).getDate();
  const todayStr = formatDate(new Date());

  const days: any[] = [];
  for (let d = 1; d <= daysInMonth; d++) {
    const dayStr = String(d).padStart(2, '0');
    const date = `${year}-${monthStr}-${dayStr}`;

    const completedLogsForDay = monthLogs.filter((l) => l.date === date);
    const completedHabits = completedLogsForDay.map((l) => ({
      log_id: l.id,
      habit_id: l.habit_id,
      title: l.habit?.title || l.habit?.name || 'Habit',
      category: l.habit?.category || 'General',
      color: l.habit?.color || '#6C5CE7',
      icon: l.habit?.icon || 'sparkles',
      xp_earned: l.xp_earned || 10,
    }));

    const totalCompleted = completedHabits.length;
    const totalScheduled = habits.length;
    const completionRate = totalScheduled > 0 ? Math.round((totalCompleted / totalScheduled) * 100) : 0;

    days.push({
      date,
      day: d,
      total_completed: totalCompleted,
      total_scheduled: totalScheduled,
      completion_rate: completionRate,
      completed_habits: completedHabits,
      is_today: date === todayStr,
    });
  }

  const res = NextResponse.json({
    year,
    month,
    days,
  });

  res.headers.set('Cache-Control', 'private, no-cache, no-store, max-age=0, must-revalidate');
  return res;
}
