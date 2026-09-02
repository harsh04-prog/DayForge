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

  // 1. Fetch habits and logs from Neon Postgres
  const habits = await prisma.habit.findMany({
    where: { user_id: userId, is_archived: false },
  });

  const completedLogs = await prisma.habitLog.findMany({
    where: { user_id: userId, completed: true },
    include: { habit: true },
  });

  // 2. Compute 7-day trend with complete TrendPoint format
  const trends: Array<{ period: string; completed: number; scheduled: number; rate: number }> = [];
  const today = new Date();
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  for (let i = 6; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const dStr = formatDate(d);
    const dayName = dayNames[d.getDay()];
    const label = `${dayName} ${d.getDate()}`;

    const completedCount = completedLogs.filter((l) => l.date === dStr).length;
    const scheduledCount = Math.max(1, habits.length);
    const rate = Math.min(100, Math.round((completedCount / scheduledCount) * 100));

    trends.push({
      period: label,
      completed: completedCount,
      scheduled: scheduledCount,
      rate,
    });
  }

  // 3. Compute Peak Day from real completion history
  const dayCounts: Record<number, number> = { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 };
  const fullDayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  completedLogs.forEach((l) => {
    const logDate = new Date(l.date);
    if (!isNaN(logDate.getTime())) {
      const dayIdx = logDate.getDay();
      dayCounts[dayIdx] = (dayCounts[dayIdx] || 0) + 1;
    }
  });

  let bestDayIdx = 1; // Default Monday
  let maxCount = -1;
  for (let i = 0; i < 7; i++) {
    if (dayCounts[i] > maxCount) {
      maxCount = dayCounts[i];
      bestDayIdx = i;
    }
  }
  const peakDay = maxCount > 0 ? fullDayNames[bestDayIdx] : 'Weekdays';

  // 4. Compute Peak Time from habit preferences
  const timeCounts: Record<string, number> = { morning: 0, afternoon: 0, evening: 0, anytime: 0 };
  habits.forEach((h) => {
    const t = (h.preferred_time || h.time_of_day || 'morning').toLowerCase();
    timeCounts[t] = (timeCounts[t] || 0) + 1;
  });

  let peakTime = 'Morning (7–10 AM)';
  if (timeCounts.afternoon > timeCounts.morning && timeCounts.afternoon > timeCounts.evening) {
    peakTime = 'Afternoon (1–4 PM)';
  } else if (timeCounts.evening > timeCounts.morning && timeCounts.evening > timeCounts.afternoon) {
    peakTime = 'Evening (6–9 PM)';
  }

  // 5. Category breakdown
  const categoryMap: Record<string, { count: number; completions: number }> = {};
  habits.forEach((h) => {
    const cat = h.category || 'General';
    if (!categoryMap[cat]) {
      categoryMap[cat] = { count: 0, completions: 0 };
    }
    categoryMap[cat].count++;
    categoryMap[cat].completions += h.total_completions || 0;
  });

  const categories = Object.keys(categoryMap).map((cat) => ({
    name: cat,
    category: cat,
    count: categoryMap[cat].count,
    completions: categoryMap[cat].completions,
    percentage: Math.round((categoryMap[cat].count / Math.max(1, habits.length)) * 100),
  }));

  // 6. Top Habit
  const topHabit = habits.length > 0
    ? [...habits].sort((a, b) => (b.current_streak || 0) - (a.current_streak || 0))[0].title
    : 'Daily Routines';

  const res = NextResponse.json({
    best_day: peakDay,
    weakest_day: 'Sunday',
    best_time: peakTime,
    most_consistent_habit: topHabit,
    least_consistent_habit: habits.length > 1 ? habits[habits.length - 1].title : 'None',
    trends,
    categories,
  });

  res.headers.set('Cache-Control', 'private, no-cache, no-store, max-age=0, must-revalidate');
  return res;
}
