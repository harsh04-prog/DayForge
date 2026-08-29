export interface Profile {
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

export interface UserSettings {
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
  sound_type: 'default' | 'soft' | 'motivational' | 'silent';
  quiet_hours_enabled: boolean;
  quiet_hours_start: string;
  quiet_hours_end: string;
  theme: string;
  week_start_day: string;
  time_format: string;
  preferred_units: string;
  profile_visibility: string;
}

export interface User {
  id: number;
  email: string;
  username: string;
  full_name: string;
  is_active: boolean;
  is_onboarded: boolean;
  created_at: string;
  profile?: Profile;
  settings?: UserSettings;
}

export interface Habit {
  id: number;
  user_id: number;
  name: string;
  description?: string | null;
  icon: string;
  color: string;
  category: string;
  habit_type: 'binary' | 'quantitative';
  target_value: number;
  unit?: string | null;
  frequency_type: 'daily' | 'weekdays' | 'weekends' | 'custom_days' | 'times_per_week';
  frequency_days: string;
  target_days_per_week: number;
  preferred_time: 'morning' | 'afternoon' | 'evening' | 'anytime';
  reminder_time?: string | null;
  difficulty: 'easy' | 'medium' | 'hard';
  is_paused: boolean;
  is_archived: boolean;
  sort_order: number;
  current_streak: number;
  longest_streak: number;
  total_completions: number;
  created_at: string;
  updated_at: string;
  today_completed: boolean;
  today_progress: number;
}

export interface HabitLog {
  id: number;
  habit_id: number;
  user_id: number;
  log_date: string;
  completed: boolean;
  current_value: number;
  notes?: string | null;
  completed_at: string;
  xp_awarded: number;
}

export interface HabitDetail extends Habit {
  completion_rate_30d: number;
  weekly_progress: Array<{
    day: string;
    date: string;
    completed: boolean;
    value: number;
    target: number;
  }>;
  monthly_progress: Array<{
    week: string;
    completed_count: number;
  }>;
  recent_logs: HabitLog[];
  best_day?: string | null;
  best_time?: string | null;
  insights: string[];
}

export interface HabitStack {
  id: number;
  trigger_habit_id: number;
  action_habit_id: number;
  trigger_habit_name?: string;
  action_habit_name?: string;
  stack_description?: string;
}

export interface LevelInfo {
  level: number;
  title: string;
  current_xp: number;
  next_level_xp: number;
  level_progress_percentage: number;
}

export interface DailyScoreBreakdown {
  total_score: number;
  completion_score: number;
  consistency_score: number;
  streak_bonus: number;
  summary: string;
}

export interface Achievement {
  id: number;
  code: string;
  name: string;
  description: string;
  icon: string;
  category: string;
  xp_reward: number;
  required_count: number;
  badge_tier: 'bronze' | 'silver' | 'gold' | 'diamond';
  unlocked: boolean;
  unlocked_at?: string | null;
  progress: number;
  max_progress: number;
}

export interface XPTransaction {
  id: number;
  amount: number;
  source: string;
  reference_id?: string | null;
  description?: string | null;
  created_at: string;
}

export interface DashboardData {
  profile: Profile;
  level_info: LevelInfo;
  daily_score: DailyScoreBreakdown;
  today_completed_count: number;
  today_scheduled_count: number;
  today_completion_rate: number;
  active_streak: number;
  habits: Habit[];
  unseen_achievements: Achievement[];
  recovery_card?: {
    title: string;
    message: string;
    habit_name: string;
    available_shields: number;
  } | null;
}

export interface HeatmapDay {
  date: string;
  count: number;
  completion_rate: number;
  level: number;
}

export interface HeatmapResponse {
  days: HeatmapDay[];
  total_active_days: number;
  longest_streak: number;
  current_streak: number;
}

export interface CategoryBreakdown {
  category: string;
  total_habits: number;
  completions: number;
  completion_rate: number;
  color: string;
}

export interface TrendPoint {
  period: string;
  completed: number;
  scheduled: number;
  rate: number;
}

export interface WeeklyReview {
  id?: number;
  week_start_date?: string;
  week_end_date?: string;
  week_number?: number;
  year?: number;
  start_date?: string;
  end_date?: string;
  overall_completion_rate?: number;
  total_completions?: number;
  completion_rate?: number;
  total_completed?: number;
  total_scheduled?: number;
  best_habit?: string | null;
  needs_attention_habit?: string | null;
  focus_habit?: string | null;
  best_day?: string | null;
  weakest_day?: string | null;
  xp_earned?: number;
  key_wins?: string[];
  next_week_focus?: string;
  actionable_insight?: string | null;
}

export interface Recommendation {
  id: string;
  type: 'overload' | 'timing' | 'recovery' | 'celebration' | 'streak' | string;
  title?: string;
  message: string;
  priority?: string;
  action_label?: string | null;
  action_type?: string | null;
  action_url?: string | null;
  habit_id?: number | null;
}

export interface Challenge {
  id: number;
  title: string;
  description: string;
  category: string;
  icon: string;
  color?: string;
  duration_days: number;
  xp_reward: number;
  badge_name?: string | null;
  required_habit_category?: string | null;
  daily_target_completions?: number;
  is_active?: boolean;
  is_official?: boolean;
  is_joined?: boolean;
  is_completed?: boolean;
  current_day?: number;
  completed_days?: number;
  progress_days?: number;
  progress_percentage?: number;
  member_count?: number;
  participants_count?: number;
  status?: string;
}

export interface NotificationBudget {
  sent_today_count: number;
  max_daily_budget: number;
  remaining_today: number;
  quiet_hours_active: boolean;
}

export interface NotificationItem {
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
