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
      {
        status: 401,
        headers: { 'Cache-Control': 'private, no-cache, no-store, max-age=0, must-revalidate' },
      }
    );
  }

  const reqUrl = new URL(request.url);
  const clientDate = reqUrl.searchParams.get('date') || request.headers.get('x-client-date');
  const today = clientDate && /^\d{4}-\d{2}-\d{2}$/.test(clientDate) ? clientDate : formatDate(new Date());

  // 1. Query all challenges and user's participation from Neon Postgres
  const challenges = await prisma.challenge.findMany({
    include: {
      participants: {
        where: { user_id: userId },
      },
      logs: {
        where: { user_id: userId, date: today },
      },
    },
    orderBy: { id: 'asc' },
  });

  const formatted = challenges.map((ch) => {
    const userCh = ch.participants[0];
    const todayLog = ch.logs[0];
    const isJoined = Boolean(userCh && userCh.status === 'active');
    const todayCompleted = Boolean(todayLog?.completed);
    const completedDays = userCh?.completed_days || 0;
    const progressPct = Math.min(100, Math.round((completedDays / ch.duration_days) * 100));

    return {
      id: ch.id,
      code: ch.code,
      title: ch.title,
      name: ch.name || ch.title,
      description: ch.description,
      category: ch.category,
      difficulty: ch.difficulty,
      duration_days: ch.duration_days,
      daily_target: ch.daily_target,
      unit: ch.unit,
      xp_reward: ch.xp_reward,
      daily_xp_reward: ch.daily_xp_reward,
      color: ch.color,
      icon: ch.icon,
      is_official: ch.is_official,
      is_joined: isJoined,
      status: userCh ? userCh.status : 'not_joined',
      current_day: isJoined ? Math.min(ch.duration_days, completedDays + 1) : 1,
      completed_days: completedDays,
      remaining_days: Math.max(0, ch.duration_days - completedDays),
      progress_days: completedDays,
      progress_percentage: progressPct,
      today_progress: todayLog?.progress_value || 0,
      today_target: ch.daily_target,
      today_completed: todayCompleted,
      participants_count: Math.max(1, ch.participants_count),
    };
  });

  const res = NextResponse.json(formatted);
  res.headers.set('Cache-Control', 'private, no-cache, no-store, max-age=0, must-revalidate');
  return res;
}
