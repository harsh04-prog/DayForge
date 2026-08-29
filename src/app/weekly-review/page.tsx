'use client';

import React, { useState, useEffect } from 'react';
import { api } from '@/services/api';
import { WeeklyReview } from '@/types';
import { Card } from '@/components/common/Card';
import { Sparkles, Calendar, TrendingUp, AlertCircle, Award, CheckCircle2, Flame } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';

export default function WeeklyReviewPage() {
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

  return (
    <AppLayout>
      <div className="space-y-6 max-w-4xl mx-auto text-slate-900">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Automated Weekly Review
          </h1>
          <p className="text-xs sm:text-sm font-semibold text-slate-500 mt-1">
            Sunday retrospectives, key milestones, and optimization focuses.
          </p>
        </div>

        {isLoading ? (
          <div className="py-12 text-center text-sm font-bold text-slate-400 animate-pulse">
            Compiling weekly report card...
          </div>
        ) : !review ? (
          <Card className="text-center py-12 bg-white border border-slate-200/90">
            <Sparkles className="w-8 h-8 text-[#6C5CE7] mx-auto mb-2" />
            <h3 className="text-sm font-bold text-slate-800">Weekly Review Initializing</h3>
            <p className="text-xs text-slate-500 mt-1">
              Complete a few habit sessions this week to unlock your detailed report card.
            </p>
          </Card>
        ) : (
          <div className="space-y-5">
            {/* Scorecard Hero */}
            <Card className="bg-gradient-to-br from-white via-indigo-50/40 to-white border border-slate-200/90 shadow-soft p-6 sm:p-8 rounded-3xl">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-slate-200/80 pb-6 mb-6">
                <div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-[#6C5CE7] bg-[#6C5CE7]/10 px-3 py-1 rounded-full">
                    Week {review.week_number}, {review.year}
                  </span>
                  <h2 className="text-xl sm:text-2xl font-black text-slate-900 mt-2">
                    Weekly Consistency Report
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {review.start_date} → {review.end_date}
                  </p>
                </div>

                <div className="text-center sm:text-right">
                  <div className="text-4xl sm:text-5xl font-black text-[#6C5CE7]">
                    {review.overall_completion_rate}%
                  </div>
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    Overall Completion
                  </span>
                </div>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                <div className="p-3 bg-white rounded-2xl border border-slate-200/80 shadow-xs">
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-1">
                    Check-Ins
                  </span>
                  <span className="text-lg font-black text-slate-900">
                    {review.total_completions}
                  </span>
                </div>

                <div className="p-3 bg-white rounded-2xl border border-slate-200/80 shadow-xs">
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-1">
                    XP Forged
                  </span>
                  <span className="text-lg font-black text-[#D97706]">
                    +{review.xp_earned}
                  </span>
                </div>

                <div className="p-3 bg-white rounded-2xl border border-slate-200/80 shadow-xs">
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-1">
                    Top Keystone
                  </span>
                  <span className="text-xs font-black text-slate-900 truncate block">
                    {review.best_habit}
                  </span>
                </div>

                <div className="p-3 bg-white rounded-2xl border border-slate-200/80 shadow-xs">
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-1">
                    Growth Focus
                  </span>
                  <span className="text-xs font-black text-slate-900 truncate block">
                    {review.focus_habit}
                  </span>
                </div>
              </div>
            </Card>

            {/* Wins & Focus Sections */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <Card className="p-6 bg-white border border-slate-200/90 shadow-soft rounded-3xl space-y-4">
                <div className="flex items-center gap-2 text-emerald-600 font-black text-sm">
                  <CheckCircle2 className="w-5 h-5" />
                  <span>Key Wins This Week</span>
                </div>
                <ul className="space-y-2.5">
                  {review.key_wins?.map((win, idx) => (
                    <li key={idx} className="text-xs font-semibold text-slate-700 flex items-start gap-2">
                      <span className="text-emerald-500 font-bold">•</span>
                      <span>{win}</span>
                    </li>
                  ))}
                </ul>
              </Card>

              <Card className="p-6 bg-white border border-slate-200/90 shadow-soft rounded-3xl space-y-4">
                <div className="flex items-center gap-2 text-[#6C5CE7] font-black text-sm">
                  <TrendingUp className="w-5 h-5" />
                  <span>Next Week's Focus</span>
                </div>
                <p className="text-xs font-semibold text-slate-600 leading-relaxed">
                  {review.next_week_focus || 'Maintain current keystone momentum and focus on evening routine check-ins before 10 PM.'}
                </p>
              </Card>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
