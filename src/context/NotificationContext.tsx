'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { api } from '../services/api';
import { NotificationItem, NotificationBudget } from '../types';
import { useAuth } from './AuthContext';
import { useToast } from './ToastContext';
import { soundEffects } from '../utils/soundEffects';

interface NotificationContextType {
  notifications: NotificationItem[];
  budget: NotificationBudget | null;
  unreadCount: number;
  isLoading: boolean;
  fetchNotifications: () => Promise<void>;
  fetchBudget: () => Promise<void>;
  markAsRead: (id: number) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  dismissNotification: (id: number) => Promise<void>;
  snoozeNotification: (id: number, minutes: number) => Promise<void>;
  completeFromNotification: (id: number) => Promise<void>;
  triggerTestNotification: () => Promise<void>;
  requestBrowserPermission: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const { showSuccess, showError } = useToast();

  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [budget, setBudget] = useState<NotificationBudget | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const fetchBudget = useCallback(async () => {
    if (!isAuthenticated) return;
    if (typeof window !== 'undefined' && !localStorage.getItem('dayforge_token')) return;

    try {
      const res = await api.get<NotificationBudget>('/notifications/budget');
      if (res.data) {
        setBudget(res.data);
      }
    } catch {
      // Fallback budget if temporarily unreachable
      setBudget((prev) => prev || {
        sent_today_count: 0,
        max_daily_budget: 10,
        remaining_today: 10,
        quiet_hours_active: false,
      });
    }
  }, [isAuthenticated]);

  const fetchNotifications = useCallback(async () => {
    if (!isAuthenticated) {
      setNotifications([]);
      return;
    }
    if (typeof window !== 'undefined' && !localStorage.getItem('dayforge_token')) {
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
      // Graceful fallback to avoid error overlays
      setNotifications((prev) => prev || []);
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchNotifications();
      // Periodically sync every 60s
      const interval = setInterval(fetchNotifications, 60000);
      return () => clearInterval(interval);
    } else {
      setNotifications([]);
      setBudget(null);
    }
  }, [isAuthenticated, fetchNotifications]);

  const markAsRead = async (id: number) => {
    try {
      await api.post(`/notifications/${id}/read`);
      setNotifications((prev) => prev.filter((n) => n.id !== id));
      await fetchBudget();
    } catch {
      setNotifications((prev) => prev.filter((n) => n.id !== id));
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
      setNotifications((prev) => prev.filter((n) => n.id !== id));
      await fetchBudget();
    } catch {
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    }
  };

  const snoozeNotification = async (id: number, minutes: number) => {
    try {
      await api.post(`/notifications/${id}/snooze`, { minutes });
      setNotifications((prev) => prev.filter((n) => n.id !== id));
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
      setNotifications((prev) => prev.filter((n) => n.id !== id));
      showSuccess('Action Done!', res.data.message || 'Progress logged successfully.');
      await fetchBudget();
    } catch (err: any) {
      showError('Error', err.response?.data?.detail || 'Failed to complete action.');
    }
  };

  const triggerTestNotification = async () => {
    try {
      const res = await api.post<NotificationItem>('/notifications/test');
      soundEffects.playComplete();
      if (res.data) {
        setNotifications((prev) => [res.data, ...prev.filter((n) => n.id !== res.data.id)]);
      }
      await fetchBudget();

      // Native Browser Push Notification
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification(res.data.title, {
          body: res.data.message,
          icon: '/favicon.ico',
        });
      }

      showSuccess('Companion Reminder Fired', res.data.title);
    } catch {
      showError('Error', 'Could not send companion reminder.');
    }
  };

  const requestBrowserPermission = async () => {
    if ('Notification' in window) {
      const perm = await Notification.requestPermission();
      if (perm === 'granted') {
        showSuccess('System Notifications Active', 'Smart reminders will notify you smoothly.');
      }
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
        fetchNotifications,
        fetchBudget,
        markAsRead,
        markAllAsRead,
        dismissNotification,
        snoozeNotification,
        completeFromNotification,
        triggerTestNotification,
        requestBrowserPermission,
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
