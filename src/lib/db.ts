import fs from 'fs';
import path from 'path';
import { INITIAL_ACHIEVEMENTS, getLevelForXp } from './gamification';
import { calculateHabitStreak, calculateDailyScore, calculateConsistencyRate, formatDate } from './streakEngine';
import { INITIAL_CHALLENGES, ChallengeDefinition } from './challengesData';

export interface UserRecord {
  id: number;
  email: string;
  username: string;
  full_name: string;
  hashed_password: string;
  is_active: boolean;
  is_onboarded: boolean;
  created_at: string;
}

export interface ProfileRecord {
  id: number;
  user_id: number;
  avatar_url?: string | null;
  bio?: string | null;
  level: number;
  xp: number;
  current_streak: number;
  longest_streak: number;
  total_habits_completed: number;
  overall_consistency: number;
  available_shields: number;
  primary_goal?: string | null;
  focus_areas?: string | null;
}

export interface UserSettingsRecord {
  id: number;
  user_id: number;
  habit_reminders: boolean;
  streak_reminders: boolean;
  wellness_reminders: boolean;
  progress_reminders: boolean;
  motivational_messages: boolean;
  weekly_review: boolean;
  challenge_notifications: boolean;
  max_daily_reminders: number;
  sound_enabled: boolean;
  sound_type: string;
  quiet_hours_enabled: boolean;
  quiet_hours_start: string;
  quiet_hours_end: string;
  theme: string;
  week_start_day: string;
  time_format: string;
  preferred_units: string;
  profile_visibility: string;
}

export interface HabitRecord {
  id: number;
  user_id: number;
  title: string;
  description?: string | null;
  category: string;
  color: string;
  icon: string;
  frequency_type: 'daily' | 'specific_days' | 'times_per_week';
  frequency_days?: string | null;
  target_days_per_week?: number | null;
  target_value: number;
  target_unit: string;
  target_type: string;
  time_of_day: string;
  reminder_time?: string | null;
  reminder_enabled: boolean;
  is_active: boolean;
  is_archived: boolean;
  sort_order: number;
  current_streak: number;
  longest_streak: number;
  total_completions: number;
  xp_per_completion: number;
  difficulty: string;
  created_at: string;
  updated_at: string;
}

export interface HabitLogRecord {
  id: number;
  habit_id: number;
  user_id: number;
  date: string; // YYYY-MM-DD
  value: number;
  completed: boolean;
  xp_earned: number;
  note?: string | null;
  completed_at: string;
}

export interface AchievementRecord {
  id: number;
  code: string;
  name: string;
  description: string;
  icon: string;
  category: string;
  xp_reward: number;
  required_count: number;
  badge_tier: string;
}

export interface UserAchievementRecord {
  id: number;
  user_id: number;
  achievement_id: number;
  unlocked_at: string;
}

export interface XPTransactionRecord {
  id: number;
  user_id: number;
  amount: number;
  source_type: string;
  source_id?: number | null;
  description: string;
  created_at: string;
}

export interface NotificationRecord {
  id: number;
  user_id: number;
  habit_id?: number | null;
  notification_type: string;
  category: 'habits' | 'wellness' | 'routine' | 'progress' | 'reflection' | 'motivation';
  priority: 'high' | 'medium' | 'low';
  title: string;
  message: string;
  icon: string;
  action_url?: string | null;
  action_type?: string | null;
  status: 'unread' | 'read' | 'dismissed' | 'snoozed' | 'cancelled';
  interaction_state?: string;
  snoozed_until?: string | null;
  sent_at: string;
  created_at: string;
}

export interface ChallengeRecord extends ChallengeDefinition {
  participants_count: number;
}

export interface UserChallengeRecord {
  id: number;
  user_id: number;
  challenge_id: number;
  joined_at: string;
  started_date: string; // YYYY-MM-DD
  end_date: string; // YYYY-MM-DD
  status: 'active' | 'completed' | 'failed' | 'left';
  current_day: number;
  completed_days: number;
  streak: number;
  updated_at: string;
}

