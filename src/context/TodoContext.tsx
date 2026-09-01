'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { api } from '../services/api';
import { useAuth } from './AuthContext';
import { useToast } from './ToastContext';
import { soundEffects } from '../utils/soundEffects';
import confetti from 'canvas-confetti';
import { formatDate } from '../lib/streakEngine';

export interface TodoItem {
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

export interface TodoStats {
  total: number;
  pending: number;
  today: number;
  overdue: number;
  completed: number;
}

interface TodoContextType {
  todos: TodoItem[];
  stats: TodoStats;
  isLoading: boolean;
  fetchTodos: () => Promise<void>;
  createTodo: (data: Partial<TodoItem>) => Promise<TodoItem>;
  updateTodo: (id: number, data: Partial<TodoItem>) => Promise<TodoItem>;
  toggleTodo: (id: number) => Promise<void>;
  deleteTodo: (id: number) => Promise<void>;
}

const TodoContext = createContext<TodoContextType | undefined>(undefined);

function computeStats(todoList: TodoItem[]): TodoStats {
  const todayStr = formatDate(new Date());
  const total = todoList.length;
  const completed = todoList.filter((t) => t.completed).length;
  const pending = todoList.filter((t) => !t.completed).length;
  const today = todoList.filter((t) => !t.completed && t.due_date === todayStr).length;
  const overdue = todoList.filter((t) => !t.completed && t.due_date && t.due_date < todayStr).length;
  return { total, pending, today, overdue, completed };
}

export const TodoProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const { showSuccess, showError, showXPToast } = useToast();

