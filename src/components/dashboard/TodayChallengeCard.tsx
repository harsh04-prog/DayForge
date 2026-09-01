'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Check, Flame, Plus, Minus, Trophy, Sparkles } from 'lucide-react';
import { HabitIcon } from '../common/IconHelper';
import { Badge } from '../common/Badge';
import { api } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { soundEffects } from '../../utils/soundEffects';
import confetti from 'canvas-confetti';

interface TodayChallengeCardProps {
  challenge: any;
  onRefresh: () => void;
}

export const TodayChallengeCard: React.FC<TodayChallengeCardProps> = ({ challenge, onRefresh }) => {
  const { showSuccess, showError } = useToast();
  const [isUpdating, setIsUpdating] = useState(false);

  const isCompleted = Boolean(challenge.today_completed);
  const currentVal = challenge.today_progress || 0;
  const targetVal = challenge.today_target || challenge.daily_target || 1;
  const unit = challenge.unit || 'units';
  const isQuantitative = targetVal > 1;

  const progressPct = isQuantitative
    ? Math.min(100, Math.round((currentVal / targetVal) * 100))
    : isCompleted
    ? 100
    : 0;

  const overallProgressPct = challenge.progress_percentage || Math.min(100, Math.round(((challenge.completed_days || 0) / (challenge.duration_days || 1)) * 100));

  const handleToggle = async (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setIsUpdating(true);
    try {
      const res = await api.post(`/challenges/${challenge.id}/checkin`, {
        progress: isCompleted ? 0 : targetVal,
        is_absolute: true,
      });

      if (!isCompleted) {
        soundEffects.playComplete();
        confetti({
          particleCount: 60,
          spread: 60,
          origin: { y: 0.7 },
        });
      }
      showSuccess('Challenge Updated', res.data.message || 'Progress logged.');
      onRefresh();
    } catch (err: any) {
      showError('Error', err.response?.data?.detail || "Couldn't update today's challenge progress. Please try again.");
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
      const res = await api.post(`/challenges/${challenge.id}/checkin`, {
        progress: newVal,
        is_absolute: true,
      });

      if (newVal >= targetVal && !isCompleted) {
        soundEffects.playComplete();
        confetti({
          particleCount: 60,
          spread: 60,
          origin: { y: 0.7 },
        });
      }
      showSuccess('Challenge Progress', res.data.message || 'Progress updated.');
      onRefresh();
    } catch (err: any) {
      showError('Error', err.response?.data?.detail || "Couldn't update today's challenge progress. Please try again.");
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.2 }}
      className={`group w-full rounded-3xl p-4 sm:p-5 transition-all duration-200 border flex flex-col justify-between ${
        isCompleted
          ? 'bg-amber-50/40 border-amber-300/60 shadow-xs'
          : 'bg-white border-slate-200/90 hover:border-amber-400/50 hover:shadow-soft'
      }`}
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 sm:gap-4 w-full">
        {/* Main Content Area */}
        <Link
          href="/challenges"
          className="flex items-start sm:items-center gap-3 sm:gap-3.5 min-w-0 flex-1 group"
        >
          {/* Icon */}
          <div
            className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-xs transition-transform group-hover:scale-105 ${
              isCompleted
                ? 'bg-[#FFB547] text-white shadow-xs'
                : 'bg-[#FFB547]/15 border border-[#FFB547]/30 text-[#D97706]'
            }`}
          >
            <HabitIcon name={challenge.icon || 'trophy'} className="w-6 h-6 shrink-0" />
          </div>

          {/* Title & Metadata Column */}
          <div className="min-w-0 flex-1 space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="text-[9px] font-black uppercase tracking-wider text-amber-700 bg-amber-100/70 border border-amber-200 px-2 py-0.5 rounded-full flex items-center gap-1">
                <Trophy className="w-2.5 h-2.5" />
                Active Challenge
              </span>
              <span className="text-[10px] font-black text-slate-500">
                Day {challenge.current_day || 1} of {challenge.duration_days}
              </span>
            </div>

            <h3 className={`font-black text-base tracking-tight leading-snug break-words ${
              isCompleted ? 'text-slate-700' : 'text-slate-900'
            }`}>
              {challenge.title}
            </h3>

            {/* Badges & Meta Row */}
            <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
              <Badge size="sm" variant="default" className="text-[10px] py-0.5 px-2 bg-amber-50 text-amber-800 border-amber-200">
                {challenge.category}
              </Badge>

              <span className="text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-200/80 px-2 py-0.5 rounded-md shrink-0 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-[#FFB547]" />
                +{challenge.daily_xp || 15} XP Daily
              </span>

              <span className="text-[11px] font-bold text-slate-400">
                • {challenge.remaining_days ?? (challenge.duration_days - (challenge.completed_days || 0))} days left
              </span>
            </div>

            {/* Quantitative Target text on mobile */}
            {isQuantitative && (
              <p className="text-xs font-semibold text-slate-600 sm:hidden">
                Today's Goal: <strong className="text-slate-900">{currentVal}</strong> / {targetVal} {unit} ({progressPct}%)
              </p>
            )}
          </div>
        </Link>

        {/* Right / Bottom Action Controls */}
        <div className="flex items-center justify-between sm:justify-end gap-2 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100 shrink-0 w-full sm:w-auto">
          {/* Quantitative status text on desktop */}
          {isQuantitative && (
            <div className="hidden sm:block text-right mr-1">
              <span className="text-xs font-black text-slate-800 block">
                {currentVal} / {targetVal} {unit}
              </span>
              <span className="text-[10px] font-semibold text-slate-400">
                {progressPct}% today
              </span>
            </div>
          )}

          {/* Stepper Buttons for quantitative challenges */}
          {isQuantitative && (
            <div className="flex items-center bg-slate-50 border border-slate-200 rounded-2xl p-1 gap-1">
              <button
                type="button"
                onClick={(e) => handleAdjustValue(-1, e)}
                disabled={currentVal <= 0 || isUpdating}
                className="w-10 h-10 sm:w-9 sm:h-9 flex items-center justify-center rounded-xl bg-white text-slate-700 hover:text-slate-900 active:bg-slate-100 disabled:opacity-30 transition-colors shadow-xs"
                title="Decrease"
                aria-label="Decrease challenge progress"
              >
                <Minus className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={(e) => handleAdjustValue(1, e)}
                disabled={isUpdating}
                className="w-10 h-10 sm:w-9 sm:h-9 flex items-center justify-center rounded-xl bg-white text-slate-700 hover:text-slate-900 active:bg-slate-100 transition-colors shadow-xs"
                title="Increase"
                aria-label="Increase challenge progress"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Big Checkmark / Check In Tap Button */}
          <button
            type="button"
            onClick={handleToggle}
            disabled={isUpdating}
            className={`min-h-[44px] min-w-[44px] h-11 sm:h-12 sm:w-12 px-4 sm:px-0 rounded-2xl flex items-center justify-center transition-all duration-200 focus:outline-none select-none active:scale-95 flex-1 sm:flex-initial ${
              isCompleted
                ? 'bg-[#FFB547] text-slate-900 font-black shadow-xs'
                : 'bg-amber-50 hover:bg-amber-100/80 text-amber-700 border border-amber-200 hover:border-amber-300'
            }`}
            title={isCompleted ? 'Completed today (tap to undo)' : 'Tap to check in today'}
            aria-label={isCompleted ? 'Challenge completed today' : 'Check in challenge'}
          >
            {isCompleted ? (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                className="flex items-center gap-1.5 font-black"
              >
                <Check className="w-5 h-5 stroke-[3]" />
                <span className="sm:hidden text-xs">Done</span>
              </motion.div>
            ) : (
              <div className="flex items-center gap-1.5 font-black">
                <Check className="w-5 h-5 stroke-[2.5]" />
                <span className="sm:hidden text-xs">Check In</span>
              </div>
            )}
          </button>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mt-3 pt-2.5 border-t border-slate-100">
        <div className="flex items-center justify-between text-[11px] font-bold text-slate-500 mb-1">
          <span>Overall: {challenge.completed_days || 0} / {challenge.duration_days} days</span>
          <span className="text-amber-700 font-black">{overallProgressPct}% complete</span>
        </div>
        <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500 bg-[#FFB547]"
            style={{ width: `${overallProgressPct}%` }}
          />
        </div>
      </div>
    </motion.div>
  );
};