export interface DBData {
  users: UserRecord[];
  profiles: ProfileRecord[];
  user_settings: UserSettingsRecord[];
  habits: HabitRecord[];
  habit_logs: HabitLogRecord[];
  achievements: AchievementRecord[];
  user_achievements: UserAchievementRecord[];
  xp_transactions: XPTransactionRecord[];
  notifications: NotificationRecord[];
  challenges: ChallengeRecord[];
  user_challenges: UserChallengeRecord[];
}

function getWritableFilePath(): string {
  // Check if running on Vercel or in serverless/production
  const isServerless =
    Boolean(process.env.VERCEL) ||
    Boolean(process.env.VERCEL_ENV) ||
    Boolean(process.env.AWS_LAMBDA_FUNCTION_NAME) ||
    Boolean(process.env.LAMBDA_TASK_ROOT) ||
    process.env.NODE_ENV === 'production';

  if (isServerless) {
    return path.join('/tmp', 'dayforge.json');
  }

  try {
    const localDir = path.join(process.cwd(), 'data');
    if (!fs.existsSync(localDir)) {
      fs.mkdirSync(localDir, { recursive: true });
    }
    return path.join(localDir, 'dayforge.json');
  } catch {
    return path.join('/tmp', 'dayforge.json');
  }
}

function getDefaultDB(): DBData {
  const achievements: AchievementRecord[] = INITIAL_ACHIEVEMENTS.map((a, idx) => ({
    id: idx + 1,
    ...a,
  }));

  const challenges: ChallengeRecord[] = INITIAL_CHALLENGES.map((c) => ({
    ...c,
    participants_count: 0,
  }));

  return {
    users: [],
    profiles: [],
    user_settings: [],
    habits: [],
    habit_logs: [],
    achievements,
    user_achievements: [],
    xp_transactions: [],
    notifications: [],
    challenges,
    user_challenges: [],
  };
}

let cachedDB: DBData | null = null;

function loadDB(): DBData {
  if (cachedDB) return cachedDB;

  try {
    const filePath = getWritableFilePath();
    if (fs.existsSync(filePath)) {
      const raw = fs.readFileSync(filePath, 'utf-8');
      if (raw && raw.trim().length > 0) {
        cachedDB = JSON.parse(raw) as DBData;
        
        // Ensure achievements exist
        if (!cachedDB.achievements || cachedDB.achievements.length === 0) {
          cachedDB.achievements = INITIAL_ACHIEVEMENTS.map((a, idx) => ({ id: idx + 1, ...a }));
        }

        // Ensure challenges exist and sync with full 12 challenge definitions
        if (!cachedDB.challenges || cachedDB.challenges.length < INITIAL_CHALLENGES.length) {
          cachedDB.challenges = INITIAL_CHALLENGES.map((c) => ({
            ...c,
            participants_count: 0,
          }));
        }

        if (!cachedDB.user_challenges) cachedDB.user_challenges = [];
        if (!cachedDB.notifications) cachedDB.notifications = [];
        if (!cachedDB.habits) cachedDB.habits = [];
        if (!cachedDB.habit_logs) cachedDB.habit_logs = [];
        if (!cachedDB.users) cachedDB.users = [];
        if (!cachedDB.profiles) cachedDB.profiles = [];
        if (!cachedDB.user_settings) cachedDB.user_settings = [];
        if (!cachedDB.xp_transactions) cachedDB.xp_transactions = [];

        return cachedDB;
      }
    }
  } catch (e) {
    console.warn('Storage read warning (initializing default memory store):', e);
  }

  const def = getDefaultDB();
  cachedDB = def;
  try {
    saveDB(def);
  } catch {}
  return def;
}

