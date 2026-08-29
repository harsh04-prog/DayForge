import React, { createContext, useContext, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, AlertCircle, Sparkles, Trophy, Zap, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'xp' | 'level' | 'achievement' | 'info';

export interface Toast {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  xpAmount?: number;
  duration?: number;
}

interface ToastContextType {
  showToast: (toast: Omit<Toast, 'id'>) => void;
  showXPToast: (amount: number, message?: string) => void;
  showSuccess: (title: string, message?: string) => void;
  showError: (title: string, message?: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback((toast: Omit<Toast, 'id'>) => {
    const id = Math.random().toString(36).substring(2, 9);
    const newToast: Toast = { ...toast, id };
    setToasts((prev) => [...prev.slice(-4), newToast]);

    const duration = toast.duration || 3500;
    setTimeout(() => {
      removeToast(id);
    }, duration);
  }, [removeToast]);

  const showXPToast = useCallback((amount: number, message: string = 'Habit Completed') => {
    showToast({
      type: 'xp',
      title: `+${amount} XP`,
      message,
      xpAmount: amount,
      duration: 3000,
    });
  }, [showToast]);

  const showSuccess = useCallback((title: string, message?: string) => {
    showToast({ type: 'success', title, message });
  }, [showToast]);

  const showError = useCallback((title: string, message?: string) => {
    showToast({ type: 'error', title, message: message || 'Something went wrong.' });
  }, [showToast]);

  return (
    <ToastContext.Provider value={{ showToast, showXPToast, showSuccess, showError }}>
      {children}
      <div className="fixed bottom-20 md:bottom-6 right-4 md:right-6 z-50 flex flex-col gap-2.5 max-w-sm w-full pointer-events-none">
        <AnimatePresence>
          {toasts.map((t) => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="pointer-events-auto bg-white/95 backdrop-blur-md border border-slate-200/80 shadow-lg rounded-2xl p-3.5 flex items-center justify-between gap-3 text-slate-800"
            >
              <div className="flex items-center gap-3">
                {t.type === 'xp' && (
                  <div className="w-9 h-9 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-500 font-bold text-sm shadow-sm">
                    <Zap className="w-5 h-5 fill-amber-400 text-amber-500" />
                  </div>
                )}
                {t.type === 'level' && (
                  <div className="w-9 h-9 rounded-xl bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-600 shadow-sm">
                    <Sparkles className="w-5 h-5 text-indigo-600 animate-pulse" />
                  </div>
                )}
                {t.type === 'achievement' && (
                  <div className="w-9 h-9 rounded-xl bg-purple-50 border border-purple-200 flex items-center justify-center text-purple-600 shadow-sm">
                    <Trophy className="w-5 h-5 text-purple-600" />
                  </div>
                )}
                {t.type === 'success' && (
                  <div className="w-9 h-9 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 shadow-sm">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  </div>
                )}
                {t.type === 'error' && (
                  <div className="w-9 h-9 rounded-xl bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600 shadow-sm">
                    <AlertCircle className="w-5 h-5 text-rose-600" />
                  </div>
                )}
                <div>
                  <div className="font-bold text-sm text-slate-900 leading-snug">
                    {t.title}
                  </div>
                  {t.message && (
                    <div className="text-xs text-slate-500 font-medium">
                      {t.message}
                    </div>
                  )}
                </div>
              </div>
              <button
                onClick={() => removeToast(t.id)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToast must be used within ToastProvider');
  return context;
};
