'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useHabits } from '@/context/HabitContext';
import { TodayProgressCard } from '@/components/dashboard/TodayProgressCard';
import { DailyScoreCard } from '@/components/dashboard/DailyScoreCard';
import { TodayHabitCard } from '@/components/dashboard/TodayHabitCard';
import { Button } from '@/components/common/Button';
import { Card } from '@/components/common/Card';
import { HabitModal } from '@/components/habits/HabitModal';
import { Sparkles, Plus } from 'lucide-react';
import { Habit } from '@/types';

export const DashboardPageContent: React.FC = () => {
  const { user } = useAuth();
  const { dashboardData, fetchDashboard, habits } = useHabits();
  const [filter, setFilter] = useState<'all' | 'morning' | 'afternoon' | 'evening' | 'completed'>('all');
  const [isNewHabitOpen, setIsNewHabitOpen] = useState(false);
  const [habitToEdit, setHabitToEdit] = useState<Habit | null>(null);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  // Greeting based on hour
  const currentHour = new Date().getHours();
  const greeting = currentHour < 12 ? 'Good morning' : currentHour < 18 ? 'Good afternoon' : 'Good evening';
  const firstName = user?.full_name?.split(' ')[0] || user?.username || 'Hero';

  const activeHabits = dashboardData?.habits || habits;

  // Filter habits for checklist
  const filteredHabits = activeHabits.filter((h) => {
    if (h.is_archived || h.is_paused) return false;
    if (filter === 'completed') return h.today_completed;
    if (filter === 'morning') return h.preferred_time === 'morning';
    if (filter === 'afternoon') return h.preferred_time === 'afternoon';
    if (filter === 'evening') return h.preferred_time === 'evening';
    return true;
  });

  return (
    <div className="space-y-5 sm:space-y-6 max-w-5xl mx-auto">
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

      {/* 3. "Your Habits" Section with Responsive Checklist */}
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
                    ? 'bg-[#6C5CE7] text-white shadow-xs font-black'
                    : 'text-slate-500 hover:text-slate-900 active:bg-slate-200'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {/* Habit List: 1-col on mobile, 2-col on desktop */}
        {filteredHabits.length === 0 ? (
          <Card className="bg-white border-dashed border-slate-200 text-center py-10 sm:py-12 space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-[#6C5CE7]/10 text-[#6C5CE7] flex items-center justify-center mx-auto">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900">
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
