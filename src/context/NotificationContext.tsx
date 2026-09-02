'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { api } from '../services/api';
import { NotificationItem, NotificationBudget } from '../types';
import { useAuth } from './AuthContext';
import { useToast } from './ToastContext';
import { soundEffects } from '../utils/soundEffects';
import { getSmartHabitNotification } from '../lib/smartNotifications';

interface NotificationContextType {
  notifications: NotificationItem[];
  budget: NotificationBudget | null;
  unreadCount: number;
  isLoading: boolean;
  permissionStatus: NotificationPermission | 'default';
  fetchNotifications: () => Promise<void>;
  fetchBudget: () => Promise<void>;
  markAsRead: (id: number) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  dismissNotification: (id: number) => Promise<void>;
  snoozeNotification: (id: number, minutes: number) => Promise<void>;
  completeFromNotification: (id: number) => Promise<void>;
  requestBrowserPermission: () => Promise<boolean>;
  showLocalSmartNotification: (title: string, message: string, icon?: string, actionUrl?: string) => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, user } = useAuth();
  const { showSuccess, showError, showInfo } = useToast();

  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [budget, setBudget] = useState<NotificationBudget | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [permissionStatus, setPermissionStatus] = useState<NotificationPermission | 'default'>('default');
  const triggeredTimesRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setPermissionStatus(Notification.permission);
    }
  }, []);

  const fetchBudget = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      const res = await api.get<NotificationBudget>('/notifications/budget');
      if (res.data) {
        setBudget(res.data);
      }
    } catch {
      setBudget((prev) => prev || {
        sent_today_count: 0,
        max_daily_budget: 12,
        remaining_today: 12,
        quiet_hours_active: false,
      });
    }
  }, [isAuthenticated]);

  const fetchNotifications = useCallback(async () => {
    if (!isAuthenticated) {
      setNotifications([]);
      return;
    }

    try {
      setIsLoading(true);
      const [notifsRes, budgetRes] = await Promise.all([
        api.get<NotificationItem[]>('/notifications'),
        api.get<NotificationBudget>('/notifications/budget'),
      ]);

      if (Array.isArray(notifsRes.data)) {
        setNotifications(notifsRes.data);
      }
      if (budgetRes.data) {
        setBudget(budgetRes.data);
      }
    } catch {
      setNotifications((prev) => prev || []);
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchNotifications();
      const interval = setInterval(fetchNotifications, 60000);

      // Active reminder checker loop (checks every 15s for due to-dos and habits)
      const firedReminders = new Set<string>();

      const checkDueReminders = async () => {
        if (typeof window === 'undefined') return;
        const now = new Date();
        const currentHH = String(now.getHours()).padStart(2, '0');
        const currentMM = String(now.getMinutes()).padStart(2, '0');
        const currentHHMM = `${currentHH}:${currentMM}`;
        const todayKey = `${now.toISOString().split('T')[0]}_${currentHHMM}`;

        // 1. Check to-dos
        try {
          const cachedTodosRaw = localStorage.getItem('dayforge_todos_cache');
          if (cachedTodosRaw) {
            const todosList = JSON.parse(cachedTodosRaw);
            if (Array.isArray(todosList)) {
              for (const t of todosList) {
                if (t.reminder_enabled && t.reminder_time && !t.completed) {
                  const todoKey = `todo_${t.id}_${todayKey}`;
                  if (t.reminder_time === currentHHMM && !firedReminders.has(todoKey)) {
                    firedReminders.add(todoKey);
                    const smart = getSmartHabitNotification(t.title, t.category, user?.full_name?.split(' ')[0], true);
                    soundEffects.playComplete();
                    await showLocalSmartNotification(
                      `Task Reminder: ${t.title}`,
                      smart.message,
                      'check-square',
                      '/todos'
                    );
                    showSuccess(`Task Reminder: ${t.title}`, smart.message);
                  }
                }
              }
            }
          }
        } catch {}

        // 2. Check habits
        try {
          let habitsList: any[] = [];
          const cachedHabitsRaw = localStorage.getItem('dayforge_habits_cache');
          const cachedDashRaw = localStorage.getItem('dayforge_dashboard_cache');

          if (cachedHabitsRaw) {
            try { habitsList = JSON.parse(cachedHabitsRaw); } catch {}
          }
          if ((!habitsList || habitsList.length === 0) && cachedDashRaw) {
            try {
              const dash = JSON.parse(cachedDashRaw);
              if (dash && Array.isArray(dash.habits)) habitsList = dash.habits;
            } catch {}
          }

          if (Array.isArray(habitsList)) {
            for (const h of habitsList) {
              if (h.reminder_enabled && h.reminder_time && !h.today_completed && h.is_active !== false) {
                const habitKey = `habit_${h.id}_${todayKey}`;
                if (h.reminder_time === currentHHMM && !firedReminders.has(habitKey)) {
                  firedReminders.add(habitKey);
                  const smart = getSmartHabitNotification(h.name || h.title, h.category, user?.full_name?.split(' ')[0], false);
                  soundEffects.playComplete();
                  await showLocalSmartNotification(
                    smart.title,
                    smart.message,
                    smart.icon || 'zap',
                    '/habits'
                  );
                  showSuccess(smart.title, smart.message);
                }
              }
            }
          }
        } catch {}
      };

      const reminderInterval = setInterval(checkDueReminders, 15000);

      return () => {
        clearInterval(interval);
        clearInterval(reminderInterval);
      };
    } else {
      setNotifications([]);
      setBudget(null);
    }
  }, [isAuthenticated, fetchNotifications, user]);

  const showLocalSmartNotification = async (title: string, message: string, icon?: string, actionUrl?: string) => {
    if (typeof window === 'undefined' || !('Notification' in window)) return;
    if (Notification.permission !== 'granted') return;

    try {
      if ('serviceWorker' in navigator) {
        const registration = await navigator.serviceWorker.ready;
        await registration.showNotification(title, {
          body: message,
          icon: '/icons/icon-192x192.png',
          badge: '/icons/icon-192x192.png',
          vibrate: [200, 100, 200, 100, 200], // Full mobile vibration pattern
          tag: `dayforge-alert-${Date.now()}`,
          renotify: true,
          silent: false, // Ensures default Android/iOS notification audio chime plays
          requireInteraction: false,
          data: {
            url: actionUrl || '/',
            dateOfArrival: Date.now(),
          },
          actions: [
            { action: 'open', title: 'Open DayForge' },
            { action: 'dismiss', title: 'Dismiss' },
          ],
        } as any);
      } else {
        new Notification(title, {
          body: message,
          icon: '/icons/icon-192x192.png',
          silent: false,
        });
      }
    } catch (e) {
      console.warn('Notification show attempt:', e);
    }
  };

  const markAsRead = async (id: number) => {
    try {
      await api.post(`/notifications/${id}/read`);
      setNotifications((prev) => prev.filter((n) => Number(n.id) !== Number(id)));
      await fetchBudget();
    } catch {
      setNotifications((prev) => prev.filter((n) => Number(n.id) !== Number(id)));
    }
  };

  const markAllAsRead = async () => {
    try {
      await api.post('/notifications/mark-all-read');
      setNotifications([]);
      showSuccess('All Caught Up', 'All reminders marked as read.');
      await fetchBudget();
    } catch {
      setNotifications([]);
    }
  };

  const dismissNotification = async (id: number) => {
    try {
      await api.post(`/notifications/${id}/dismiss`);
      setNotifications((prev) => prev.filter((n) => Number(n.id) !== Number(id)));
      await fetchBudget();
    } catch {
      setNotifications((prev) => prev.filter((n) => Number(n.id) !== Number(id)));
    }
  };

  const snoozeNotification = async (id: number, minutes: number) => {
    try {
      await api.post(`/notifications/${id}/snooze`, { minutes });
      setNotifications((prev) => prev.filter((n) => Number(n.id) !== Number(id)));
      showSuccess('Reminder Snoozed', `We'll remind you in ${minutes} minutes.`);
      await fetchBudget();
    } catch {
      showError('Error', 'Failed to snooze reminder.');
    }
  };

  const completeFromNotification = async (id: number) => {
    try {
      const res = await api.post(`/notifications/${id}/complete`);
      soundEffects.playComplete();
      setNotifications((prev) => prev.filter((n) => Number(n.id) !== Number(id)));
      showSuccess('Action Done!', res.data.message || 'Progress logged successfully.');
      await fetchBudget();
    } catch (err: any) {
      showError('Error', err.response?.data?.detail || 'Failed to complete action.');
    }
  };

  const requestBrowserPermission = async (): Promise<boolean> => {
    if (typeof window === 'undefined') return false;

    // Trigger OneSignal native permission flow
    if (window.OneSignalDeferred) {
      window.OneSignalDeferred.push(async function (OneSignal: any) {
        try {
          await OneSignal.Notifications.requestPermission();
        } catch (e) {
          console.warn('OneSignal permission prompt error:', e);
        }
      });
    }

    if (!('Notification' in window)) {
      showInfo('Not Supported', 'Web notifications are not supported on this browser.');
      return false;
    }

    try {
      const perm = await Notification.requestPermission();
      setPermissionStatus(perm);

      if (perm === 'granted') {
        showSuccess('Notifications Enabled 🔔', 'Personalized DayForge habit reminders are active.');
        return true;
      } else if (perm === 'denied') {
        showInfo(
          'Notifications Blocked',
          'Notifications are blocked in your browser settings. To enable them, click the lock icon in your address bar and allow Notifications.'
        );
        return false;
      }
      return false;
    } catch (err) {
      console.error('Permission request error:', err);
      return false;
    }
  };

  const unreadCount = notifications.filter((n) => n.status === 'unread').length;

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        budget,
        unreadCount,
        isLoading,
        permissionStatus,
        fetchNotifications,
        fetchBudget,
        markAsRead,
        markAllAsRead,
        dismissNotification,
        snoozeNotification,
        completeFromNotification,
        requestBrowserPermission,
        showLocalSmartNotification,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};
