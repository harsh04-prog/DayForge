'use client';

import React, { useState, useEffect } from 'react';
import { useHabits } from '@/context/HabitContext';
import { HabitCard } from '@/components/habits/HabitCard';
import { HabitStackFlow } from '@/components/habits/HabitStackFlow';
import { HabitModal } from '@/components/habits/HabitModal';
import { Button } from '@/components/common/Button';
import { Card } from '@/components/common/Card';
import { Habit } from '@/types';
import { Plus, Search, Layers, CheckSquare, Archive } from 'lucide-react';
import { api } from '@/services/api';
import { AppLayout } from '@/components/layout/AppLayout';

export default function HabitsPage() {
  const { habits, fetchHabits } = useHabits();
  const [activeTab, setActiveTab] = useState<'habits' | 'stacks' | 'archived'>('habits');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [habitToEdit, setHabitToEdit] = useState<Habit | null>(null);
  const [archivedHabits, setArchivedHabits] = useState<Habit[]>([]);

  useEffect(() => {
    fetchHabits();
  }, [fetchHabits]);

  useEffect(() => {
    if (activeTab === 'archived') {
      api.get<Habit[]>('/habits?include_archived=true').then((res) => {
        setArchivedHabits(res.data.filter((h) => h.is_archived));
      });
    }
  }, [activeTab]);

  const categories = [
    'All',
    'Health',
    'Fitness',
    'Study',
    'Career',
    'Productivity',
    'Sleep',
    'Reading',
    'Personal Growth',
  ];

  const displayedHabits = (activeTab === 'archived' ? archivedHabits : habits).filter((h) => {
    if (activeTab === 'habits' && h.is_archived) return false;
    if (selectedCategory !== 'All' && h.category !== selectedCategory) return false;
    if (searchQuery.trim() && !h.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  return (
    <AppLayout>
      <div className="space-y-5 sm:space-y-6 max-w-5xl mx-auto text-slate-900">
        {/* Header & New Habit Action */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl md:text-3xl font-black text-slate-900 tracking-tight">
              Habit Architecture
            </h1>
            <p className="text-xs sm:text-sm font-semibold text-slate-500 mt-0.5">
              Design, organize, and stack your routines.
            </p>
          </div>

          <Button
            variant="primary"
            size="md"
            onClick={() => {
              setHabitToEdit(null);
              setIsModalOpen(true);
            }}
            leftIcon={<Plus className="w-4 h-4 stroke-[2.5]" />}
            className="w-full sm:w-auto rounded-2xl shadow-md shadow-[#6C5CE7]/20 font-black min-h-[44px] justify-center"
          >
            New Habit
          </Button>
        </div>

        {/* Main Tabs (Habits vs Stacks vs Archived) */}
        <div className="flex items-center gap-2 border-b border-slate-200 pb-3 overflow-x-auto no-scrollbar">
          <button
            onClick={() => setActiveTab('habits')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition-all whitespace-nowrap min-h-[40px] ${
              activeTab === 'habits'
                ? 'bg-[#6C5CE7] text-white shadow-md shadow-[#6C5CE7]/20 font-black'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <CheckSquare className="w-4 h-4" />
            Active Habits ({habits.filter((h) => !h.is_archived).length})
          </button>

          <button
            onClick={() => setActiveTab('stacks')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition-all whitespace-nowrap min-h-[40px] ${
              activeTab === 'stacks'
                ? 'bg-[#6C5CE7] text-white shadow-md shadow-[#6C5CE7]/20 font-black'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Layers className="w-4 h-4" />
            Habit Stacking Flows
          </button>

          <button
            onClick={() => setActiveTab('archived')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition-all whitespace-nowrap min-h-[40px] ${
              activeTab === 'archived'
                ? 'bg-[#6C5CE7] text-white shadow-md shadow-[#6C5CE7]/20 font-black'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Archive className="w-4 h-4" />
            Archived ({archivedHabits.length})
          </button>
        </div>

        {activeTab === 'stacks' ? (
          <HabitStackFlow habits={habits} />
        ) : (
          <>
            {/* Filter and Search Bar */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-slate-200/90 shadow-soft">
              <div className="relative w-full sm:w-72">
                <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search habits..."
                  className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200/80 rounded-xl text-xs font-semibold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#6C5CE7] min-h-[40px]"
                />
              </div>

              {/* Category Pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto no-scrollbar pb-1 sm:pb-0">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all min-h-[36px] ${
                      selectedCategory === cat
                        ? 'bg-[#6C5CE7] text-white shadow-xs font-black'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Habits Grid: 1-col on mobile, 2-col on tablet, 3-col on desktop */}
            {displayedHabits.length === 0 ? (
              <Card className="text-center py-12 space-y-3 bg-white border border-dashed border-slate-200">
                <div className="w-12 h-12 rounded-2xl bg-[#6C5CE7]/10 text-[#6C5CE7] flex items-center justify-center mx-auto">
                  <CheckSquare className="w-6 h-6" />
                </div>
                <h3 className="text-base font-black text-slate-900">
                  No habits found
                </h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto font-medium">
                  Try selecting another category or click New Habit to create your next routine.
                </p>
                <Button
                  size="sm"
                  variant="primary"
                  onClick={() => {
                    setHabitToEdit(null);
                    setIsModalOpen(true);
                  }}
                  leftIcon={<Plus className="w-4 h-4" />}
                  className="mt-2 font-black min-h-[40px]"
                >
                  Create Habit
                </Button>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {displayedHabits.map((habit) => (
                  <HabitCard
                    key={habit.id}
                    habit={habit}
                    onEdit={(h) => {
                      setHabitToEdit(h);
                      setIsModalOpen(true);
                    }}
                  />
                ))}
              </div>
            )}
          </>
        )}

        {/* Habit Create / Edit Modal */}
        <HabitModal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setHabitToEdit(null);
          }}
          habitToEdit={habitToEdit}
        />
      </div>
    </AppLayout>
  );
}
