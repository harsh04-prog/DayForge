import { NextResponse } from 'next/server';
import { getUserIdFromRequest } from '@/lib/auth';
import {
  getDailyActiveUsersCount,
  getUserUsageHistory,
  getUserAppUsageStreak,
} from '@/lib/usageEngine';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request: Request) {
  const userId = getUserIdFromRequest(request);
  if (!userId) {
    return NextResponse.json({ detail: 'Unauthorized' }, { status: 401 });
  }

  try {
    const [dauToday, userHistory, usageStreak] = await Promise.all([
      getDailyActiveUsersCount(),
      getUserUsageHistory(userId, 30),
      getUserAppUsageStreak(userId),
    ]);

    return NextResponse.json({
      dau_today: dauToday,
      user_id: userId,
      history_30d: userHistory,
      usage_streak: usageStreak.currentStreak,
      total_active_days: usageStreak.totalActiveDays,
    });
  } catch (err: any) {
    console.error('Error fetching usage analytics:', err);
    return NextResponse.json({ detail: err.message }, { status: 500 });
  }
}
