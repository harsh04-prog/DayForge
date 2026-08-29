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
    try {
      const res = await api.get<NotificationBudget>('/notifications/budget');
      setBudget(res.data);
    } catch (err) {
      console.error('Failed to fetch notification budget', err);
    }
  }, [isAuthenticated]);

  const fetchNotifications = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      const [notifsRes, budgetRes] = await Promise.all([
        api.get<NotificationItem[]>('/notifications/'),
        api.get<NotificationBudget>('/notifications/budget'),
      ]);
      setNotifications(notifsRes.data);
      setBudget(budgetRes.data);
    } catch (err) {
      console.error('Failed to fetch companion notifications', err);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchNotifications();
      // Periodically sync every 60s
      const interval = setInterval(fetchNotifications, 60000);
      return () => clearInterval(interval);
    }
  }, [isAuthenticated, fetchNotifications]);

  const markAsRead = async (id: number) => {
    try {
      await api.post(`/notifications/${id}/read`);
      setNotifications((prev) => prev.filter((n) => n.id !== id));
      await fetchBudget();
    } catch (err) {
      console.error('Failed to mark read', err);
    }
  };

  const markAllAsRead = async () => {
    try {
      await api.post('/notifications/mark-all-read');
      setNotifications([]);
      showSuccess('All Caught Up', 'All reminders marked as read.');
      await fetchBudget();
    } catch (err) {
      showError('Error', 'Failed to mark all as read.');
    }
  };

  const dismissNotification = async (id: number) => {
    try {
      await api.post(`/notifications/${id}/dismiss`);
      setNotifications((prev) => prev.filter((n) => n.id !== id));
      await fetchBudget();
    } catch (err) {
      console.error('Failed to dismiss', err);
    }
  };

  const snoozeNotification = async (id: number, minutes: number) => {
    try {
      await api.post(`/notifications/${id}/snooze`, { minutes });
      setNotifications((prev) => prev.filter((n) => n.id !== id));
      showSuccess('Reminder Snoozed', `We'll remind you in ${minutes} minutes.`);
      await fetchBudget();
    } catch (err) {
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
      setNotifications((prev) => [res.data, ...prev.filter((n) => n.id !== res.data.id)]);
      await fetchBudget();

      // Native Browser Push Notification
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification(res.data.title, {
          body: res.data.message,
          icon: '/favicon.ico',
        });
      }

      showSuccess('Companion Reminder Fired', res.data.title);
    } catch (err) {
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
