import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { db } from '@/lib/db';
import { getUserIdFromRequest } from '@/lib/auth';
import { getLevelForXp } from '@/lib/gamification';
import { formatDate } from '@/lib/streakEngine';
import { recordDailyUsage } from '@/lib/usageEngine';

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

  // Record daily active usage for this user
  recordDailyUsage(userId);

  const reqUrl = new URL(request.url);
  const clientDate = reqUrl.searchParams.get('date') || request.headers.get('x-client-date');
  const today = clientDate && /^\d{4}-\d{2}-\d{2}$/.test(clientDate) ? clientDate : formatDate(new Date());

  // 1. Fetch User & Profile directly from Neon Postgres
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      profile: true,
      settings: true,
    },
  });

  if (!user) {
    return NextResponse.json(
      { detail: 'User not found' },
      { status: 404, headers: { 'Cache-Control': 'private, no-cache, no-store, max-age=0, must-revalidate' } }
    );
  }

  // 2. Fetch User's Active Habits and Today's Logs from Neon Postgres
  const habits = await prisma.habit.findMany({
    where: {
      user_id: userId,
      is_archived: false,
    },
    include: {
      logs: {
        where: { date: today },
      },
    },
    orderBy: { id: 'asc' },
  });

  // 3. Fetch all completed logs to calculate exact streak & consistency
  const allCompletedLogs = await prisma.habitLog.findMany({
    where: {
      user_id: userId,
      completed: true,
    },
    select: {
      date: true,
    },
    orderBy: { date: 'desc' },
  });

  // Calculate streak from real distinct dates
  const uniqueDates = Array.from(new Set(allCompletedLogs.map((l) => l.date))).sort().reverse();
  let currentStreak = 0;
  let checkDate = new Date(today);

  // If completed today, streak includes today
  const hasCompletedToday = uniqueDates.includes(today);
  if (hasCompletedToday) {
    currentStreak++;
    checkDate.setDate(checkDate.getDate() - 1);
  } else {
    // Check if completed yesterday
    checkDate.setDate(checkDate.getDate() - 1);
  }

  while (uniqueDates.includes(formatDate(checkDate))) {
    currentStreak++;
    checkDate.setDate(checkDate.getDate() - 1);
  }

  const profile = user.profile;
  const userXp = profile?.xp || 0;
  const levelInfo = getLevelForXp(userXp);
  const longestStreak = Math.max(profile?.longest_streak || 0, currentStreak);

  // Sync profile streak if changed
  if (profile && (profile.current_streak !== currentStreak || profile.longest_streak !== longestStreak)) {
    await prisma.profile.update({
      where: { id: profile.id },
      data: {
        current_streak: currentStreak,
        longest_streak: longestStreak,
      },
    }).catch(() => null);
  }

  // 4. Enrich habits for today's checklist
  const enrichedHabits = habits.map((h) => {
    const todayLog = h.logs[0];
    const isCompleted = Boolean(todayLog?.completed);
    const habitName = h.name || h.title || 'Daily Habit';
    return {
      ...h,
      title: habitName,
      name: habitName,
      today_completed: isCompleted,
      today_progress: isCompleted ? (h.target_value || 1) : (todayLog?.value || 0),
      today_log: todayLog || null,
      completed_today: isCompleted,
    };
  });

  const totalScheduled = enrichedHabits.length;
  const totalCompleted = enrichedHabits.filter((h) => h.today_completed).length;
  const completionPercentage = totalScheduled > 0 ? Math.round((totalCompleted / totalScheduled) * 100) : 0;

  // Real Daily Score / Discipline Index
  const dailyScore = Math.min(
    100,
    Math.round(completionPercentage * 0.7 + Math.min(15, currentStreak * 2) + (totalCompleted > 0 ? 15 : 0))
  );

  const dailyScoreBreakdown = {
    total_score: dailyScore,
    completion_score: Math.round((completionPercentage / 100) * 60),
    consistency_score: Math.min(25, currentStreak * 3),
    streak_bonus: Math.min(15, currentStreak * 2),
    habits_completed: totalCompleted,
    total_habits: totalScheduled,
    completion_percentage: completionPercentage,
    summary:
      totalCompleted === totalScheduled && totalScheduled > 0
        ? 'Perfect Day! All scheduled habits completed.'
        : `${totalCompleted} of ${totalScheduled} habits completed today.`,
  };

  const res = NextResponse.json({
    date: today,
    profile: {
      id: profile?.id || 1,
      user_id: userId,
      full_name: user.full_name,
      avatar_url: user.avatar_url || 'male_1',
      level: levelInfo.level,
      xp: userXp,
      available_shields: profile?.available_shields ?? 2,
    },
    level_info: levelInfo,
    daily_score: dailyScoreBreakdown,
    today_completed_count: totalCompleted,
    today_scheduled_count: totalScheduled,
    today_completion_rate: completionPercentage,
    active_streak: currentStreak,
    habits: enrichedHabits,
    today_habits: enrichedHabits,
    streaks: {
      current_streak: currentStreak,
      longest_streak: longestStreak,
      consistency_rate: completionPercentage,
      shield_active: false,
    },
    character: {
      level: levelInfo.level,
      rank: levelInfo.title,
      xp: userXp,
      streak: currentStreak,
    },
  });

  res.headers.set('Cache-Control', 'private, no-cache, no-store, max-age=0, must-revalidate');
  return res;
}
