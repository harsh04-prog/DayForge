'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { api } from '../services/api';
import { useAuth } from './AuthContext';
import { useToast } from './ToastContext';
import { soundEffects } from '../utils/soundEffects';
import confetti from 'canvas-confetti';

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

export const TodoProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const { showSuccess, showError, showXPToast } = useToast();

  const [todos, setTodos] = useState<TodoItem[]>([]);
  const [stats, setStats] = useState<TodoStats>({ total: 0, pending: 0, today: 0, overdue: 0, completed: 0 });
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const fetchTodos = useCallback(async () => {
    if (!isAuthenticated) {
      setTodos([]);
      return;
    }

    try {
      setIsLoading(true);
      const res = await api.get<{ todos: TodoItem[]; stats: TodoStats }>('/todos');
      if (res.data) {
        setTodos(res.data.todos || []);
        if (res.data.stats) setStats(res.data.stats);
      }
    } catch {
      // Graceful fallback
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchTodos();
    } else {
      setTodos([]);
    }
  }, [isAuthenticated, fetchTodos]);

  const createTodo = async (data: Partial<TodoItem>): Promise<TodoItem> => {
    try {
      const res = await api.post<TodoItem>('/todos', data);
      setTodos((prev) => [res.data, ...prev]);
      showSuccess('Task Created', `"${res.data.title}" added to your to-do list.`);
      await fetchTodos();
      return res.data;
    } catch (err: any) {
      showError('Error', err.response?.data?.detail || 'Failed to create task.');
      throw err;
    }
  };

  const updateTodo = async (id: number, data: Partial<TodoItem>): Promise<TodoItem> => {
    try {
      const res = await api.put<TodoItem>(`/todos/${id}`, data);
      setTodos((prev) => prev.map((t) => (t.id === id ? res.data : t)));
      showSuccess('Task Updated', 'Task changes saved.');
      await fetchTodos();
      return res.data;
    } catch (err: any) {
      showError('Error', err.response?.data?.detail || 'Failed to update task.');
      throw err;
    }
  };

  const toggleTodo = async (id: number) => {
    // Optimistic toggle
    const currentTodo = todos.find((t) => t.id === id);
    const newCompleted = currentTodo ? !currentTodo.completed : true;

    setTodos((prev) =>
      prev.map((t) => (t.id === id ? { ...t, completed: newCompleted } : t))
    );

    if (newCompleted) {
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

    try {
      await api.post(`/todos/${id}/toggle`);
      await fetchTodos();
    } catch (err: any) {
      // Rollback
      await fetchTodos();
      showError('Error', err.response?.data?.detail || 'Failed to toggle task.');
    }
  };

  const deleteTodo = async (id: number) => {
    setTodos((prev) => prev.filter((t) => t.id !== id));
    try {
      await api.delete(`/todos/${id}`);
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
