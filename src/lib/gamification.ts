export interface LevelData {
  level: number;
  title: string;
  current_xp: number;
  next_level_xp: number;
  level_progress_percentage: number;
}

export const LEVEL_THRESHOLDS = [
  { level: 1, xp: 0, title: 'Novice Forger' },
  { level: 2, xp: 100, title: 'Apprentice Builder' },
  { level: 3, xp: 250, title: 'Routine Seeker' },
  { level: 4, xp: 500, title: 'Habit Artisan' },
  { level: 5, xp: 850, title: 'Discipline Adept' },
  { level: 6, xp: 1300, title: 'Streak Smith' },
  { level: 7, xp: 1900, title: 'Momentum Champion' },
  { level: 8, xp: 2700, title: 'Consistency Knight' },
  { level: 9, xp: 3700, title: 'Forge Veteran' },
  { level: 10, xp: 5000, title: 'Master of Daily Craft' },
  { level: 11, xp: 6600, title: 'Grandmaster of Habit' },
  { level: 12, xp: 8500, title: 'Ironwill Sovereign' },
  { level: 13, xp: 11000, title: 'Living Compounding Legend' },
];

export function getLevelForXp(xp: number): LevelData {
  let currentLevel = 1;
  let title = LEVEL_THRESHOLDS[0].title;
  let baseLevelXp = 0;
  let nextLevelXp = LEVEL_THRESHOLDS[1].xp;

  for (let i = LEVEL_THRESHOLDS.length - 1; i >= 0; i--) {
    if (xp >= LEVEL_THRESHOLDS[i].xp) {
      currentLevel = LEVEL_THRESHOLDS[i].level;
      title = LEVEL_THRESHOLDS[i].title;
      baseLevelXp = LEVEL_THRESHOLDS[i].xp;
      nextLevelXp = i < LEVEL_THRESHOLDS.length - 1 ? LEVEL_THRESHOLDS[i + 1].xp : baseLevelXp + 5000;
      break;
    }
  }

  const xpInLevel = xp - baseLevelXp;
  const xpNeeded = nextLevelXp - baseLevelXp;
  const progressPct = Math.min(100, Math.max(0, Math.round((xpInLevel / Math.max(1, xpNeeded)) * 100)));

  return {
    level: currentLevel,
    title,
    current_xp: xp,
    next_level_xp: nextLevelXp,
    level_progress_percentage: progressPct,
  };
}

export const INITIAL_ACHIEVEMENTS = [
  {
    code: 'first_step',
    name: 'First Step',
    description: 'Complete your first habit and take charge of your routine.',
    icon: 'footprints',
    category: 'milestones',
    xp_reward: 50,
    required_count: 1,
    badge_tier: 'bronze',
  },
  {
    code: 'week_one',
    name: 'Week One',
    description: 'Maintain a 7-day streak on any habit.',
    icon: 'flame',
    category: 'streaks',
    xp_reward: 100,
    required_count: 7,
    badge_tier: 'silver',
  },
  {
    code: 'unstoppable',
    name: 'Unstoppable',
    description: 'Achieve an uninterrupted 30-day streak.',
    icon: 'zap',
    category: 'streaks',
    xp_reward: 500,
    required_count: 30,
    badge_tier: 'gold',
  },
  {
    code: 'century',
    name: 'Century Club',
    description: 'Complete 100 total habit check-ins.',
    icon: 'award',
    category: 'milestones',
    xp_reward: 1000,
    required_count: 100,
    badge_tier: 'platinum',
  },
];
