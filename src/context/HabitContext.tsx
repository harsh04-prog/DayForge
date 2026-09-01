'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import confetti from 'canvas-confetti';
import { api } from '../services/api';
import { Habit, DashboardData, Achievement, LevelInfo } from '../types';
import { useAuth } from './AuthContext';
import { useToast } from './ToastContext';
import { soundEffects } from '../utils/soundEffects';
import { CelebrationModal, CelebrationData } from '../components/common/CelebrationModal';

interface HabitContextType {
  habits: Habit[];
  challenges: any[];
  dashboardData: DashboardData | null;
  isLoading: boolean;
  unlockedAchievement: Achievement | null;
  levelUpModal: { show: boolean; level: number; title: string } | null;
  dismissAchievementModal: () => void;
  dismissLevelUpModal: () => void;
  fetchHabits: () => Promise<void>;
  fetchDashboard: () => Promise<void>;
  fetchChallenges: () => Promise<void>;
  joinChallenge: (id: number) => Promise<any>;
  leaveChallenge: (id: number) => Promise<any>;
  checkinChallenge: (id: number, progress?: number, isAbsolute?: boolean) => Promise<any>;
  createHabit: (habitData: Partial<Habit>) => Promise<Habit>;
  updateHabit: (id: number, habitData: Partial<Habit>) => Promise<Habit>;
  deleteHabit: (id: number) => Promise<void>;
  pauseHabit: (id: number) => Promise<void>;
  resumeHabit: (id: number) => Promise<void>;
  archiveHabit: (id: number) => Promise<void>;
  completeHabit: (id: number, currentValue?: number, notes?: string) => Promise<void>;
  undoHabit: (id: number) => Promise<void>;
  useStreakShield: (targetDate?: string) => Promise<void>;
}

const HabitContext = createContext<HabitContextType | undefined>(undefined);

