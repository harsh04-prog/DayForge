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
  triggerTestNotification: () => Promise<void>;
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
      return () => clearInterval(interval);
    } else {
      setNotifications([]);
      setBudget(null);
    }
  }, [isAuthenticated, fetchNotifications]);

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

  const triggerTestNotification = async () => {
    try {
      const smartQuote = getSmartHabitNotification('Drink Water', 'Health', user?.full_name?.split(' ')[0]);
      
      const res = await api.post<NotificationItem>('/notifications/test', {
        title: smartQuote.title,
        message: smartQuote.message,
        icon: smartQuote.icon,
      });

      soundEffects.playComplete();
      if (res.data) {
        setNotifications((prev) => [res.data, ...prev.filter((n) => Number(n.id) !== Number(res.data.id))]);
      }
      await fetchBudget();

      // Show Service Worker / Native Push with sound & vibration
      await showLocalSmartNotification(
        res.data?.title || smartQuote.title,
        res.data?.message || smartQuote.message,
        smartQuote.icon,
        '/'
      );

      showSuccess('Smart Reminder Fired ⚡', smartQuote.message);
    } catch {
      showError('Error', 'Could not fire companion reminder.');
    }
  };

  const requestBrowserPermission = async (): Promise<boolean> => {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      showInfo('Not Supported', 'Web notifications are not supported on this browser.');
      return false;
    }

    try {
      const perm = await Notification.requestPermission();
      setPermissionStatus(perm);

      if (perm === 'granted') {
        showSuccess('Notifications Enabled 🔔', 'Personalized DayForge habit reminders are active.');
        await showLocalSmartNotification(
          'DayForge Reminders Active ⚡',
          'Paani piya kya? 💧 Habit check-ins and streak updates are now active!',
          'zap',
          '/'
        );
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
        triggerTestNotification,
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
