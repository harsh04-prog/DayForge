import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getUserIdFromRequest } from '@/lib/auth';
import { formatDate } from '@/lib/streakEngine';

export async function GET(request: Request) {
  const userId = getUserIdFromRequest(request);
  if (!userId) return NextResponse.json({ detail: 'Unauthorized' }, { status: 401 });

  const habits = db.getHabitsByUserId(userId, false);
  const logs = db.getLogsByUserId(userId).filter((l) => l.completed);

  // 7-day trend
  const trends: Array<{ date: string; rate: number }> = [];
  const today = new Date();
  for (let i = 6; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const dStr = formatDate(d);
    const completedCount = logs.filter((l) => l.date === dStr).length;
    const totalCount = habits.length;
    const rate = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
    trends.push({ date: dStr.slice(5), rate });
  }

  // Category breakdown
  const categoryMap: Record<string, { count: number; completions: number }> = {};
  habits.forEach((h) => {
    if (!categoryMap[h.category]) {
      categoryMap[h.category] = { count: 0, completions: 0 };
    }
    categoryMap[h.category].count++;
    categoryMap[h.category].completions += h.total_completions;
  });

  const categories = Object.keys(categoryMap).map((cat) => ({
    name: cat,
    category: cat,
    count: categoryMap[cat].count,
    completions: categoryMap[cat].completions,
    percentage: Math.round((categoryMap[cat].count / Math.max(1, habits.length)) * 100),
  }));

  const mostConsistentHabit = habits.length > 0
    ? [...habits].sort((a, b) => b.current_streak - a.current_streak)[0].title
    : 'Daily Routines';

  return NextResponse.json({
    best_day: 'Tuesday',
    weakest_day: 'Sunday',
    best_time: 'Morning (8–10 AM)',
    most_consistent_habit: mostConsistentHabit,
    least_consistent_habit: habits.length > 1 ? habits[habits.length - 1].title : 'None',
    trends,
    categories,
  });
}
