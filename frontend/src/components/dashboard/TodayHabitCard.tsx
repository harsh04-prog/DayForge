import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Check, Flame, Plus, Minus } from 'lucide-react';
import { Habit } from '../../types';
import { HabitIcon } from '../common/IconHelper';
import { Badge } from '../common/Badge';
import { useHabits } from '../../context/HabitContext';

interface TodayHabitCardProps {
  habit: Habit;
  onEdit?: (habit: Habit) => void;
}

export const TodayHabitCard: React.FC<TodayHabitCardProps> = ({ habit }) => {
  const { completeHabit, undoHabit } = useHabits();
  const [isUpdating, setIsUpdating] = useState(false);

  const isCompleted = habit.today_completed;
  const isQuantitative = habit.habit_type === 'quantitative';
  const currentVal = habit.today_progress || 0;
  const targetVal = habit.target_value || 1;

  const handleToggle = async (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setIsUpdating(true);
    try {
      if (isCompleted) {
        await undoHabit(habit.id);
      } else {
        await completeHabit(habit.id, isQuantitative ? targetVal : 1);
      }
    } finally {
      setIsUpdating(false);
    }
  };

  const handleAdjustValue = async (delta: number, e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    const newVal = Math.max(0, currentVal + delta);
    setIsUpdating(true);
    try {
      if (newVal === 0 && isCompleted) {
        await undoHabit(habit.id);
      } else {
        await completeHabit(habit.id, newVal);
      }
    } finally {
      setIsUpdating(false);
    }
  };

  const progressPct = isQuantitative
    ? Math.min(100, Math.round((currentVal / targetVal) * 100))
    : isCompleted
    ? 100
    : 0;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.2 }}
      className={`group w-full rounded-3xl p-4 sm:p-5 transition-all duration-200 border flex flex-col justify-between ${
        isCompleted
          ? 'bg-slate-50/90 border-[#6C5CE7]/30 shadow-xs'
          : 'bg-white border-slate-200/90 hover:border-[#6C5CE7]/40 hover:shadow-soft'
      }`}
    >
      {/* ========================================================================= */}
      {/* RESPONSIVE LAYOUT: Stacks on mobile (< sm:), horizontal on desktop (sm:)  */}
      {/* ========================================================================= */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 sm:gap-4 w-full">
        
        {/* Main Content Area */}
        <Link
          to={`/habits/${habit.id}`}
          className="flex items-start sm:items-center gap-3 sm:gap-3.5 min-w-0 flex-1 group"
        >
          {/* Icon (Fixed non-shrinking size) */}
          <div
            className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-xs transition-transform group-hover:scale-105 ${
              isCompleted
                ? 'bg-[#6C5CE7] text-white shadow-xs'
                : 'bg-[#6C5CE7]/10 border border-[#6C5CE7]/20 text-[#6C5CE7]'
            }`}
          >
            <HabitIcon name={habit.icon} className="w-6 h-6 shrink-0" />
          </div>

          {/* Title & Metadata Column */}
          <div className="min-w-0 flex-1 space-y-1.5">
            {/* Title: Takes full width on mobile, wraps naturally without single-word break */}
            <h3
              className={`font-black text-base sm:text-base tracking-tight leading-snug line-clamp-2 break-words ${
                isCompleted ? 'text-slate-400 line-through' : 'text-slate-900'
              }`}
            >
              {habit.name}
            </h3>

            {/* Badges & Meta Row */}
            <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
              <Badge size="sm" variant="default" className="text-[10px] py-0.5 px-2">
                {habit.category}
              </Badge>

              {habit.current_streak > 0 && (
                <span className="inline-flex items-center gap-1 text-[10px] font-black text-[#D97706] bg-[#FFB547]/15 border border-[#FFB547]/30 px-2 py-0.5 rounded-md shrink-0">
                  <Flame className="w-3 h-3 fill-[#FFB547]" />
                  {habit.current_streak}d streak
                </span>
              )}

              <span className="text-[10px] font-bold text-[#6C5CE7] bg-[#6C5CE7]/10 px-2 py-0.5 rounded-md shrink-0">
                +{habit.difficulty === 'hard' ? 15 : habit.difficulty === 'easy' ? 5 : 10} XP
              </span>

              {!isQuantitative && (
                <span className="text-[11px] font-semibold text-slate-400 capitalize hidden sm:inline-block">
                  • {habit.preferred_time}
                </span>
              )}
            </div>

            {/* Quantitative Target text (Desktop view inline or subtitle) */}
            {isQuantitative && (
              <p className="text-xs font-semibold text-slate-600 sm:hidden">
                Progress: <strong className="text-slate-900">{currentVal}</strong> / {targetVal} {habit.unit || 'units'} ({progressPct}%)
              </p>
            )}
          </div>
        </Link>

        {/* Right / Bottom Action Controls */}
        <div className="flex items-center justify-between sm:justify-end gap-2 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100 shrink-0 w-full sm:w-auto">
          
          {/* Quantitative status text on desktop */}
          {isQuantitative && (
            <div className="hidden sm:block text-right mr-1">
              <span className="text-xs font-bold text-slate-700 block">
                {currentVal} / {targetVal} {habit.unit || 'units'}
              </span>
              <span className="text-[10px] font-semibold text-slate-400">
                {progressPct}% completed
              </span>
            </div>
          )}

          {/* Stepper Buttons for quantitative habits (min 40px touch targets) */}
          {isQuantitative && (
            <div className="flex items-center bg-slate-50 border border-slate-200 rounded-2xl p-1 gap-1">
              <button
                type="button"
                onClick={(e) => handleAdjustValue(-1, e)}
                disabled={currentVal <= 0 || isUpdating}
                className="w-10 h-10 sm:w-9 sm:h-9 flex items-center justify-center rounded-xl bg-white text-slate-700 hover:text-slate-900 active:bg-slate-100 disabled:opacity-30 transition-colors shadow-xs"
                title="Decrease"
                aria-label="Decrease progress"
              >
                <Minus className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={(e) => handleAdjustValue(1, e)}
                disabled={isUpdating}
                className="w-10 h-10 sm:w-9 sm:h-9 flex items-center justify-center rounded-xl bg-white text-slate-700 hover:text-slate-900 active:bg-slate-100 transition-colors shadow-xs"
                title="Increase"
                aria-label="Increase progress"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Big Checkmark Tap Button (min 44px on mobile & desktop) */}
          <button
            type="button"
            onClick={handleToggle}
            disabled={isUpdating}
            className={`min-h-[44px] min-w-[44px] h-11 sm:h-12 sm:w-12 px-4 sm:px-0 rounded-2xl flex items-center justify-center transition-all duration-200 focus:outline-none select-none active:scale-95 flex-1 sm:flex-initial ${
              isCompleted
                ? 'bg-[#6C5CE7] text-white shadow-xs'
                : 'bg-slate-100 hover:bg-[#6C5CE7]/15 text-slate-400 border border-slate-200 hover:border-[#6C5CE7]/50 hover:text-[#6C5CE7]'
            }`}
            title={isCompleted ? 'Completed today (tap to undo)' : 'Tap to mark completed'}
            aria-label={isCompleted ? 'Mark uncompleted' : 'Mark completed'}
          >
            {isCompleted ? (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                className="flex items-center gap-1.5"
              >
                <Check className="w-5 h-5 sm:w-6 sm:h-6 stroke-[3]" />
                <span className="sm:hidden text-xs font-bold">Done</span>
              </motion.div>
            ) : (
              <div className="flex items-center gap-1.5">
                <Check className="w-5 h-5 opacity-60 group-hover:opacity-100" />
                <span className="sm:hidden text-xs font-bold text-slate-600">Complete</span>
              </div>
            )}
          </button>
        </div>
      </div>

      {/* Quantitative Progress Bar spanning full card width */}
      {isQuantitative && (
        <div className="mt-3 pt-2 border-t border-slate-100/80">
          <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-300 ${
                isCompleted ? 'bg-[#6C5CE7]' : 'bg-[#6C5CE7]/80'
              }`}
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>
      )}
    </motion.div>
  );
};
