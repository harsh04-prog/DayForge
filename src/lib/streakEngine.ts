export interface HabitScheduleInfo {
  frequency_type: 'daily' | 'specific_days' | 'times_per_week';
  frequency_days?: string | null; // e.g. "mon,tue,wed,thu,fri"
  target_days_per_week?: number | null;
}

export function formatDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function parseDate(dateStr: string): Date {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function isDayScheduled(
  date: Date,
  frequencyType: string,
  frequencyDays?: string | null,
  targetDaysPerWeek?: number | null
): boolean {
  if (frequencyType === 'daily') return true;

  if (frequencyType === 'specific_days' && frequencyDays) {
    const dayMap: Record<number, string> = {
      0: 'sun',
      1: 'mon',
      2: 'tue',
      3: 'wed',
      4: 'thu',
      5: 'fri',
      6: 'sat',
    };
    const dayName = dayMap[date.getDay()];
    const allowed = frequencyDays.toLowerCase().split(',').map((s) => s.trim());
    return allowed.includes(dayName);
  }

  if (frequencyType === 'times_per_week') {
    return true; // Evaluated weekly
  }

  return true;
}

/**
 * Calculates current and longest streak based on calendar days
 */
export function calculateHabitStreak(
  completedDates: Set<string>,
  frequencyType: string = 'daily',
  frequencyDays?: string | null,
  targetDaysPerWeek?: number | null,
  referenceDate: Date = new Date(),
  shieldDates: Set<string> = new Set()
): { current_streak: number; longest_streak: number } {
  if (completedDates.size === 0) {
    return { current_streak: 0, longest_streak: 0 };
  }

  const todayStr = formatDate(referenceDate);
  const isDoneToday = completedDates.has(todayStr);

  // Determine starting point for backward traversal
  let checkDate = new Date(referenceDate);
  if (!isDoneToday) {
    checkDate.setDate(checkDate.getDate() - 1);
  }

  let currentStreak = 0;
  let streakBroken = false;
  let iterDate = new Date(checkDate);

  // Calculate current streak
  for (let i = 0; i < 365; i++) {
    const dateStr = formatDate(iterDate);
    const scheduled = isDayScheduled(iterDate, frequencyType, frequencyDays, targetDaysPerWeek);

    if (scheduled) {
      const completed = completedDates.has(dateStr);
      const shielded = shieldDates.has(dateStr);

      if (completed || shielded) {
        currentStreak++;
      } else {
        streakBroken = true;
        break;
      }
    }

    iterDate.setDate(iterDate.getDate() - 1);
  }

  // Calculate longest historical streak
  let longestStreak = currentStreak;
  let runningStreak = 0;

  const sortedDates = Array.from(completedDates).sort();
  if (sortedDates.length > 0) {
    const start = parseDate(sortedDates[0]);
    const end = parseDate(todayStr);

    let curr = new Date(start);
    while (curr <= end) {
      const dStr = formatDate(curr);
      const scheduled = isDayScheduled(curr, frequencyType, frequencyDays, targetDaysPerWeek);

      if (scheduled) {
        if (completedDates.has(dStr) || shieldDates.has(dStr)) {
          runningStreak++;
          longestStreak = Math.max(longestStreak, runningStreak);
        } else {
          runningStreak = 0;
        }
      }
      curr.setDate(curr.getDate() + 1);
    }
  }

  return {
    current_streak: currentStreak,
    longest_streak: Math.max(currentStreak, longestStreak),
  };
}

/**
 * Calculates daily score (0 - 100)
 */
export function calculateDailyScore(
  totalScheduled: number,
  totalCompleted: number,
  activeStreak: number,
  recentConsistency: number = 80
): number {
  if (totalScheduled === 0) return 100;

  const completionPct = totalCompleted / Math.max(1, totalScheduled);
  const completionScore = completionPct * 60; // Up to 60 pts
  const consistencyScore = (Math.min(100, recentConsistency) / 100) * 25; // Up to 25 pts
  const streakBonus = Math.min(15, activeStreak * 1.5); // Up to 15 pts

  return Math.min(100, Math.round(completionScore + consistencyScore + streakBonus));
}

export function calculateConsistencyRate(
  completedDates: Set<string>,
  daysLookback: number = 30,
  referenceDate: Date = new Date()
): number {
  let scheduledDays = 0;
  let completedDays = 0;

  const curr = new Date(referenceDate);
  for (let i = 0; i < daysLookback; i++) {
    const dStr = formatDate(curr);
    scheduledDays++;
    if (completedDates.has(dStr)) {
      completedDays++;
    }
    curr.setDate(curr.getDate() - 1);
  }

  if (scheduledDays === 0) return 100;
  return Math.round((completedDays / scheduledDays) * 100);
}
