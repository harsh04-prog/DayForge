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
  name?: string;
  description?: string | null;
  category: string;
  color: string;
  icon: string;
  frequency_type: 'daily' | 'specific_days' | 'times_per_week';
  frequency_days?: string | null;
  target_days_per_week?: number | null;
  target_value: number;
  target_unit: string;
  unit?: string;
  target_type: string;
  habit_type?: 'binary' | 'quantitative' | string;
  time_of_day: string;
  preferred_time?: string;
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

export interface UserChallengeLogRecord {
  id: number;
  user_id: number;
  challenge_id: number;
  date: string; // YYYY-MM-DD
  progress_value: number;
  target_value: number;
  completed: boolean;
  xp_awarded: number;
  logged_at: string;
}

export interface TodoRecord {
  id: number;
  user_id: number;
  title: string;
  description?: string | null;
  due_date?: string | null; // YYYY-MM-DD
  reminder_time?: string | null; // HH:MM
  reminder_enabled?: boolean;
  priority?: 'low' | 'medium' | 'high';
  category?: string;
  completed: boolean;
  completed_at?: string | null;
  sort_order: number;
  created_at: string;
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
  user_challenge_logs: UserChallengeLogRecord[];
  todos: TodoRecord[];
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
    user_challenge_logs: [],
    todos: [],
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
        cachedDB.challenges = INITIAL_CHALLENGES.map((def) => {
          const existing = cachedDB?.challenges?.find((c) => c.id === def.id || c.code === def.code);
          return {
            ...def,
            participants_count: existing?.participants_count || 0,
          };
        });

        if (!cachedDB.user_challenges) cachedDB.user_challenges = [];
        if (!cachedDB.user_challenge_logs) cachedDB.user_challenge_logs = [];
        if (!cachedDB.todos) cachedDB.todos = [];
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

