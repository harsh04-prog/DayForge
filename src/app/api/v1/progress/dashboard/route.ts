import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getUserIdFromRequest, getUserVaultDataFromRequest, createUserDataVaultToken } from '@/lib/auth';
import { getLevelForXp } from '@/lib/gamification';
import { formatDate } from '@/lib/streakEngine';

export async function GET(request: Request) {
  const userId = getUserIdFromRequest(request);
  if (!userId) return NextResponse.json({ detail: 'Unauthorized' }, { status: 401 });

  // Reconcile client's vault data if container has missing data
  const userVault = getUserVaultDataFromRequest(request);
  if (userVault && Number(userVault.userId) === Number(userId)) {
    db.syncUserDataFromVault(userId, userVault);
  }

  const user = db.getUserById(userId);
  const profile = db.getProfileByUserId(userId);
  const stats = db.recalculateUserStats(userId);
  const rawHabits = db.getHabitsByUserId(userId, false);
  const today = formatDate(new Date());

  const levelInfo = getLevelForXp(profile?.xp || 0);

  const enrichedHabits = rawHabits.map((h) => {
    const todayLog = db.getLogByHabitAndDate(h.id, today);
    const isCompleted = Boolean(todayLog?.completed);
    const habitName = h.name || h.title || 'Daily Habit';
    return {
      ...h,
      title: habitName,
      name: habitName,
      today_completed: isCompleted,
      today_progress: isCompleted ? (h.target_value || 1) : 0,
      today_log: todayLog || null,
      completed_today: isCompleted,
    };
  });

  const totalScheduled = enrichedHabits.length;
  const totalCompleted = enrichedHabits.filter((h) => h.today_completed).length;
  const completionPercentage = totalScheduled > 0 ? Math.round((totalCompleted / totalScheduled) * 100) : 0;

  const dailyScoreBreakdown = {
    total_score: stats.dailyScore,
    completion_score: Math.round((completionPercentage / 100) * 60),
    consistency_score: Math.round((stats.consistencyRate / 100) * 25),
    streak_bonus: Math.min(15, stats.currentStreak * 1.5),
    habits_completed: totalCompleted,
    total_habits: totalScheduled,
    completion_percentage: completionPercentage,
    summary: totalCompleted === totalScheduled && totalScheduled > 0
      ? 'Perfect Day! All scheduled habits completed.'
      : `${totalCompleted} of ${totalScheduled} habits completed today.`,
  };

  const latestVaultData = db.getUserVaultData(userId);
  const vaultToken = createUserDataVaultToken(latestVaultData);

  const res = NextResponse.json({
    profile: profile || {
      id: 1,
      user_id: userId,
      full_name: user?.full_name || '',
      avatar_url: 'male_1',
      level: levelInfo.level,
      xp: levelInfo.current_xp,
      available_shields: 2,
    },
    level_info: levelInfo,
    daily_score: dailyScoreBreakdown,
    today_completed_count: totalCompleted,
    today_scheduled_count: totalScheduled,
    today_completion_rate: completionPercentage,
    active_streak: stats.currentStreak,
    habits: enrichedHabits,
    today_habits: enrichedHabits,
    streaks: {
      current_streak: stats.currentStreak,
      longest_streak: stats.longestStreak,
      consistency_rate: stats.consistencyRate,
      shield_active: false,
    },
    character: {
      level: levelInfo.level,
      title: levelInfo.title,
      xp: levelInfo.current_xp,
      next_level_xp: levelInfo.next_level_xp,
      level_progress_percentage: levelInfo.level_progress_percentage,
      available_shields: profile?.available_shields || 2,
    },
    unseen_achievements: [],
    recent_achievements: db.getAchievements(userId).filter((a) => a.unlocked).slice(0, 3),
    vault_token: vaultToken,
  });

  res.headers.set('x-dayforge-vault-token', vaultToken);
  return res;
}
