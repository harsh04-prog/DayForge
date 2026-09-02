import prisma from '@/lib/prisma';
import { formatDate } from '@/lib/streakEngine';

/**
 * Record daily active usage for a user (1 record per user per day in IST).
 * Upserts: increments session_count and updates last_seen if already visited today.
 */
export async function recordDailyUsage(userId: number, platform: string = 'web'): Promise<void> {
  if (!userId) return;
  const todayStr = formatDate(new Date());

  try {
    await prisma.dailyUsage.upsert({
      where: {
        user_id_date: {
          user_id: userId,
          date: todayStr,
        },
      },
      update: {
        session_count: { increment: 1 },
        last_seen: new Date(),
        platform,
      },
      create: {
        user_id: userId,
        date: todayStr,
        platform,
        session_count: 1,
        first_seen: new Date(),
        last_seen: new Date(),
      },
    });
  } catch (err: any) {
    // Non-blocking catch to prevent app stalls
    console.warn(`[DailyUsage] Error recording usage for user ${userId}:`, err.message);
  }
}

/**
 * Get Daily Active Users (DAU) count for a specific date (defaults to today).
 */
export async function getDailyActiveUsersCount(dateStr?: string): Promise<number> {
  const targetDate = dateStr || formatDate(new Date());
  return await prisma.dailyUsage.count({
    where: {
      date: targetDate,
    },
  });
}

/**
 * Get a given user's active usage history for the last N days (defaults to 30 days).
 */
export async function getUserUsageHistory(userId: number, days: number = 30) {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - days);
  const cutoffStr = formatDate(cutoffDate);

  return await prisma.dailyUsage.findMany({
    where: {
      user_id: userId,
      date: {
        gte: cutoffStr,
      },
    },
    select: {
      id: true,
      user_id: true,
      date: true,
      platform: true,
      session_count: true,
      first_seen: true,
      last_seen: true,
    },
    orderBy: {
      date: 'desc',
    },
  });
}

/**
 * Calculate consecutive daily active app usage streak (distinct from habit completion streak).
 */
export async function getUserAppUsageStreak(userId: number): Promise<{ currentStreak: number; totalActiveDays: number }> {
  const usages = await prisma.dailyUsage.findMany({
    where: { user_id: userId },
    select: { date: true },
    orderBy: { date: 'desc' },
  });

  const totalActiveDays = usages.length;
  if (totalActiveDays === 0) return { currentStreak: 0, totalActiveDays: 0 };

  const todayStr = formatDate(new Date());
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = formatDate(yesterday);

  // Check if streak is alive (active today or yesterday)
  const latestDate = usages[0].date;
  if (latestDate !== todayStr && latestDate !== yesterdayStr) {
    return { currentStreak: 0, totalActiveDays };
  }

  let streak = 0;
  let checkDate = new Date(latestDate);

  const usageDateSet = new Set(usages.map((u) => u.date));

  while (usageDateSet.has(formatDate(checkDate))) {
    streak++;
    checkDate.setDate(checkDate.getDate() - 1);
  }

  return { currentStreak: streak, totalActiveDays };
}