  const [todos, setTodos] = useState<TodoItem[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const cached = localStorage.getItem('dayforge_todos_cache');
        if (cached) {
          const parsed = JSON.parse(cached);
          if (Array.isArray(parsed)) return parsed;
        }
      } catch {}
    }
    return [];
  });

  const [stats, setStats] = useState<TodoStats>(() => {
    if (typeof window !== 'undefined') {
      try {
        const cached = localStorage.getItem('dayforge_todos_stats_cache');
        if (cached) return JSON.parse(cached);
      } catch {}
    }
    return computeStats(todos);
  });

  const [isLoading, setIsLoading] = useState<boolean>(false);

  const fetchTodos = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await api.get<{ todos: TodoItem[]; stats: TodoStats }>('/todos');
      if (res.data) {
        const freshTodos = res.data.todos || [];
        setTodos(freshTodos);
        const calculatedStats = res.data.stats || computeStats(freshTodos);
        setStats(calculatedStats);

        if (typeof window !== 'undefined') {
          try {
            localStorage.setItem('dayforge_todos_cache', JSON.stringify(freshTodos));
            localStorage.setItem('dayforge_todos_stats_cache', JSON.stringify(calculatedStats));
          } catch {}
        }
      }
    } catch {
      // Graceful fallback
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      fetchTodos();
    }
  }, [isAuthenticated, fetchTodos]);

  const createTodo = async (data: Partial<TodoItem>): Promise<TodoItem> => {
    try {
      const res = await api.post<TodoItem & { vault_token?: string }>('/todos', data);
      const newTodo = res.data;
      setTodos((prev) => {
        const updated = [newTodo, ...prev];
        const newStats = computeStats(updated);
        setStats(newStats);
        try {
          localStorage.setItem('dayforge_todos_cache', JSON.stringify(updated));
          localStorage.setItem('dayforge_todos_stats_cache', JSON.stringify(newStats));
        } catch {}
        return updated;
      });
      if (res.data?.vault_token && typeof window !== 'undefined') {
        localStorage.setItem('dayforge_data_vault', res.data.vault_token);
      }
      showSuccess('Task Created', `"${newTodo.title}" added to your to-do list.`);
      await fetchTodos();
      return newTodo;
    } catch (err: any) {
      showError('Error', err.response?.data?.detail || 'Failed to create task.');
      throw err;
    }
  };

  const updateTodo = async (id: number, data: Partial<TodoItem>): Promise<TodoItem> => {
    const numId = Number(id);
    try {
      const res = await api.put<TodoItem & { vault_token?: string }>(`/todos/${numId}`, data);
      setTodos((prev) => {
        const updated = prev.map((t) => (Number(t.id) === numId ? res.data : t));
        const newStats = computeStats(updated);
        setStats(newStats);
        try {
          localStorage.setItem('dayforge_todos_cache', JSON.stringify(updated));
          localStorage.setItem('dayforge_todos_stats_cache', JSON.stringify(newStats));
        } catch {}
        return updated;
      });
      if (res.data?.vault_token && typeof window !== 'undefined') {
        localStorage.setItem('dayforge_data_vault', res.data.vault_token);
      }
      showSuccess('Task Updated', 'Task changes saved.');
      await fetchTodos();
      return res.data;
    } catch (err: any) {
      showError('Error', err.response?.data?.detail || 'Failed to update task.');
      throw err;
    }
  };

  const toggleTodo = async (id: number) => {
    const numId = Number(id);
    let isNowCompleted = false;

    // 1. Optimistic state and cache update
    setTodos((prev) => {
      const updated = prev.map((t) => {
        if (Number(t.id) === numId) {
          isNowCompleted = !t.completed;
          return {
            ...t,
            completed: isNowCompleted,
            completed_at: isNowCompleted ? new Date().toISOString() : null,
          };
        }
        return t;
      });
      const newStats = computeStats(updated);
      setStats(newStats);
      try {
        localStorage.setItem('dayforge_todos_cache', JSON.stringify(updated));
        localStorage.setItem('dayforge_todos_stats_cache', JSON.stringify(newStats));
      } catch {}
      return updated;
    });

    // 2. Audio & Visual celebrations
    if (isNowCompleted) {
      soundEffects.playComplete();
      showXPToast(5, 'Task Checked Off!');
      confetti({
        particleCount: 40,
        spread: 50,
        origin: { y: 0.8 },
      });
    } else {
      soundEffects.playPop();
    }

    // 3. Persist to API & Vault
    try {
      const res = await api.post(`/todos/${numId}/toggle`);
      if (res.data?.vault_token && typeof window !== 'undefined') {
        localStorage.setItem('dayforge_data_vault', res.data.vault_token);
      }
      await fetchTodos();
    } catch (err: any) {
      await fetchTodos();
      showError('Error', err.response?.data?.detail || 'Failed to toggle task status.');
    }
  };

  const deleteTodo = async (id: number) => {
    const numId = Number(id);
    
    // 1. Optimistic remove from local list & cache
    setTodos((prev) => {
      const updated = prev.filter((t) => Number(t.id) !== numId);
      const newStats = computeStats(updated);
      setStats(newStats);
      try {
        localStorage.setItem('dayforge_todos_cache', JSON.stringify(updated));
        localStorage.setItem('dayforge_todos_stats_cache', JSON.stringify(newStats));
      } catch {}
      return updated;
    });

    // 2. Persist delete on API & Vault
    try {
      const res = await api.delete(`/todos/${numId}`);
      if (res.data?.vault_token && typeof window !== 'undefined') {
        localStorage.setItem('dayforge_data_vault', res.data.vault_token);
      }
      showSuccess('Task Deleted', 'Task removed from your list.');
      await fetchTodos();
    } catch (err: any) {
      await fetchTodos();
      showError('Error', err.response?.data?.detail || 'Failed to delete task.');
    }
  };

  return (
    <TodoContext.Provider
      value={{
        todos,
        stats,
        isLoading,
        fetchTodos,
        createTodo,
        updateTodo,
        toggleTodo,
        deleteTodo,
      }}
    >
      {children}
    </TodoContext.Provider>
  );
};

export const useTodos = () => {
  const context = useContext(TodoContext);
  if (!context) throw new Error('useTodos must be used within a TodoProvider');
  return context;
};
