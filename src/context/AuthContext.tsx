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
  logout: () => Promise<void>;
  updateProfile: (data: { full_name?: string; username?: string; bio?: string; primary_goal?: string; focus_areas?: string; avatar_url?: string }) => Promise<void>;
  uploadAvatar: (file: File) => Promise<string>;
  removeAvatar: () => Promise<void>;
  completeOnboarding: (payload: { focus_areas: string[]; primary_goal: string; target_habit_count: number; starter_habits?: any[] }) => Promise<void>;
  refreshSession: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    if (typeof window !== 'undefined') {
      try {
        const savedUser = localStorage.getItem('dayforge_user');
        if (savedUser) return JSON.parse(savedUser);
      } catch {}
    }
    return null;
  });

  const [token, setToken] = useState<string | null>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('dayforge_token');
    }
    return null;
  });

  const [profile, setProfile] = useState<Profile | null>(() => {
    if (typeof window !== 'undefined') {
      try {
        const savedProfile = localStorage.getItem('dayforge_profile');
        if (savedProfile) return JSON.parse(savedProfile);
      } catch {}
    }
    return null;
  });

  const [settings, setSettings] = useState<UserSettings | null>(() => {
    if (typeof window !== 'undefined') {
      try {
        const savedSettings = localStorage.getItem('dayforge_settings');
        if (savedSettings) return JSON.parse(savedSettings);
      } catch {}
    }
    return null;
  });

  const [isLoading, setIsLoading] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return !localStorage.getItem('dayforge_token');
    }
    return false;
  });

  const refreshSession = useCallback(async () => {
    if (typeof window === 'undefined') {
      setIsLoading(false);
      return;
    }

    const savedToken = localStorage.getItem('dayforge_token');

    try {
      const response = await api.get<User & { profile?: Profile; settings?: UserSettings; access_token?: string }>('/auth/session');
      if (response.data && response.data.id) {
        const validToken = response.data.access_token || savedToken;
        setUser(response.data);
        if (response.data.profile) setProfile(response.data.profile);
        if (response.data.settings) setSettings(response.data.settings);
        if (validToken) {
          setToken(validToken);
          localStorage.setItem('dayforge_token', validToken);
        }

        try {
          localStorage.setItem('dayforge_user', JSON.stringify(response.data));
          if (response.data.profile) localStorage.setItem('dayforge_profile', JSON.stringify(response.data.profile));
          if (response.data.settings) localStorage.setItem('dayforge_settings', JSON.stringify(response.data.settings));
        } catch {}
      } else {
        setUser(null);
        setToken(null);
        setProfile(null);
        setSettings(null);
      }
    } catch (err: any) {
      if (err.response?.status === 401) {
        if (typeof window !== 'undefined') {
          localStorage.removeItem('dayforge_token');
          localStorage.removeItem('dayforge_user');
          localStorage.removeItem('dayforge_profile');
        }
        setToken(null);
        setUser(null);
        setProfile(null);
        setSettings(null);
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshSession();
  }, [refreshSession]);

  const login = async (email: string, password: string, rememberMe: boolean = true): Promise<User> => {
    const cleanId = email.toLowerCase().trim();

    // Check if client has local vault token for cross-container serverless recovery
    let vaultToken: string | undefined;
    if (typeof window !== 'undefined') {
      try {
        const storedRegistry = localStorage.getItem('dayforge_user_registry');
        if (storedRegistry) {
          const registry = JSON.parse(storedRegistry);
          vaultToken =
            registry[cleanId]?.vault_token ||
            registry[cleanId] ||
            (Object.values(registry) as any[]).find((r: any) => r?.email === cleanId || r?.username === cleanId)
              ?.vault_token;
        }
        if (!vaultToken) {
          vaultToken = localStorage.getItem('dayforge_last_vault_token') || undefined;
        }
      } catch {}
    }

    const res = await api.post<{ access_token: string; user: User; vault_token?: string }>('/auth/login', {
      email: cleanId,
      password,
      remember_me: rememberMe,
      vault_token: vaultToken,
    });

    const newToken = res.data.access_token;
    if (typeof window !== 'undefined') {
      localStorage.setItem('dayforge_token', newToken);

      if (res.data.vault_token) {
        try {
          const storedRegistry = localStorage.getItem('dayforge_user_registry') || '{}';
          const registry = JSON.parse(storedRegistry);
          const userRec = {
            id: res.data.user.id,
            email: res.data.user.email.toLowerCase().trim(),
            username: res.data.user.username.toLowerCase().trim(),
            full_name: res.data.user.full_name,
            vault_token: res.data.vault_token,
          };
          registry[res.data.user.email.toLowerCase().trim()] = userRec;
          registry[res.data.user.username.toLowerCase().trim()] = userRec;
          localStorage.setItem('dayforge_user_registry', JSON.stringify(registry));
          localStorage.setItem('dayforge_last_vault_token', res.data.vault_token);
        } catch {}
      }
    }

    setToken(newToken);
    setUser(res.data.user);
    if ((res.data.user as any).profile) setProfile((res.data.user as any).profile);
    if ((res.data.user as any).settings) setSettings((res.data.user as any).settings);
    return res.data.user;
  };

  const register = async (payload: { email: string; username: string; full_name: string; password: string; avatar_url?: string }): Promise<User> => {
    const cleanEmail = payload.email.toLowerCase().trim();
    const cleanUsername = payload.username.toLowerCase().trim();

    const res = await api.post<{ access_token: string; user: User; vault_token?: string }>('/auth/register', {
      ...payload,
      email: cleanEmail,
      username: cleanUsername,
    });

    const newToken = res.data.access_token;
    if (typeof window !== 'undefined') {
      localStorage.setItem('dayforge_token', newToken);

      if (res.data.vault_token) {
        try {
          const storedRegistry = localStorage.getItem('dayforge_user_registry') || '{}';
          const registry = JSON.parse(storedRegistry);
          const userRec = {
            id: res.data.user.id,
            email: cleanEmail,
            username: cleanUsername,
            full_name: payload.full_name,
            vault_token: res.data.vault_token,
          };
          registry[cleanEmail] = userRec;
          registry[cleanUsername] = userRec;
          localStorage.setItem('dayforge_user_registry', JSON.stringify(registry));
          localStorage.setItem('dayforge_last_vault_token', res.data.vault_token);
        } catch {}
      }
    }

    setToken(newToken);
    setUser(res.data.user);
    if ((res.data.user as any).profile) setProfile((res.data.user as any).profile);
    if ((res.data.user as any).settings) setSettings((res.data.user as any).settings);
    return res.data.user;
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch {}
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
        isAuthenticated: !!user,
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
