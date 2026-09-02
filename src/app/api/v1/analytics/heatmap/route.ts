import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { db } from '@/lib/db';
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

  // 1. Fetch completed habit logs from Neon Postgres
  const completedLogs = await prisma.habitLog.findMany({
    where: {
      user_id: userId,
      completed: true,
    },
    select: {
      date: true,
    },
  });

  // Count completions per date
  const dateCounts: Record<string, number> = {};
  completedLogs.forEach((l) => {
    dateCounts[l.date] = (dateCounts[l.date] || 0) + 1;
  });

  const profile = await prisma.profile.findUnique({
    where: { user_id: userId },
  });

  const stats = db.recalculateUserStats(userId);

  // Generate 365 days up to today
  const days: Array<{ date: string; count: number; level: number }> = [];
  const today = new Date();

  for (let i = 364; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const dStr = formatDate(d);
    const count = dateCounts[dStr] || 0;
    const level = count === 0 ? 0 : count === 1 ? 1 : count <= 3 ? 2 : count <= 5 ? 3 : 4;
    days.push({ date: dStr, count, level });
  }

  const activeDays = Object.keys(dateCounts).length;

  const res = NextResponse.json({
    days,
    total_active_days: activeDays,
    longest_streak: profile?.longest_streak || stats.longestStreak,
    current_streak: profile?.current_streak || stats.currentStreak,
  });

  res.headers.set('Cache-Control', 'private, no-cache, no-store, max-age=0, must-revalidate');
  return res;
}
