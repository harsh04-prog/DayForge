'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { useHabits } from '@/context/HabitContext';
import { TodayProgressCard } from '@/components/dashboard/TodayProgressCard';
import { DailyScoreCard } from '@/components/dashboard/DailyScoreCard';
import { TodayHabitCard } from '@/components/dashboard/TodayHabitCard';
import { TodayChallengeCard } from '@/components/dashboard/TodayChallengeCard';
import { InteractiveActivityCalendar } from '@/components/dashboard/InteractiveActivityCalendar';
import { Button } from '@/components/common/Button';
import { Card } from '@/components/common/Card';
import { HabitModal } from '@/components/habits/HabitModal';
import { Sparkles, Plus, Trophy, ArrowRight } from 'lucide-react';
import { Habit } from '@/types';
import { api } from '@/services/api';

export const DashboardPageContent: React.FC = () => {
  const { user } = useAuth();
  const { dashboardData, fetchDashboard, habits, challenges, fetchChallenges } = useHabits();
  const [filter, setFilter] = useState<'all' | 'morning' | 'afternoon' | 'evening' | 'completed'>('all');
  const [isNewHabitOpen, setIsNewHabitOpen] = useState(false);
  const [habitToEdit, setHabitToEdit] = useState<Habit | null>(null);
  const [greeting, setGreeting] = useState<string>('Welcome back');

  useEffect(() => {
    fetchDashboard();
    fetchChallenges();
    const hour = new Date().getHours();
    setGreeting(hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening');
  }, [fetchDashboard, fetchChallenges]);

  const firstName = user?.full_name?.split(' ')[0] || user?.username || 'Hero';
  const activeHabits = dashboardData?.habits || habits;

  const joinedChallenges = challenges.filter(
    (c) => c.is_joined && (c.status === 'active' || c.status === 'completed')
  );

  // Filter habits for checklist
  const filteredHabits = activeHabits.filter((h) => {
    if (h.is_archived || h.is_paused) return false;
    if (filter === 'completed') return h.today_completed;
    if (filter === 'morning') return h.preferred_time === 'morning' || h.time_of_day === 'morning';
    if (filter === 'afternoon') return h.preferred_time === 'afternoon' || h.time_of_day === 'afternoon';
    if (filter === 'evening') return h.preferred_time === 'evening' || h.time_of_day === 'evening';
    return true;
  });

  const handleChallengeRefresh = () => {
    fetchChallenges();
    fetchDashboard();
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* 1. Greeting & Primary Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
        <div className="min-w-0 flex-1">
          <h1 className="text-xl sm:text-2xl md:text-3xl font-black text-slate-900 tracking-tight break-words">
            {greeting}, {firstName} 👋
          </h1>
          <p className="text-xs sm:text-sm font-semibold text-slate-500 mt-0.5">
            Build habits. Level yourself. What will you forge today?
          </p>
        </div>

        <div className="flex items-center shrink-0">
          <Button
            variant="primary"
            size="md"
            onClick={() => {
              setHabitToEdit(null);
              setIsNewHabitOpen(true);
            }}
            leftIcon={<Plus className="w-4 h-4 stroke-[2.5]" />}
            className="w-full sm:w-auto rounded-2xl shadow-md shadow-[#6C5CE7]/20 font-black text-xs min-h-[44px] justify-center"
          >
            Create Habit
          </Button>
        </div>
      </div>

      {/* 2. Today's Progress & Daily Score Grid (1-col on mobile, multi-col on desktop) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-5">
        <div className="lg:col-span-2">
          <TodayProgressCard data={dashboardData} />
        </div>
        <div>
          <DailyScoreCard scoreData={dashboardData?.daily_score} />
        </div>
      </div>

      {/* 3. Today's Joined Challenges (Home Page Challenge Integration) */}
      {joinedChallenges.length > 0 && (
        <div className="space-y-3.5 pt-1 sm:pt-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-black text-slate-900 tracking-tight flex items-center gap-1.5">
                <Trophy className="w-4 h-4 text-[#FFB547]" />
                Today's Challenges
              </h2>
              <span className="text-[10px] font-black text-amber-700 bg-amber-100/70 border border-amber-200 px-2 py-0.5 rounded-full">
                {joinedChallenges.length} Active
              </span>
            </div>
            <Link
              href="/challenges"
              className="text-xs font-bold text-[#6C5CE7] hover:underline flex items-center gap-1 min-h-[32px]"
            >
              <span>View All Challenges</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
            {joinedChallenges.map((challenge) => (
              <TodayChallengeCard
                key={challenge.id}
                challenge={challenge}
                onRefresh={handleChallengeRefresh}
              />
            ))}
          </div>
        </div>
      )}

      {/* 4. "Your Habits" Section with Responsive Checklist */}
      <div className="space-y-3.5 pt-1 sm:pt-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-3">
          <div className="flex items-center gap-2">
            <h2 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
              Your Habits
            </h2>
            <span className="text-[10px] font-black text-[#6C5CE7] bg-[#6C5CE7]/10 border border-[#6C5CE7]/20 px-2 py-0.5 rounded-full">
              {activeHabits.filter((h) => !h.is_archived && !h.is_paused).length} Active
            </span>
          </div>

          {/* Time & Status Filter Tabs */}
          <div className="flex items-center gap-1 bg-slate-100 border border-slate-200/80 p-1 rounded-2xl overflow-x-auto text-xs font-bold no-scrollbar">
            {(['all', 'morning', 'afternoon', 'evening', 'completed'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setFilter(tab)}
                className={`px-3 py-1.5 rounded-xl capitalize transition-all whitespace-nowrap min-h-[32px] ${
                  filter === tab
                    ? 'bg-white text-slate-900 shadow-xs font-black'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {/* Habit Checklist Cards */}
        {filteredHabits.length === 0 ? (
          <Card className="p-8 sm:p-10 text-center bg-white border border-slate-200/90 shadow-soft rounded-3xl space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-[#6C5CE7]/10 text-[#6C5CE7] flex items-center justify-center mx-auto shadow-xs">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-900">
                {filter === 'completed'
                  ? 'No completed habits yet.'
                  : 'Your first habit starts your journey.'}
              </h3>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto font-medium">
                {filter === 'completed'
                  ? 'Tap the checkmark on any habit card to record your first completion!'
                  : 'Create a new daily routine to begin earning XP and building compounding streaks.'}
              </p>
            </div>
            {filter !== 'completed' && (
              <Button
                size="sm"
                variant="primary"
                onClick={() => {
                  setHabitToEdit(null);
                  setIsNewHabitOpen(true);
                }}
                leftIcon={<Plus className="w-4 h-4 stroke-[2.5]" />}
                className="mt-2 min-h-[40px] font-black"
              >
                Create Habit
              </Button>
            )}
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
            {filteredHabits.map((habit) => (
              <TodayHabitCard
                key={habit.id}
                habit={habit}
                onEdit={(h) => {
                  setHabitToEdit(h);
                  setIsNewHabitOpen(true);
                }}
              />
            ))}
          </div>
        )}
      </div>

      {/* 5. Interactive Activity Calendar */}
      <InteractiveActivityCalendar />

      {/* Habit Create / Edit Modal */}
      <HabitModal
        isOpen={isNewHabitOpen}
        onClose={() => {
          setIsNewHabitOpen(false);
          setHabitToEdit(null);
        }}
        habitToEdit={habitToEdit}
      />
    </div>
  );
};
