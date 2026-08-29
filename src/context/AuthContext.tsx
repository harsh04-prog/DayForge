'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { api } from '../services/api';
import { User, Profile, UserSettings } from '../types';

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  settings: UserSettings | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string, rememberMe?: boolean) => Promise<User>;
  register: (payload: { email: string; username: string; full_name: string; password: string; avatar_url?: string }) => Promise<User>;
  logout: () => void;
  updateProfile: (data: { full_name?: string; username?: string; bio?: string; primary_goal?: string; focus_areas?: string; avatar_url?: string }) => Promise<void>;
  uploadAvatar: (file: File) => Promise<string>;
  removeAvatar: () => Promise<void>;
  completeOnboarding: (payload: { focus_areas: string[]; primary_goal: string; target_habit_count: number; starter_habits?: any[] }) => Promise<void>;
  refreshSession: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedToken = localStorage.getItem('dayforge_token');
      setToken(savedToken);
    }
  }, []);

  const refreshSession = useCallback(async () => {
    if (typeof window === 'undefined') {
      setIsLoading(false);
      return;
    }

    const savedToken = localStorage.getItem('dayforge_token');
    if (!savedToken) {
      setUser(null);
      setIsLoading(false);
      return;
    }

    try {
      const response = await api.get<User>('/auth/session');
      setUser(response.data);
    } catch {
      localStorage.removeItem('dayforge_token');
      setToken(null);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshSession();
  }, [refreshSession]);

  const login = async (email: string, password: string, rememberMe: boolean = true): Promise<User> => {
    const res = await api.post<{ access_token: string; user: User }>('/auth/login', {
      email,
      password,
      remember_me: rememberMe,
    });
    const newToken = res.data.access_token;
    if (typeof window !== 'undefined') {
      localStorage.setItem('dayforge_token', newToken);
    }
    setToken(newToken);
    setUser(res.data.user);
    return res.data.user;
  };

  const register = async (payload: { email: string; username: string; full_name: string; password: string; avatar_url?: string }): Promise<User> => {
    const res = await api.post<{ access_token: string; user: User }>('/auth/register', payload);
    const newToken = res.data.access_token;
    if (typeof window !== 'undefined') {
      localStorage.setItem('dayforge_token', newToken);
    }
    setToken(newToken);
    setUser(res.data.user);
    return res.data.user;
  };

  const logout = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('dayforge_token');
    }
    setToken(null);
    setUser(null);
  };

  const updateProfile = async (data: { full_name?: string; username?: string; bio?: string; primary_goal?: string; focus_areas?: string; avatar_url?: string }) => {
    const res = await api.put<User>('/auth/profile', data);
    setUser(res.data);
  };

  const uploadAvatar = async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append('file', file);
    const res = await api.post<{ avatar_url: string }>('/auth/avatar', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    await refreshSession();
    return res.data.avatar_url;
  };

  const removeAvatar = async () => {
    await api.delete('/auth/avatar');
    await refreshSession();
  };

  const completeOnboarding = async (payload: { focus_areas: string[]; primary_goal: string; target_habit_count: number; starter_habits?: any[] }) => {
    const res = await api.post<User>('/auth/onboarding', payload);
    setUser(res.data);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile: user?.profile || null,
        settings: user?.settings || null,
        token,
        isAuthenticated: !!user && !!token,
        isLoading,
        login,
        register,
        logout,
        updateProfile,
        uploadAvatar,
        removeAvatar,
        completeOnboarding,
        refreshSession,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