export const HabitProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, user, refreshSession } = useAuth();
  const { showXPToast, showSuccess, showError } = useToast();

  const [habits, setHabits] = useState<Habit[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const cached = localStorage.getItem('dayforge_dashboard_cache');
        if (cached) {
          const parsed = JSON.parse(cached) as DashboardData;
          if (parsed && Array.isArray(parsed.habits)) return parsed.habits;
        }
      } catch {}
    }
    return [];
  });

  const [challenges, setChallenges] = useState<any[]>([]);
  
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(() => {
    if (typeof window !== 'undefined') {
      try {
        const cached = localStorage.getItem('dayforge_dashboard_cache');
        if (cached) return JSON.parse(cached) as DashboardData;
      } catch {}
    }
    return null;
  });

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [unlockedAchievement, setUnlockedAchievement] = useState<Achievement | null>(null);
  const [levelUpModal, setLevelUpModal] = useState<{ show: boolean; level: number; title: string } | null>(null);
  const [celebrationData, setCelebrationData] = useState<CelebrationData | null>(null);

  const fetchDashboard = useCallback(async () => {
    try {
      const res = await api.get<DashboardData>('/progress/dashboard');
      if (res.data) {
        setDashboardData(res.data);
        setHabits(res.data.habits || []);

        if (typeof window !== 'undefined') {
          try {
            localStorage.setItem('dayforge_dashboard_cache', JSON.stringify(res.data));
          } catch {}
        }

        if (res.data.unseen_achievements && res.data.unseen_achievements.length > 0) {
          const firstUnseen = res.data.unseen_achievements[0];
          setUnlockedAchievement(firstUnseen);
          api.post('/progress/achievements/mark-seen');
        }
      }
    } catch (err) {
      console.error('Failed to fetch dashboard', err);
    }
  }, []);

  const fetchChallenges = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      const res = await api.get<any[]>('/challenges');
      if (Array.isArray(res.data)) {
        setChallenges(res.data);
      }
    } catch (err) {
      console.error('Failed to fetch challenges', err);
    }
  }, [isAuthenticated]);

  const fetchHabits = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      setIsLoading(true);
      const res = await api.get<Habit[]>('/habits/');
      setHabits(res.data);
    } catch (err) {
      console.error('Failed to fetch habits', err);
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchDashboard();
      fetchChallenges();
    }
  }, [isAuthenticated, fetchDashboard, fetchChallenges]);

  const joinChallenge = async (id: number): Promise<any> => {
    // Optimistic update for instant UI feedback
    setChallenges((prev) =>
      prev.map((c) =>
        c.id === id
          ? { ...c, is_joined: true, status: 'active', current_day: 1, completed_days: 0, today_progress: 0, today_completed: false }
          : c
      )
    );

    try {
      const res = await api.post(`/challenges/${id}/join`);
      showSuccess('Challenge Joined! 🏆', res.data.message || 'You have joined the sprint!');
      await Promise.all([fetchChallenges(), fetchDashboard()]);
      return res.data;
    } catch (err: any) {
      await fetchChallenges();
      showError('Error', err.response?.data?.detail || 'Failed to join challenge.');
      throw err;
    }
  };

  const leaveChallenge = async (id: number): Promise<any> => {
    // Optimistic update for instant UI feedback
    setChallenges((prev) =>
      prev.map((c) =>
        c.id === id
          ? { ...c, is_joined: false, status: 'available', current_day: 0, completed_days: 0, today_progress: 0, today_completed: false }
          : c
      )
    );

    try {
      const res = await api.post(`/challenges/${id}/leave`);
      showSuccess('Left Challenge', res.data.message || 'You have left the sprint.');
      await Promise.all([fetchChallenges(), fetchDashboard()]);
      return res.data;
    } catch (err: any) {
      await fetchChallenges();
      showError('Error', err.response?.data?.detail || 'Failed to leave challenge.');
      throw err;
    }
  };

  const checkinChallenge = async (id: number, progress?: number, isAbsolute: boolean = false): Promise<any> => {
    try {
      const res = await api.post(`/challenges/${id}/checkin`, {
        progress,
        is_absolute: isAbsolute,
      });

      if (res.data.today_completed) {
        soundEffects.playComplete();
        confetti({
          particleCount: 60,
          spread: 60,
          origin: { y: 0.7 },
        });
      }

      showSuccess('Challenge Updated', res.data.message || 'Progress logged.');
      await Promise.all([fetchChallenges(), fetchDashboard()]);
      return res.data;
    } catch (err: any) {
      showError('Error', err.response?.data?.detail || "Couldn't update challenge progress.");
      throw err;
    }
  };

  const createHabit = async (habitData: Partial<Habit>): Promise<Habit> => {
    const res = await api.post<Habit>('/habits/', habitData);
    await fetchDashboard();
    showSuccess('Habit Created', `"${res.data.name}" added to your daily forge.`);
    return res.data;
  };

  const updateHabit = async (id: number, habitData: Partial<Habit>): Promise<Habit> => {
    const res = await api.put<Habit>(`/habits/${id}`, habitData);
    await fetchDashboard();
    showSuccess('Habit Updated', `"${res.data.name}" changes saved.`);
    return res.data;
  };

  const deleteHabit = async (id: number) => {
    await api.delete(`/habits/${id}`);
    setHabits((prev) => prev.filter((h) => h.id !== id));
    await fetchDashboard();
    showSuccess('Habit Deleted', 'Habit removed from routine.');
  };

  const pauseHabit = async (id: number) => {
    await api.post(`/habits/${id}/pause`);
    await fetchDashboard();
  };

  const resumeHabit = async (id: number) => {
    await api.post(`/habits/${id}/resume`);
    await fetchDashboard();
  };

  const archiveHabit = async (id: number) => {
    await api.post(`/habits/${id}/archive`);
    await fetchDashboard();
    showSuccess('Habit Archived', 'Preserved in your archive history.');
  };

  const completeHabit = async (id: number, currentValue?: number, notes?: string) => {
    // Optimistic UI update for instant feel
    setHabits((prev) =>
      prev.map((h) =>
        h.id === id
          ? {
              ...h,
              today_completed: true,
              today_progress: currentValue ?? h.target_value,
              current_streak: h.current_streak + 1,
            }
          : h
      )
    );

    soundEffects.playComplete();

    try {
      const res = await api.post(`/habits/${id}/complete`, {
        completed: true,
        current_value: currentValue,
        notes,
      });

      const data = res.data;
      const targetHabit = habits.find((h) => h.id === id);

      // Check Level Up
      if (data.level_up) {
        soundEffects.playLevelUp();
        setCelebrationData({
          type: 'level_up',
          level: data.new_level,
          title: `Level ${data.new_level}`,
          message: "You're becoming more consistent every day.",
          xpAwarded: data.xp_awarded,
        });
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
        });
      }
      // Check Achievement
      else if (data.unlocked_achievements && data.unlocked_achievements.length > 0) {
        const ach = data.unlocked_achievements[0];
        setCelebrationData({
          type: 'achievement',
          badgeName: ach.name,
          message: ach.description,
          xpAwarded: ach.xp_reward || 50,
        });
        confetti({
          particleCount: 100,
          spread: 90,
          origin: { y: 0.5 },
        });
      }
      // Check Perfect Day (if all scheduled habits are completed)
      else if (
        dashboardData &&
        dashboardData.today_completed_count + 1 >= dashboardData.today_scheduled_count &&
        dashboardData.today_scheduled_count > 1
      ) {
        setCelebrationData({
          type: 'perfect_day',
          xpAwarded: 25,
        });
        confetti({
          particleCount: 70,
          spread: 60,
          origin: { y: 0.6 },
        });
      }
      // Task-Specific Micro-Celebration
      else {
        setCelebrationData({
          type: 'task',
          habitName: targetHabit?.name || 'Habit Complete!',
          category: targetHabit?.category || 'General',
          xpAwarded: data.xp_awarded || 10,
          message: data.message || 'One step closer to your daily goal.',
        });
      }

      await fetchDashboard();
      await refreshSession();
    } catch (err: any) {
      showError('Error', err.response?.data?.detail || 'Failed to complete habit.');
      await fetchDashboard();
    }
  };

  const undoHabit = async (id: number) => {
    // Optimistic UI update
    setHabits((prev) =>
      prev.map((h) =>
        h.id === id
          ? {
              ...h,
              today_completed: false,
              today_progress: 0,
              current_streak: Math.max(0, h.current_streak - 1),
            }
          : h
      )
    );

    soundEffects.playPop();

    try {
      await api.post(`/habits/${id}/undo`);
      await fetchDashboard();
      await refreshSession();
    } catch (err: any) {
      showError('Error', err.response?.data?.detail || 'Failed to undo habit.');
      await fetchDashboard();
    }
  };

  const useStreakShield = async (targetDate?: string) => {
    try {
      const res = await api.post('/progress/shield/use', null, {
        params: targetDate ? { target_date: targetDate } : {},
      });
      soundEffects.playShield();
      showSuccess('Shield Activated', res.data.message);
      await fetchDashboard();
      await refreshSession();
    } catch (err: any) {
      showError('Shield Error', err.response?.data?.detail || 'Could not use shield.');
    }
  };

  const dismissAchievementModal = () => setUnlockedAchievement(null);
  const dismissLevelUpModal = () => setLevelUpModal(null);

  return (
    <HabitContext.Provider
      value={{
        habits,
        challenges,
        dashboardData,
        isLoading,
        unlockedAchievement,
        levelUpModal,
        dismissAchievementModal,
        dismissLevelUpModal,
        fetchHabits,
        fetchDashboard,
        fetchChallenges,
        joinChallenge,
        leaveChallenge,
        checkinChallenge,
        createHabit,
        updateHabit,
        deleteHabit,
        pauseHabit,
        resumeHabit,
        archiveHabit,
        completeHabit,
        undoHabit,
        useStreakShield,
      }}
    >
      {children}
      <CelebrationModal
        data={celebrationData}
        onClose={() => setCelebrationData(null)}
      />
    </HabitContext.Provider>
  );
};

export const useHabits = () => {
  const context = useContext(HabitContext);
  if (!context) throw new Error('useHabits must be used within HabitProvider');
  return context;
};
