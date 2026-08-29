'use client';

import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { HabitIcon } from './IconHelper';
import { Button } from './Button';
import {
  Sparkles,
  Trophy,
  Zap,
  CheckCircle2,
  BookOpen,
  Dumbbell,
  Droplet,
  Brain,
  Code,
  Footprints,
  Flame
} from 'lucide-react';

export interface CelebrationData {
  type: 'task' | 'perfect_day' | 'level_up' | 'achievement';
  habitName?: string;
  category?: string;
  xpAwarded?: number;
  level?: number;
  title?: string;
  message?: string;
  badgeName?: string;
}

interface CelebrationModalProps {
  data: CelebrationData | null;
  onClose: () => void;
}

export const CelebrationModal: React.FC<CelebrationModalProps> = ({ data, onClose }) => {
  useEffect(() => {
    if (data) {
      const timer = setTimeout(() => {
        onClose();
      }, 3500);
      return () => clearTimeout(timer);
    }
  }, [data, onClose]);

  if (!data) return null;

  const renderTaskIconAnimation = (category?: string) => {
    switch (category?.toLowerCase()) {
      case 'reading':
        return (
          <motion.div
            initial={{ scale: 0, rotate: -30 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: 'spring', damping: 12 }}
            className="w-16 h-16 rounded-3xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shadow-lg shadow-indigo-500/20"
          >
            <BookOpen className="w-8 h-8" />
          </motion.div>
        );
      case 'fitness':
        return (
          <motion.div
            initial={{ scale: 0.5 }}
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 0.5, repeat: 1 }}
            className="w-16 h-16 rounded-3xl bg-orange-50 border border-orange-100 flex items-center justify-center text-orange-600 shadow-lg shadow-orange-500/20"
          >
            <Dumbbell className="w-8 h-8" />
          </motion.div>
        );
      case 'health':
        return (
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="w-16 h-16 rounded-3xl bg-cyan-50 border border-cyan-100 flex items-center justify-center text-cyan-600 shadow-lg shadow-cyan-500/20"
          >
            <Droplet className="w-8 h-8 fill-cyan-400/40" />
          </motion.div>
        );
      case 'study':
      case 'coding':
        return (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="w-16 h-16 rounded-3xl bg-purple-50 border border-purple-100 flex items-center justify-center text-purple-600 shadow-lg shadow-purple-500/20"
          >
            <Code className="w-8 h-8" />
          </motion.div>
        );
      case 'sleep':
      case 'personal growth':
      case 'meditation':
        return (
          <motion.div
            animate={{ scale: [1, 1.1, 1], opacity: [0.8, 1, 0.8] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            className="w-16 h-16 rounded-3xl bg-teal-50 border border-teal-100 flex items-center justify-center text-teal-600 shadow-lg shadow-teal-500/20"
          >
            <Brain className="w-8 h-8" />
          </motion.div>
        );
      default:
        return (
          <motion.div
            initial={{ scale: 0, rotate: -45 }}
            animate={{ scale: 1, rotate: 0 }}
            className="w-16 h-16 rounded-3xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 shadow-lg shadow-emerald-500/20"
          >
            <CheckCircle2 className="w-8 h-8" />
          </motion.div>
        );
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
        {/* Backdrop for major events */}
        {data.type !== 'task' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-xs pointer-events-auto"
          />
        )}

        <motion.div
          initial={{ opacity: 0, y: 30, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.9 }}
          transition={{ type: 'spring', damping: 20, stiffness: 300 }}
          className="relative bg-white rounded-3xl p-6 shadow-2xl border border-slate-200/90 text-center max-w-sm w-full pointer-events-auto z-10"
        >
          {/* LEVEL UP CELEBRATION */}
          {data.type === 'level_up' && (
            <div className="space-y-4">
              <div className="w-16 h-16 rounded-3xl bg-amber-500 text-white flex items-center justify-center mx-auto shadow-xl shadow-amber-500/30">
                <Zap className="w-8 h-8 fill-white" />
              </div>
              <div>
                <span className="text-xs font-black uppercase tracking-widest text-amber-600 bg-amber-50 px-3 py-1 rounded-full border border-amber-200">
                  Level Up!
                </span>
                <h3 className="text-2xl font-black text-slate-900 mt-2">
                  Level {data.level} Unlocked
                </h3>
                <p className="text-xs font-semibold text-indigo-600 mt-0.5">
                  Title: {data.title || 'Disciplined'}
                </p>
                <p className="text-xs text-slate-500 mt-2 font-medium">
                  {data.message || "You're becoming more consistent every single day."}
                </p>
              </div>
            </div>
          )}

          {/* PERFECT DAY CELEBRATION */}
          {data.type === 'perfect_day' && (
            <div className="space-y-4">
              <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-amber-400 to-amber-500 text-white flex items-center justify-center mx-auto shadow-xl shadow-amber-500/30">
                <Trophy className="w-8 h-8" />
              </div>
              <div>
                <span className="text-xs font-black uppercase tracking-widest text-amber-600 bg-amber-50 px-3 py-1 rounded-full border border-amber-200">
                  ✨ Perfect Day
                </span>
                <h3 className="text-xl font-black text-slate-900 mt-2">
                  100% Habits Complete!
                </h3>
                <p className="text-xs text-slate-500 mt-1 font-medium">
                  Everything you planned today is done. Compounding momentum at work!
                </p>
                <div className="inline-block mt-3 px-3 py-1 bg-amber-100/70 text-amber-800 text-xs font-black rounded-xl">
                  +{data.xpAwarded || 25} Bonus Daily XP
                </div>
              </div>
            </div>
          )}

          {/* ACHIEVEMENT CELEBRATION */}
          {data.type === 'achievement' && (
            <div className="space-y-4">
              <div className="w-16 h-16 rounded-3xl bg-purple-600 text-white flex items-center justify-center mx-auto shadow-xl shadow-purple-600/30">
                <Trophy className="w-8 h-8" />
              </div>
              <div>
                <span className="text-xs font-black uppercase tracking-widest text-purple-600 bg-purple-50 px-3 py-1 rounded-full border border-purple-200">
                  🏆 Achievement Unlocked
                </span>
                <h3 className="text-xl font-black text-slate-900 mt-2">
                  {data.badgeName || 'Milestone Reached'}
                </h3>
                <p className="text-xs text-slate-500 mt-1 font-medium">
                  {data.message || 'Another badge added to your character sheet.'}
                </p>
                <div className="inline-block mt-3 px-3 py-1 bg-purple-100/70 text-purple-800 text-xs font-black rounded-xl">
                  +{data.xpAwarded || 50} XP Awarded
                </div>
              </div>
            </div>
          )}

          {/* TASK COMPLETION MICRO-CELEBRATION */}
          {data.type === 'task' && (
            <div className="space-y-3 py-1">
              <div className="flex justify-center">
                {renderTaskIconAnimation(data.category)}
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900">
                  {data.habitName || 'Habit Complete!'}
                </h3>
                <p className="text-xs text-slate-500 font-medium">
                  {data.message || 'One step closer to your daily goal.'}
                </p>
              </div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-700 text-xs font-black rounded-xl border border-emerald-200/80">
                <Zap className="w-3.5 h-3.5 fill-emerald-500 text-emerald-600" />
                +{data.xpAwarded || 10} XP
              </div>
            </div>
          )}

          <div className="mt-4 pt-3 border-t border-slate-100 flex justify-center">
            <button
              onClick={onClose}
              className="text-xs font-bold text-slate-400 hover:text-slate-700 transition-colors"
            >
              Dismiss
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