  syncUserFromToken(tokenUser: { userId: number; email: string; username: string; full_name: string; is_active?: boolean; is_onboarded?: boolean }): UserRecord {
    const data = loadDB();
    let existing = data.users.find(
      (u) => u.id === tokenUser.userId || u.email.toLowerCase() === tokenUser.email.toLowerCase()
    );
    if (existing) {
      return existing;
    }
    const newUser: UserRecord = {
      id: tokenUser.userId,
      email: tokenUser.email.toLowerCase().trim(),
      username: tokenUser.username.toLowerCase().trim() || `user_${tokenUser.userId}`,
      full_name: tokenUser.full_name || 'Hero',
      hashed_password: '',
      is_active: tokenUser.is_active ?? true,
      is_onboarded: tokenUser.is_onboarded ?? false,
      created_at: new Date().toISOString(),
    };
    data.users.push(newUser);

    if (!data.profiles.some((p) => p.user_id === tokenUser.userId)) {
      data.profiles.push({
        id: tokenUser.userId,
        user_id: tokenUser.userId,
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
    }

    if (!data.user_settings.some((s) => s.user_id === tokenUser.userId)) {
      data.user_settings.push({
        id: tokenUser.userId,
        user_id: tokenUser.userId,
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
    }

    saveDB(data);
    return newUser;
  },

  syncUserFromVault(vault: { id: number; email: string; username: string; full_name: string; hashed_password: string; is_active?: boolean; is_onboarded?: boolean; created_at?: string }): UserRecord {
    const data = loadDB();
    let existing = data.users.find(
      (u) => u.id === vault.id || u.email.toLowerCase() === vault.email.toLowerCase()
    );
    if (existing) {
      if (vault.hashed_password && (!existing.hashed_password || existing.hashed_password.length < 5)) {
        existing.hashed_password = vault.hashed_password;
        saveDB(data);
      }
      return existing;
    }

    const newUser: UserRecord = {
      id: vault.id,
      email: vault.email.toLowerCase().trim(),
      username: vault.username.toLowerCase().trim() || `user_${vault.id}`,
      full_name: vault.full_name || 'Hero',
      hashed_password: vault.hashed_password,
      is_active: vault.is_active ?? true,
      is_onboarded: vault.is_onboarded ?? false,
      created_at: vault.created_at || new Date().toISOString(),
    };
    data.users.push(newUser);

    if (!data.profiles.some((p) => p.user_id === vault.id)) {
      data.profiles.push({
        id: vault.id,
        user_id: vault.id,
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
    }

    if (!data.user_settings.some((s) => s.user_id === vault.id)) {
      data.user_settings.push({
        id: vault.id,
        user_id: vault.id,
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
    }

    saveDB(data);
    return newUser;
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
  getHabitsByUserId(userId: number, includeArchived = false): any[] {
    const data = loadDB();
    return data.habits
      .filter((h) => h.user_id === userId && (includeArchived ? true : !h.is_archived))
      .map((h) => {
        const habitTitle = h.title || (h as any).name || 'Daily Habit';
        return {
          ...h,
          title: habitTitle,
          name: habitTitle,
          preferred_time: h.preferred_time || h.time_of_day || 'morning',
          time_of_day: h.time_of_day || h.preferred_time || 'morning',
          target_value: h.target_value || 1,
          target_unit: h.target_unit || (h as any).unit || 'times',
          unit: h.target_unit || (h as any).unit || 'times',
          habit_type: h.habit_type || 'binary',
          category: h.category || 'health',
          color: h.color || '#6C5CE7',
          icon: h.icon || 'activity',
          difficulty: h.difficulty || 'medium',
          current_streak: h.current_streak || 0,
          longest_streak: h.longest_streak || 0,
          total_completions: h.total_completions || 0,
          is_active: true,
          is_archived: false,
        };
      });
  },
  getHabitById(id: number): any | undefined {
    const data = loadDB();
    const h = data.habits.find((hab) => hab.id === id);
    if (!h) return undefined;
    const habitTitle = h.title || (h as any).name || 'Daily Habit';
    return {
      ...h,
      title: habitTitle,
      name: habitTitle,
      preferred_time: h.preferred_time || h.time_of_day || 'morning',
      time_of_day: h.time_of_day || h.preferred_time || 'morning',
      target_value: h.target_value || 1,
      target_unit: h.target_unit || (h as any).unit || 'times',
      unit: h.target_unit || (h as any).unit || 'times',
    };
  },
  createHabit(habit: any): HabitRecord {
    const data = loadDB();
    const id = data.habits.length > 0 ? Math.max(...data.habits.map((h) => h.id)) + 1 : 1;
    const now = new Date().toISOString();
    const habitTitle = habit.title || habit.name || 'Daily Habit';
    const targetVal = habit.target_value !== undefined ? (Number(habit.target_value) > 0 ? Number(habit.target_value) : 1) : 1;
    const unit = habit.unit || habit.target_unit || (targetVal > 1 ? 'units' : 'times');

    const newRecord: HabitRecord = {
      ...habit,
      id,
      title: habitTitle,
      name: habitTitle,
      description: habit.description || null,
      preferred_time: habit.preferred_time || habit.time_of_day || 'anytime',
      time_of_day: habit.time_of_day || habit.preferred_time || 'anytime',
      target_value: targetVal,
      target_unit: unit,
      unit: unit,
      target_type: habit.target_type || (targetVal > 1 ? 'numeric' : 'boolean'),
      habit_type: habit.habit_type || (targetVal > 1 ? 'quantitative' : 'binary'),
      category: habit.category || 'General',
      color: habit.color || '#6C5CE7',
      icon: habit.icon || 'sparkles',
      frequency_type: habit.frequency_type || 'daily',
      frequency_days: habit.frequency_days || '0,1,2,3,4,5,6',
      reminder_time: habit.reminder_time || null,
      reminder_enabled: Boolean(habit.reminder_enabled || habit.reminder_time),
      is_active: true,
      is_archived: false,
      sort_order: habit.sort_order ?? data.habits.length,
      current_streak: 0,
      longest_streak: 0,
      total_completions: 0,
      xp_per_completion: habit.xp_per_completion || (habit.difficulty === 'hard' ? 15 : habit.difficulty === 'easy' ? 5 : 10),
      difficulty: habit.difficulty || 'medium',
      created_at: now,
      updated_at: now,
    };
    data.habits.push(newRecord);
    saveDB(data);
    return newRecord;
  },
  updateHabit(id: number, updates: any): HabitRecord | null {
    const data = loadDB();
    const idx = data.habits.findIndex((h) => h.id === id);
    if (idx === -1) return null;
    const current = data.habits[idx];
    const habitTitle = updates.title || updates.name || current.title || current.name || 'Daily Habit';
    const targetVal = updates.target_value !== undefined ? (Number(updates.target_value) > 0 ? Number(updates.target_value) : 1) : current.target_value;
    const unit = updates.unit || updates.target_unit || current.target_unit || current.unit || 'times';

    data.habits[idx] = {
      ...current,
      ...updates,
      title: habitTitle,
      name: habitTitle,
      description: updates.description !== undefined ? updates.description : current.description,
      target_value: targetVal,
      target_unit: unit,
      unit: unit,
      habit_type: updates.habit_type || current.habit_type || (targetVal > 1 ? 'quantitative' : 'binary'),
      preferred_time: updates.preferred_time || updates.time_of_day || current.preferred_time || current.time_of_day || 'anytime',
      time_of_day: updates.time_of_day || updates.preferred_time || current.time_of_day || current.preferred_time || 'anytime',
      reminder_time: updates.reminder_time !== undefined ? updates.reminder_time : current.reminder_time,
      reminder_enabled: updates.reminder_enabled !== undefined ? Boolean(updates.reminder_enabled) : current.reminder_enabled,
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

    if (!data.user_challenge_logs) {
      data.user_challenge_logs = [];
    }

    return data.challenges.map((ch) => {
      const userCh = data.user_challenges.find(
        (uc) => uc.user_id === userId && uc.challenge_id === ch.id
      );

      // Real participants count (distinct users joined)
      const participantsCount = new Set(
        data.user_challenges.filter((uc) => uc.challenge_id === ch.id && uc.status !== 'left').map((uc) => uc.user_id)
      ).size;

      const dailyTarget = ch.daily_target || 1;
      const todayChallengeLog = data.user_challenge_logs.find(
        (l) => l.user_id === userId && l.challenge_id === ch.id && l.date === today
      );

      const todayProgress = todayChallengeLog ? todayChallengeLog.progress_value : 0;
      const todayCompleted = todayChallengeLog ? todayChallengeLog.completed : false;

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
          today_progress: 0,
          today_target: dailyTarget,
          today_completed: false,
          unit: ch.unit || 'times',
          participants_count: Math.max(1, participantsCount),
        };
      }

      // Calculate elapsed days
      const startDate = new Date(userCh.started_date);
      const todayDate = new Date(today);
      const diffTime = todayDate.getTime() - startDate.getTime();
      const elapsedDays = Math.max(0, Math.floor(diffTime / (1000 * 60 * 60 * 24)));
      const currentDay = Math.min(ch.duration_days, elapsedDays + 1);
      const remainingDays = Math.max(0, ch.duration_days - elapsedDays);

      // Count completed days from user_challenge_logs plus general habit completions
      const challengeLogsCompletedDates = new Set(
        data.user_challenge_logs
          .filter((l) => l.user_id === userId && l.challenge_id === ch.id && l.completed)
          .map((l) => l.date)
      );

      let completedDays = 0;
      let isBroken = false;

      for (let i = 0; i <= elapsedDays && i < ch.duration_days; i++) {
        const d = new Date(startDate);
        d.setDate(d.getDate() + i);
        const dStr = formatDate(d);

        let dayPassed = challengeLogsCompletedDates.has(dStr);
        if (!dayPassed) {
          if (ch.target_category) {
            const catHabitIds = new Set(userHabits.filter((h) => h.category.toLowerCase() === ch.target_category?.toLowerCase()).map((h) => h.id));
            dayPassed = userLogs.some((l) => l.date === dStr && catHabitIds.has(l.habit_id));
          } else {
            dayPassed = completedDates.has(dStr);
          }
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
          db.addXP(userId, ch.xp_reward, 'challenge_completion', ch.id, `Completed Challenge: ${ch.title}`);
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
        today_progress: todayProgress,
        today_target: dailyTarget,
        today_completed: todayCompleted,
        unit: ch.unit || 'times',
        started_date: userCh.started_date,
        end_date: userCh.end_date,
        participants_count: Math.max(1, participantsCount),
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

    saveDB(data);
    return { success: true, message: `Successfully joined ${ch.title}!` };
  },

  checkinChallenge(userId: number, challengeId: number, progressDeltaOrValue?: number, isAbsolute: boolean = false) {
    const data = loadDB();
    const ch = data.challenges.find((c) => c.id === challengeId);
    if (!ch) return null;

    const userCh = data.user_challenges.find(
      (uc) => uc.user_id === userId && uc.challenge_id === challengeId && (uc.status === 'active' || uc.status === 'completed')
    );
    if (!userCh) return null;

    const today = formatDate(new Date());
    const dailyTarget = ch.daily_target || 1;
    const dailyXpReward = ch.daily_xp || 15;

    if (!data.user_challenge_logs) {
      data.user_challenge_logs = [];
    }

    let log = data.user_challenge_logs.find(
      (l) => l.user_id === userId && l.challenge_id === challengeId && l.date === today
    );

    let xpAwarded = 0;
    let newlyCompleted = false;
    let challengeCompletedNow = false;

    if (!log) {
      const id = data.user_challenge_logs.length > 0 ? Math.max(...data.user_challenge_logs.map((l) => l.id)) + 1 : 1;
      const initialProgress = isAbsolute ? (progressDeltaOrValue ?? dailyTarget) : (progressDeltaOrValue ?? 1);
      const isDone = initialProgress >= dailyTarget;
      
      if (isDone) {
        xpAwarded = dailyXpReward;
        newlyCompleted = true;
        db.addXP(userId, dailyXpReward, 'challenge_daily_checkin', challengeId, `Completed Daily Goal: ${ch.title}`);
      }

      log = {
        id,
        user_id: userId,
        challenge_id: challengeId,
        date: today,
        progress_value: Math.max(0, initialProgress),
        target_value: dailyTarget,
        completed: isDone,
        xp_awarded: xpAwarded,
        logged_at: new Date().toISOString(),
      };
      data.user_challenge_logs.push(log);
    } else {
      const updatedValue = isAbsolute ? (progressDeltaOrValue ?? dailyTarget) : (log.progress_value + (progressDeltaOrValue ?? 1));
      log.progress_value = Math.max(0, updatedValue);
      const isDone = log.progress_value >= dailyTarget;
      
      if (isDone && !log.completed) {
        log.completed = true;
        newlyCompleted = true;
        if (log.xp_awarded === 0) {
          xpAwarded = dailyXpReward;
          log.xp_awarded = dailyXpReward;
          db.addXP(userId, dailyXpReward, 'challenge_daily_checkin', challengeId, `Completed Daily Goal: ${ch.title}`);
        }
      } else if (!isDone && log.completed) {
        log.completed = false;
      }
      log.logged_at = new Date().toISOString();
    }

    // Recalculate completed days
    const allCompletedDates = new Set(
      data.user_challenge_logs
        .filter((l) => l.user_id === userId && l.challenge_id === challengeId && l.completed)
        .map((l) => l.date)
    );
    userCh.completed_days = allCompletedDates.size;
    userCh.updated_at = new Date().toISOString();

    if (userCh.completed_days >= ch.duration_days && userCh.status !== 'completed') {
      userCh.status = 'completed';
      challengeCompletedNow = true;
      db.addXP(userId, ch.xp_reward, 'challenge_full_completion', challengeId, `Mastered Challenge: ${ch.title} 🏆`);
    }

    saveDB(data);

    return {
      success: true,
      challenge_id: challengeId,
      today_progress: log.progress_value,
      today_target: dailyTarget,
      today_completed: log.completed,
      completed_days: userCh.completed_days,
      duration_days: ch.duration_days,
      xp_awarded: xpAwarded,
      challenge_completed: challengeCompletedNow,
      message: challengeCompletedNow
        ? `🎉 Incredible! You completed the ${ch.title}! +${ch.xp_reward} XP awarded!`
        : newlyCompleted
        ? `🔥 Today's challenge goal reached! +${dailyXpReward} XP awarded!`
        : `Progress updated: ${log.progress_value} / ${dailyTarget} ${ch.unit || 'units'}.`,
    };
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

  // ==========================================
  // TO-DO LIST ENGINE
  // ==========================================
  getTodosByUserId(userId: number, includeCompleted = true): TodoRecord[] {
    const data = loadDB();
    if (!data.todos) data.todos = [];
    return data.todos
      .filter((t) => Number(t.user_id) === Number(userId) && (includeCompleted ? true : !t.completed))
      .sort((a, b) => {
        if (a.completed !== b.completed) return a.completed ? 1 : -1;
        if (a.due_date && b.due_date) return a.due_date.localeCompare(b.due_date);
        return a.sort_order - b.sort_order;
      });
  },

  createTodo(todo: any): TodoRecord {
    const data = loadDB();
    if (!data.todos) data.todos = [];
    const id = data.todos.length > 0 ? Math.max(...data.todos.map((t) => t.id)) + 1 : 1;
    const now = new Date().toISOString();
    const newRecord: TodoRecord = {
      id,
      user_id: Number(todo.user_id),
      title: (todo.title || '').trim(),
      description: todo.description ? todo.description.trim() : null,
      due_date: todo.due_date || null,
      reminder_time: todo.reminder_time || null,
      reminder_enabled: Boolean(todo.reminder_enabled || todo.reminder_time),
      priority: todo.priority || 'medium',
      category: todo.category || 'General',
      completed: Boolean(todo.completed),
      completed_at: todo.completed ? now : null,
      sort_order: todo.sort_order ?? data.todos.length,
      created_at: now,
      updated_at: now,
    };
    data.todos.push(newRecord);
    saveDB(data);
    return newRecord;
  },

  getTodoById(id: number): TodoRecord | undefined {
    const data = loadDB();
    if (!data.todos) data.todos = [];
    return data.todos.find((t) => Number(t.id) === Number(id));
  },

  updateTodo(id: number, updates: Partial<TodoRecord>): TodoRecord | null {
    const data = loadDB();
    if (!data.todos) data.todos = [];
    const idx = data.todos.findIndex((t) => Number(t.id) === Number(id));
    if (idx === -1) return null;
    const current = data.todos[idx];
    const now = new Date().toISOString();
    const isCompleted = updates.completed !== undefined ? Boolean(updates.completed) : current.completed;

    data.todos[idx] = {
      ...current,
      ...updates,
      title: updates.title !== undefined ? updates.title.trim() : current.title,
      description: updates.description !== undefined ? (updates.description ? updates.description.trim() : null) : current.description,
      due_date: updates.due_date !== undefined ? updates.due_date : current.due_date,
      reminder_time: updates.reminder_time !== undefined ? updates.reminder_time : current.reminder_time,
      reminder_enabled: updates.reminder_enabled !== undefined ? Boolean(updates.reminder_enabled) : current.reminder_enabled,
      priority: updates.priority || current.priority,
      category: updates.category || current.category,
      completed: isCompleted,
      completed_at: isCompleted ? (current.completed_at || now) : null,
      updated_at: now,
    };
    saveDB(data);
    return data.todos[idx];
  },

  toggleTodo(id: number): TodoRecord | null {
    const data = loadDB();
    if (!data.todos) data.todos = [];
    const idx = data.todos.findIndex((t) => Number(t.id) === Number(id));
    if (idx === -1) return null;
    const current = data.todos[idx];
    const now = new Date().toISOString();
    const newCompleted = !current.completed;

    data.todos[idx] = {
      ...current,
      completed: newCompleted,
      completed_at: newCompleted ? now : null,
      updated_at: now,
    };
    saveDB(data);
    return data.todos[idx];
  },

  deleteTodo(id: number): boolean {
    const data = loadDB();
    if (!data.todos) data.todos = [];
    const idx = data.todos.findIndex((t) => Number(t.id) === Number(id));
    if (idx === -1) return false;
    data.todos.splice(idx, 1);
    saveDB(data);
    return true;
  },
};