function saveDB(dbData: DBData): void {
  cachedDB = dbData;
  try {
    const filePath = getWritableFilePath();
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(filePath, JSON.stringify(dbData, null, 2), 'utf-8');
  } catch (e) {
    console.warn('Storage write warning (active in-memory):', e);
  }
}

export const db = {
  // Users
  getUserByEmail(email: string): UserRecord | undefined {
    const data = loadDB();
    return data.users.find((u) => u.email.toLowerCase() === email.toLowerCase());
  },
  getUserByUsername(username: string): UserRecord | undefined {
    const data = loadDB();
    return data.users.find((u) => u.username.toLowerCase() === username.toLowerCase());
  },
  getUserById(id: number): UserRecord | undefined {
    const data = loadDB();
    return data.users.find((u) => u.id === id);
  },
  createUser(user: Omit<UserRecord, 'id' | 'created_at'>): UserRecord {
    const data = loadDB();
    const id = data.users.length > 0 ? Math.max(...data.users.map((u) => u.id)) + 1 : 1;
    const newRecord: UserRecord = {
      ...user,
      id,
      created_at: new Date().toISOString(),
    };
    data.users.push(newRecord);

    // Create profile
    data.profiles.push({
      id,
      user_id: id,
      avatar_url: 'male_1',
      bio: 'Forging habits one day at a time.',
      level: 1,
      xp: 0,
      current_streak: 0,
      longest_streak: 0,
      total_habits_completed: 0,
      overall_consistency: 0,
      available_shields: 2,
      primary_goal: 'Build Daily Consistency',
      focus_areas: 'Productivity, Health',
    });

    // Create user_settings
    data.user_settings.push({
      id,
      user_id: id,
      habit_reminders: true,
      streak_reminders: true,
      wellness_reminders: true,
      progress_reminders: true,
      motivational_messages: true,
      weekly_review: true,
      challenge_notifications: true,
      max_daily_reminders: 10,
      sound_enabled: true,
      sound_type: 'bell',
      quiet_hours_enabled: false,
      quiet_hours_start: '22:00',
      quiet_hours_end: '07:00',
      theme: 'light',
      week_start_day: 'monday',
      time_format: '12h',
      preferred_units: 'metric',
      profile_visibility: 'public',
    });

    saveDB(data);
    return newRecord;
  },
  updateUser(id: number, updates: Partial<UserRecord>): UserRecord | null {
    const data = loadDB();
    const idx = data.users.findIndex((u) => u.id === id);
    if (idx === -1) return null;
    data.users[idx] = { ...data.users[idx], ...updates };
    saveDB(data);
    return data.users[idx];
  },

  // Profiles
  getProfileByUserId(userId: number): ProfileRecord | undefined {
    const data = loadDB();
    return data.profiles.find((p) => p.user_id === userId);
  },
  updateProfile(userId: number, updates: Partial<ProfileRecord>): ProfileRecord | null {
    const data = loadDB();
    const idx = data.profiles.findIndex((p) => p.user_id === userId);
    if (idx === -1) return null;
    data.profiles[idx] = { ...data.profiles[idx], ...updates };
    saveDB(data);
    return data.profiles[idx];
  },

  // User Settings
  getSettingsByUserId(userId: number): UserSettingsRecord | undefined {
    const data = loadDB();
    return data.user_settings.find((s) => s.user_id === userId);
  },
  updateSettings(userId: number, updates: Partial<UserSettingsRecord>): UserSettingsRecord | null {
    const data = loadDB();
    const idx = data.user_settings.findIndex((s) => s.user_id === userId);
    if (idx === -1) return null;
    data.user_settings[idx] = { ...data.user_settings[idx], ...updates };
    saveDB(data);
    return data.user_settings[idx];
  },

  // Habits
  getHabitsByUserId(userId: number, includeArchived = false): HabitRecord[] {
    const data = loadDB();
    return data.habits.filter(
      (h) => h.user_id === userId && (includeArchived ? true : !h.is_archived)
    );
  },
  getHabitById(id: number): HabitRecord | undefined {
    const data = loadDB();
    return data.habits.find((h) => h.id === id);
  },
  createHabit(habit: Omit<HabitRecord, 'id' | 'created_at' | 'updated_at'>): HabitRecord {
    const data = loadDB();
    const id = data.habits.length > 0 ? Math.max(...data.habits.map((h) => h.id)) + 1 : 1;
    const now = new Date().toISOString();
    const newRecord: HabitRecord = {
      ...habit,
      id,
      created_at: now,
      updated_at: now,
    };
    data.habits.push(newRecord);
    saveDB(data);
    return newRecord;
  },
  updateHabit(id: number, updates: Partial<HabitRecord>): HabitRecord | null {
    const data = loadDB();
    const idx = data.habits.findIndex((h) => h.id === id);
    if (idx === -1) return null;
    data.habits[idx] = {
      ...data.habits[idx],
      ...updates,
      updated_at: new Date().toISOString(),
    };
    saveDB(data);
    return data.habits[idx];
  },
  deleteHabit(id: number): boolean {
    const data = loadDB();
    const idx = data.habits.findIndex((h) => h.id === id);
    if (idx === -1) return false;
    data.habits.splice(idx, 1);
    data.habit_logs = data.habit_logs.filter((l) => l.habit_id !== id);
    saveDB(data);
    return true;
  },

  // Habit Logs
  getHabitLogs(userId: number, habitId?: number, date?: string): HabitLogRecord[] {
    const data = loadDB();
    return data.habit_logs.filter((l) => {
      if (l.user_id !== userId) return false;
      if (habitId && l.habit_id !== habitId) return false;
      if (date && l.date !== date) return false;
      return true;
    });
  },
  getLogByHabitAndDate(habitId: number, date: string): HabitLogRecord | undefined {
    const data = loadDB();
    return data.habit_logs.find((l) => l.habit_id === habitId && l.date === date);
  },
  createHabitLog(log: Omit<HabitLogRecord, 'id' | 'completed_at'>): HabitLogRecord {
    const data = loadDB();
    const id = data.habit_logs.length > 0 ? Math.max(...data.habit_logs.map((l) => l.id)) + 1 : 1;
    const newRecord: HabitLogRecord = {
      ...log,
      id,
      completed_at: new Date().toISOString(),
    };
    data.habit_logs.push(newRecord);
    saveDB(data);
    return newRecord;
  },
  deleteHabitLog(id: number): boolean {
    const data = loadDB();
    const idx = data.habit_logs.findIndex((l) => l.id === id);
    if (idx === -1) return false;
    data.habit_logs.splice(idx, 1);
    saveDB(data);
    return true;
  },

  // Gamification & XP
  addXp(userId: number, amount: number, sourceType: string, sourceId?: number, description = ''): void {
    const data = loadDB();
    const profile = data.profiles.find((p) => p.user_id === userId);
    if (!profile) return;

    profile.xp += amount;
    profile.level = getLevelForXp(profile.xp).level;

    const txId = data.xp_transactions.length > 0 ? Math.max(...data.xp_transactions.map((t) => t.id)) + 1 : 1;
    data.xp_transactions.push({
      id: txId,
      user_id: userId,
      amount,
      source_type: sourceType,
      source_id: sourceId || null,
      description,
      created_at: new Date().toISOString(),
    });
    saveDB(data);
  },

  // Recalculate User & Habit Streaks
  recalculateUserStats(userId: number): {
    currentStreak: number;
    longestStreak: number;
    totalCompleted: number;
    consistencyRate: number;
    dailyScore: number;
  } {
    const data = loadDB();
    const userHabits = data.habits.filter((h) => h.user_id === userId && !h.is_archived);
    const userLogs = data.habit_logs.filter((l) => l.user_id === userId && l.completed);

    const completedDates = new Set(userLogs.map((l) => l.date));
    const today = formatDate(new Date());

    // Update each habit streak
    let maxHabitStreak = 0;
    let maxLongestStreak = 0;

    userHabits.forEach((habit) => {
      const hLogs = userLogs.filter((l) => l.habit_id === habit.id);
      const hDates = new Set(hLogs.map((l) => l.date));
      const streakInfo = calculateHabitStreak(
        hDates,
        habit.frequency_type,
        habit.frequency_days,
        habit.target_days_per_week
      );

      habit.current_streak = streakInfo.current_streak;
      habit.longest_streak = streakInfo.longest_streak;
      habit.total_completions = hLogs.length;

      maxHabitStreak = Math.max(maxHabitStreak, streakInfo.current_streak);
      maxLongestStreak = Math.max(maxLongestStreak, streakInfo.longest_streak);
    });

    const userStreak = calculateHabitStreak(completedDates);
    const consistency = calculateConsistencyRate(completedDates, 30);

    const todayCompleted = userHabits.filter((h) => {
      const log = userLogs.find((l) => l.habit_id === h.id && l.date === today);
      return log && log.completed;
    }).length;

    const dailyScore = calculateDailyScore(userHabits.length, todayCompleted, userStreak.current_streak, consistency);

    const profile = data.profiles.find((p) => p.user_id === userId);
    if (profile) {
      profile.current_streak = userStreak.current_streak;
      profile.longest_streak = Math.max(userStreak.longest_streak, profile.longest_streak, maxLongestStreak);
      profile.total_habits_completed = userLogs.length;
      profile.overall_consistency = consistency;
    }

    saveDB(data);

    return {
      currentStreak: userStreak.current_streak,
      longestStreak: profile ? profile.longest_streak : userStreak.longest_streak,
      totalCompleted: userLogs.length,
      consistencyRate: consistency,
      dailyScore,
    };
  },

  // Achievements
  getAchievements(userId: number): Array<AchievementRecord & { unlocked: boolean; unlocked_at?: string }> {
    const data = loadDB();
    const userAchs = data.user_achievements.filter((ua) => ua.user_id === userId);
    return data.achievements.map((a) => {
      const unlocked = userAchs.find((ua) => ua.achievement_id === a.id);
      return {
        ...a,
        unlocked: Boolean(unlocked),
        unlocked_at: unlocked?.unlocked_at,
      };
    });
  },

  // Notifications
  getNotificationsByUserId(userId: number): NotificationRecord[] {
    const data = loadDB();
    let userNotifs = data.notifications.filter((n) => n.user_id === userId);
    
    // Seed starter notification if none exist
    if (userNotifs.length === 0) {
      const starter: NotificationRecord = {
        id: data.notifications.length > 0 ? Math.max(...data.notifications.map((n) => n.id)) + 1 : 1,
        user_id: userId,
        habit_id: null,
        notification_type: 'welcome',
        category: 'motivation',
        priority: 'medium',
        title: 'Welcome to DayForge Companion! 👋',
        message: 'Your personal habit forge is active. Check in on your daily routines to build compounding momentum.',
        icon: 'sparkles',
        action_url: '/',
        action_type: 'navigate',
        status: 'unread',
        sent_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
      };
      data.notifications.push(starter);
      saveDB(data);
      userNotifs = [starter];
    }
    
    return userNotifs;
  },

  getNotificationById(id: number): NotificationRecord | undefined {
    const data = loadDB();
    return data.notifications.find((n) => n.id === id);
  },

  updateNotification(id: number, updates: Partial<NotificationRecord>): NotificationRecord | null {
    const data = loadDB();
    const idx = data.notifications.findIndex((n) => n.id === id);
    if (idx === -1) return null;

    data.notifications[idx] = {
      ...data.notifications[idx],
      ...updates,
    };
    saveDB(data);
    return data.notifications[idx];
  },

  markAllNotificationsAsRead(userId: number): void {
    const data = loadDB();
    data.notifications.forEach((n) => {
      if (n.user_id === userId) {
        n.status = 'read';
      }
    });
    saveDB(data);
  },

  getNotificationBudget(userId: number): {
    sent_today_count: number;
    max_daily_budget: number;
    remaining_today: number;
    quiet_hours_active: boolean;
  } {
    const data = loadDB();
    const settings = data.user_settings.find((s) => s.user_id === userId);
    const maxBudget = settings?.max_daily_reminders || 10;
    
    const today = new Date().toISOString().slice(0, 10);
    const sentToday = data.notifications.filter(
      (n) => n.user_id === userId && n.created_at.startsWith(today)
    ).length;

    // Check quiet hours
    let quietHoursActive = false;
    if (settings?.quiet_hours_start && settings?.quiet_hours_end) {
      const now = new Date();
      const currentMinutes = now.getHours() * 60 + now.getMinutes();
      const [startH, startM] = settings.quiet_hours_start.split(':').map(Number);
      const [endH, endM] = settings.quiet_hours_end.split(':').map(Number);
      const startMinutes = startH * 60 + (startM || 0);
      const endMinutes = endH * 60 + (endM || 0);

      if (startMinutes > endMinutes) {
        // Overnight quiet hours (e.g. 22:00 to 07:00)
        quietHoursActive = currentMinutes >= startMinutes || currentMinutes <= endMinutes;
      } else {
        quietHoursActive = currentMinutes >= startMinutes && currentMinutes <= endMinutes;
      }
    }

    return {
      sent_today_count: sentToday,
      max_daily_budget: maxBudget,
      remaining_today: Math.max(0, maxBudget - sentToday),
      quiet_hours_active: quietHoursActive,
    };
  },

  createNotification(notif: Partial<NotificationRecord> & { user_id: number; title: string; message: string }): NotificationRecord {
    const data = loadDB();
    const id = data.notifications.length > 0 ? Math.max(...data.notifications.map((n) => n.id)) + 1 : 1;
    const newRecord: NotificationRecord = {
      id,
      user_id: notif.user_id,
      habit_id: notif.habit_id || null,
      notification_type: notif.notification_type || 'companion',
      category: notif.category || 'motivation',
      priority: notif.priority || 'medium',
      title: notif.title,
      message: notif.message,
      icon: notif.icon || 'bell',
      action_url: notif.action_url || '/',
      action_type: notif.action_type || 'navigate',
      status: notif.status || 'unread',
      sent_at: notif.sent_at || new Date().toISOString(),
      created_at: new Date().toISOString(),
    };
    data.notifications.push(newRecord);
    saveDB(data);
    return newRecord;
  },

  // ==========================================
  // CHALLENGES ENGINE (REAL PERSISTENCE & EVALUATION)
  // ==========================================
  getChallenges(userId: number) {
    const data = loadDB();
    const today = formatDate(new Date());
    const userHabits = data.habits.filter((h) => h.user_id === userId && !h.is_archived);
    const userLogs = data.habit_logs.filter((l) => l.user_id === userId && l.completed);
    const completedDates = new Set(userLogs.map((l) => l.date));

    return data.challenges.map((ch) => {
      const userCh = data.user_challenges.find(
        (uc) => uc.user_id === userId && uc.challenge_id === ch.id
      );

      // Real participants count (distinct users joined)
      const participantsCount = new Set(
        data.user_challenges.filter((uc) => uc.challenge_id === ch.id && uc.status !== 'left').map((uc) => uc.user_id)
      ).size;

      if (!userCh || userCh.status === 'left') {
        return {
          ...ch,
          is_joined: false,
          status: 'available',
          current_day: 0,
          completed_days: 0,
          remaining_days: ch.duration_days,
          progress_days: 0,
          progress_percentage: 0,
          participants_count: participantsCount,
        };
      }

      // Calculate elapsed days
      const startDate = new Date(userCh.started_date);
      const todayDate = new Date(today);
      const diffTime = todayDate.getTime() - startDate.getTime();
      const elapsedDays = Math.max(0, Math.floor(diffTime / (1000 * 60 * 60 * 24)));
      const currentDay = Math.min(ch.duration_days, elapsedDays + 1);
      const remainingDays = Math.max(0, ch.duration_days - elapsedDays);

      // Count completed days within the challenge window
      let completedDays = 0;
      let isBroken = false;

      for (let i = 0; i <= elapsedDays && i < ch.duration_days; i++) {
        const d = new Date(startDate);
        d.setDate(d.getDate() + i);
        const dStr = formatDate(d);

        let dayPassed = false;
        if (ch.target_category) {
          const catHabitIds = new Set(userHabits.filter((h) => h.category.toLowerCase() === ch.target_category?.toLowerCase()).map((h) => h.id));
          dayPassed = userLogs.some((l) => l.date === dStr && catHabitIds.has(l.habit_id));
        } else {
          dayPassed = completedDates.has(dStr);
        }

        if (dayPassed) {
          completedDays++;
        } else if (ch.is_strict && dStr < today) {
          // A past day was completely missed in a strict challenge!
          isBroken = true;
        }
      }

      let challengeStatus = userCh.status;
      if (isBroken && ch.is_strict) {
        challengeStatus = 'failed';
        userCh.status = 'failed';
      } else if (completedDays >= ch.duration_days) {
        challengeStatus = 'completed';
        if (userCh.status !== 'completed') {
          userCh.status = 'completed';
          // Award XP bonus
          db.addXp(userId, ch.xp_reward, 'challenge_completion', ch.id, `Completed Challenge: ${ch.title}`);
        }
      } else {
        challengeStatus = 'active';
        userCh.status = 'active';
      }

      userCh.current_day = currentDay;
      userCh.completed_days = completedDays;
      userCh.updated_at = new Date().toISOString();
      saveDB(data);

      const progressPercentage = Math.min(100, Math.round((completedDays / ch.duration_days) * 100));

      return {
        ...ch,
        is_joined: challengeStatus === 'active' || challengeStatus === 'completed' || challengeStatus === 'failed',
        status: challengeStatus,
        current_day: currentDay,
        completed_days: completedDays,
        remaining_days: remainingDays,
        progress_days: completedDays,
        progress_percentage: progressPercentage,
        started_date: userCh.started_date,
        end_date: userCh.end_date,
        participants_count: participantsCount,
      };
    });
  },

  joinChallenge(userId: number, challengeId: number) {
    const data = loadDB();
    const ch = data.challenges.find((c) => c.id === challengeId);
    if (!ch) return null;

    const today = formatDate(new Date());
    const endDateObj = new Date();
    endDateObj.setDate(endDateObj.getDate() + ch.duration_days);
    const endDate = formatDate(endDateObj);

    let userCh = data.user_challenges.find(
      (uc) => uc.user_id === userId && uc.challenge_id === challengeId
    );

    const now = new Date().toISOString();
    if (userCh) {
      userCh.status = 'active';
      userCh.started_date = today;
      userCh.end_date = endDate;
      userCh.current_day = 1;
      userCh.completed_days = 0;
      userCh.streak = 0;
      userCh.updated_at = now;
    } else {
      const id = data.user_challenges.length > 0 ? Math.max(...data.user_challenges.map((u) => u.id)) + 1 : 1;
      data.user_challenges.push({
        id,
        user_id: userId,
        challenge_id: challengeId,
        joined_at: now,
        started_date: today,
        end_date: endDate,
        status: 'active',
        current_day: 1,
        completed_days: 0,
        streak: 0,
        updated_at: now,
      });
    }

    // Companion notification
    db.createNotification({
      user_id: userId,
      title: `Joined Challenge: ${ch.title} 🏆`,
      message: `You're in! Target: ${ch.duration_days} days. ${ch.rule_description}`,
      category: 'routine',
      priority: 'high',
      icon: ch.icon || 'trophy',
      action_url: '/challenges',
    });

    saveDB(data);
    return { success: true, message: `Successfully joined ${ch.title}!` };
  },

  leaveChallenge(userId: number, challengeId: number) {
    const data = loadDB();
    const userCh = data.user_challenges.find(
      (uc) => uc.user_id === userId && uc.challenge_id === challengeId
    );
    if (!userCh) return null;

    userCh.status = 'left';
    userCh.updated_at = new Date().toISOString();
    saveDB(data);
    return { success: true, message: 'You have left the challenge.' };
  },

  // ==========================================
  // REAL CALENDAR & ACTIVITY ENGINE
  // ==========================================
  getMonthActivity(userId: number, year: number, month: number) {
    const data = loadDB();
    const userHabits = data.habits.filter((h) => h.user_id === userId && !h.is_archived);
    const userLogs = data.habit_logs.filter((l) => l.user_id === userId && l.completed);

    // Number of days in this month
    const daysInMonth = new Date(year, month, 0).getDate();
    const monthStr = String(month).padStart(2, '0');
    const today = formatDate(new Date());

    const days = [];
    for (let day = 1; day <= daysInMonth; day++) {
      const dayStr = String(day).padStart(2, '0');
      const dateKey = `${year}-${monthStr}-${dayStr}`;

      const logsForDate = userLogs.filter((l) => l.date === dateKey);
      const completedHabits = logsForDate.map((l) => {
        const h = userHabits.find((hab) => hab.id === l.habit_id);
        return {
          log_id: l.id,
          habit_id: l.habit_id,
          title: h?.title || 'Habit',
          category: h?.category || 'General',
          color: h?.color || '#6C5CE7',
          icon: h?.icon || 'check',
          xp_earned: l.xp_earned,
        };
      });

      days.push({
        date: dateKey,
        day,
        total_completed: completedHabits.length,
        total_scheduled: userHabits.length,
        completion_rate: userHabits.length > 0 ? Math.round((completedHabits.length / userHabits.length) * 100) : 0,
        completed_habits: completedHabits,
        is_today: dateKey === today,
      });
    }

    return {
      year,
      month,
      days,
    };
  },

  getDateActivity(userId: number, dateStr: string) {
    const data = loadDB();
    const userHabits = data.habits.filter((h) => h.user_id === userId && !h.is_archived);
    const userLogs = data.habit_logs.filter((l) => l.user_id === userId && l.date === dateStr);

    const completed = userLogs.filter((l) => l.completed).map((l) => {
      const h = userHabits.find((hab) => hab.id === l.habit_id);
      return {
        ...l,
        title: h?.title || 'Habit',
        category: h?.category || 'General',
        color: h?.color || '#6C5CE7',
        icon: h?.icon || 'check',
      };
    });

    const pending = userHabits.filter((h) => !userLogs.some((l) => l.habit_id === h.id && l.completed));

    return {
      date: dateStr,
      completed_count: completed.length,
      total_scheduled: userHabits.length,
      completed,
      pending,
    };
  },

  addXP(userId: number, amount: number, sourceType: string, sourceId?: number, description = ''): void {
    db.addXp(userId, amount, sourceType, sourceId, description);
  },

  saveHabitLog(log: Omit<HabitLogRecord, 'id' | 'completed_at'>): HabitLogRecord {
    return db.createHabitLog(log);
  },

  getLogsByUserId(userId: number): HabitLogRecord[] {
    return db.getHabitLogs(userId);
  },

  getLogsByHabitId(habitId: number): HabitLogRecord[] {
    const data = loadDB();
    return data.habit_logs.filter((l) => l.habit_id === habitId);
  },
};
