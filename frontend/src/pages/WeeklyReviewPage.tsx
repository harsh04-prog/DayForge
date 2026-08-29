import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { WeeklyReview } from '../types';
import { Card } from '../components/common/Card';
import { Sparkles, Calendar, TrendingUp, AlertCircle, Award, CheckCircle2, Flame } from 'lucide-react';

export const WeeklyReviewPage: React.FC = () => {
  const [review, setReview] = useState<WeeklyReview | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchReview = async () => {
      try {
        setIsLoading(true);
        const res = await api.get<WeeklyReview>('/analytics/weekly-review');
        setReview(res.data);
      } catch (err) {
        console.error('Failed to load weekly review', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchReview();
  }, []);

  if (isLoading) {
    return (
      <div className="py-12 text-center text-sm font-bold text-slate-400 animate-pulse">
        Compiling weekly report card...
      </div>
    );
  }

  if (!review) {
    return (
      <Card className="text-center py-12 bg-white dark:bg-[#151724] border border-slate-200/90 dark:border-[#2E3348]">
        <Sparkles className="w-8 h-8 text-[#6C5CE7] mx-auto mb-2" />
        <h3 className="text-sm font-bold text-slate-800 dark:text-white">Weekly Review Initializing</h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Complete a few habit sessions this week to unlock your detailed report card.
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto text-slate-900 dark:text-slate-100">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
          Automated Weekly Review
        </h1>
        <p className="text-xs sm:text-sm font-semibold text-slate-500 dark:text-slate-400 mt-1">
          Week of {review.week_start_date} to {review.week_end_date}
        </p>
      </div>

      {/* Main Score Card */}
      <Card className="bg-gradient-to-br from-[#181B26] via-[#1E2232] to-[#181B26] text-white border border-[#2E3348] shadow-xl p-6 sm:p-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div>
            <span className="text-[10px] font-black uppercase tracking-widest text-[#6C5CE7] bg-[#6C5CE7]/20 border border-[#6C5CE7]/30 px-3 py-1 rounded-full">
              Weekly Performance
            </span>
            <div className="flex items-baseline gap-3 mt-3">
              <span className="text-4xl sm:text-5xl font-black text-white tracking-tight">
                {review.completion_rate}%
              </span>
              <span className="text-sm font-bold text-slate-300">
                ({review.total_completed} of {review.total_scheduled} scheduled habits)
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-2 font-medium">
              You earned <strong className="text-[#FFB547]">+{review.xp_earned} XP</strong> across your routines this week!
            </p>
          </div>

          <div className="w-16 h-16 rounded-3xl bg-[#6C5CE7]/20 border border-[#6C5CE7]/30 flex items-center justify-center text-[#FFB547] shrink-0">
            <Award className="w-8 h-8" />
          </div>
        </div>
      </Card>

      {/* Highlights 4-Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Best Habit */}
        <Card className="p-5 bg-white dark:bg-[#151724] border border-slate-200/90 dark:border-[#2E3348] shadow-soft space-y-2">
          <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 text-xs font-bold uppercase tracking-wider">
            <CheckCircle2 className="w-4 h-4" />
            <span>Top Performing Habit</span>
          </div>
          <h3 className="text-lg font-black text-slate-900 dark:text-white">
            {review.best_habit || 'All active habits'}
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
            Sustained highest consistency and minimal skips throughout the week.
          </p>
        </Card>

        {/* Needs Attention */}
        <Card className="p-5 bg-white dark:bg-[#151724] border border-slate-200/90 dark:border-[#2E3348] shadow-soft space-y-2">
          <div className="flex items-center gap-2 text-amber-600 dark:text-[#FFB547] text-xs font-bold uppercase tracking-wider">
            <AlertCircle className="w-4 h-4" />
            <span>Growth Opportunity</span>
          </div>
          <h3 className="text-lg font-black text-slate-900 dark:text-white">
            {review.needs_attention_habit || 'No lagging habits'}
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
            Opportunity to adjust trigger time or stack with another routine.
          </p>
        </Card>

        {/* Actionable Insight */}
        <Card className="p-5 bg-white dark:bg-[#151724] border border-slate-200/90 dark:border-[#2E3348] shadow-soft space-y-2">
          <div className="flex items-center gap-2 text-[#6C5CE7] dark:text-[#A29BFE] text-xs font-bold uppercase tracking-wider">
            <Sparkles className="w-4 h-4" />
            <span>Actionable Insight</span>
          </div>
          <h3 className="text-lg font-black text-slate-900 dark:text-white">
            {review.actionable_insight || 'Target 80%+ Execution'}
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
            Personalized behavioral analysis based on your weekly consistency.
          </p>
        </Card>

        {/* Peak Timing */}
        <Card className="p-5 bg-white dark:bg-[#151724] border border-slate-200/90 dark:border-[#2E3348] shadow-soft space-y-2">
          <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 text-xs font-bold uppercase tracking-wider">
            <Calendar className="w-4 h-4" />
            <span>Peak Execution Day</span>
          </div>
          <h3 className="text-lg font-black text-slate-900 dark:text-white">
            {review.best_day || 'Consistent Everyday'}
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
            Your most productive day of the week for executing routines.
          </p>
        </Card>
      </div>
    </div>
  );
};
