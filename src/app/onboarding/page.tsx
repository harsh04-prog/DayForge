'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles,
  Check,
  ArrowRight,
  ArrowLeft,
  Heart,
  Dumbbell,
  BookOpen,
  Briefcase,
  Brain,
  Moon,
  Compass
} from 'lucide-react';
import { Button } from '@/components/common/Button';
import { Card } from '@/components/common/Card';
import { DayForgeLogo } from '@/components/common/DayForgeLogo';
import { useAuth } from '@/context/AuthContext';
import { useHabits } from '@/context/HabitContext';
import { useToast } from '@/context/ToastContext';

const FOCUS_AREAS = [
  { id: 'Health', label: 'Health', icon: Heart },
  { id: 'Fitness', label: 'Fitness', icon: Dumbbell },
  { id: 'Study', label: 'Study', icon: Brain },
  { id: 'Career', label: 'Career', icon: Briefcase },
  { id: 'Productivity', label: 'Productivity', icon: Sparkles },
  { id: 'Sleep', label: 'Sleep', icon: Moon },
  { id: 'Reading', label: 'Reading', icon: BookOpen },
  { id: 'Personal Growth', label: 'Personal Growth', icon: Compass },
];

const STARTER_HABITS_CATALOG: Record<string, any[]> = {
  Health: [
    { name: 'Drink 2L Water', icon: 'droplet', color: '#06B6D4', category: 'Health', habit_type: 'quantitative', target_value: 2, unit: 'L', preferred_time: 'anytime', difficulty: 'easy' },
    { name: 'Take Daily Vitamins', icon: 'heart', color: '#10B981', category: 'Health', habit_type: 'binary', target_value: 1, preferred_time: 'morning', difficulty: 'easy' },
  ],
  Fitness: [
    { name: 'Morning Workout / Move', icon: 'dumbbell', color: '#F97316', category: 'Fitness', habit_type: 'quantitative', target_value: 30, unit: 'min', preferred_time: 'morning', difficulty: 'medium' },
    { name: '10,000 Daily Steps', icon: 'footprints', color: '#F97316', category: 'Fitness', habit_type: 'quantitative', target_value: 10000, unit: 'steps', preferred_time: 'anytime', difficulty: 'medium' },
  ],
  Reading: [
    { name: 'Read 20 Pages', icon: 'book-open', color: '#EC4899', category: 'Reading', habit_type: 'quantitative', target_value: 20, unit: 'pages', preferred_time: 'evening', difficulty: 'easy' },
  ],
  Study: [
    { name: 'Focused Study Block', icon: 'brain', color: '#6C5CE7', category: 'Study', habit_type: 'quantitative', target_value: 45, unit: 'min', preferred_time: 'morning', difficulty: 'medium' },
  ],
  Productivity: [
    { name: 'Daily Planning & Priority', icon: 'sparkles', color: '#6C5CE7', category: 'Productivity', habit_type: 'binary', target_value: 1, preferred_time: 'morning', difficulty: 'easy' },
    { name: 'Deep Work Session', icon: 'brain', color: '#6C5CE7', category: 'Productivity', habit_type: 'quantitative', target_value: 60, unit: 'min', preferred_time: 'morning', difficulty: 'hard' },
  ],
  Sleep: [
    { name: 'No Screens 30m Before Bed', icon: 'moon', color: '#8B5CF6', category: 'Sleep', habit_type: 'binary', target_value: 1, preferred_time: 'evening', difficulty: 'medium' },
  ],
  'Personal Growth': [
    { name: 'Evening Journal & Wins', icon: 'pen-tool', color: '#FFB547', category: 'Personal Growth', habit_type: 'binary', target_value: 1, preferred_time: 'evening', difficulty: 'easy' },
  ],
};

export default function OnboardingPage() {
  const { completeOnboarding } = useAuth();
  const { fetchDashboard } = useHabits();
  const { showSuccess } = useToast();
  const router = useRouter();

  const [step, setStep] = useState(1);
  const [selectedFocus, setSelectedFocus] = useState<string[]>(['Health', 'Fitness', 'Productivity']);
  const [primaryGoal, setPrimaryGoal] = useState('');
  const [targetCount, setTargetCount] = useState(3);
  const [selectedHabits, setSelectedHabits] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const toggleFocus = (id: string) => {
    if (selectedFocus.includes(id)) {
      if (selectedFocus.length > 1) {
        setSelectedFocus(selectedFocus.filter((f) => f !== id));
      }
    } else {
      setSelectedFocus([...selectedFocus, id]);
    }
  };

  const handleProceedToHabits = () => {
    const suggested: any[] = [];
    selectedFocus.forEach((focus) => {
      const catalog = STARTER_HABITS_CATALOG[focus] || [];
      catalog.forEach((h) => {
        if (!suggested.some((s) => s.name === h.name)) {
          suggested.push(h);
        }
      });
    });

    setSelectedHabits(suggested.slice(0, targetCount));
    setStep(3);
  };

  const toggleHabitSelection = (habit: any) => {
    if (selectedHabits.some((h) => h.name === habit.name)) {
      setSelectedHabits(selectedHabits.filter((h) => h.name !== habit.name));
    } else {
      setSelectedHabits([...selectedHabits, habit]);
    }
  };

  const handleFinishOnboarding = async () => {
    setIsLoading(true);
    try {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('dayforge_dashboard_cache');
      }

      await completeOnboarding({
        focus_areas: selectedFocus,
        primary_goal: primaryGoal.trim() || 'Level myself up with consistent daily discipline.',
        target_habit_count: selectedHabits.length || targetCount,
        starter_habits: selectedHabits,
      });

      await fetchDashboard();
      showSuccess('Onboarding Complete!', 'Your daily dashboard is forged and ready.');
      router.push('/');
    } catch {
      router.push('/');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8F9FC] text-slate-900 flex flex-col justify-center py-8 px-4 sm:px-6 lg:px-8">
      {/* Top Header */}
      <div className="sm:mx-auto sm:w-full sm:max-w-xl flex items-center justify-center mb-4">
        <Link href="/" className="inline-block group">
          <DayForgeLogo size="lg" />
        </Link>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-xl text-center mb-5">
        <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
          Personalize Your Experience
        </h2>

        {/* Step Indicator */}
        <div className="flex items-center justify-center gap-2 mt-3.5">
          {[1, 2, 3].map((s) => (
            <div
              key={s}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                step === s
                  ? 'w-10 bg-[#6C5CE7] shadow-xs'
                  : step > s
                  ? 'w-4 bg-[#6C5CE7]/60'
                  : 'w-4 bg-slate-200'
              }`}
            />
          ))}
        </div>
      </div>

      {/* Main Flow Card */}
      <div className="sm:mx-auto sm:w-full sm:max-w-xl">
        <Card className="bg-white border border-slate-200/90 p-5 sm:p-8 rounded-3xl shadow-soft">
          <AnimatePresence mode="wait">
            {/* STEP 1: Focus Areas */}
            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 15 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -15 }}
                className="space-y-5"
              >
                <div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-[#6C5CE7] bg-[#6C5CE7]/10 px-3 py-1 rounded-full">
                    Step 1 of 3
                  </span>
                  <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight mt-2">
                    What areas do you want to forge?
                  </h2>
                  <p className="text-xs font-semibold text-slate-500 mt-1">
                    Select your focus domains to personalize your starting routines.
                  </p>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  {FOCUS_AREAS.map((area) => {
                    const Icon = area.icon;
                    const isSelected = selectedFocus.includes(area.id);
                    return (
                      <button
                        type="button"
                        key={area.id}
                        onClick={() => toggleFocus(area.id)}
                        className={`p-3.5 rounded-2xl border text-center flex flex-col items-center gap-2 transition-all select-none min-h-[90px] justify-center ${
                          isSelected
                            ? 'border-[#6C5CE7] bg-[#6C5CE7]/10 shadow-xs ring-2 ring-[#6C5CE7]/20'
                            : 'border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-600'
                        }`}
                      >
                        <div
                          className={`w-9 h-9 rounded-xl flex items-center justify-center transition-colors ${
                            isSelected ? 'bg-[#6C5CE7] text-white' : 'bg-white text-slate-500'
                          }`}
                        >
                          <Icon className="w-4 h-4" />
                        </div>
                        <span className={`text-xs font-bold ${isSelected ? 'text-slate-900 font-black' : 'text-slate-600'}`}>
                          {area.label}
                        </span>
                      </button>
                    );
                  })}
                </div>

                <div className="flex justify-end pt-3 border-t border-slate-100">
                  <Button
                    variant="primary"
                    size="md"
                    onClick={() => setStep(2)}
                    rightIcon={<ArrowRight className="w-4 h-4 stroke-[2.5]" />}
                    className="rounded-2xl px-6 font-black min-h-[44px]"
                  >
                    Continue
                  </Button>
                </div>
              </motion.div>
            )}

            {/* STEP 2: Goal & Habit Count Guidance */}
            {step === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 15 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -15 }}
                className="space-y-5"
              >
                <div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-[#6C5CE7] bg-[#6C5CE7]/10 px-3 py-1 rounded-full">
                    Step 2 of 3
                  </span>
                  <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight mt-2">
                    Define your primary vision
                  </h2>
                  <p className="text-xs font-semibold text-slate-500 mt-1">
                    What milestone do you want to accomplish in the next 90 days?
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                    Your Primary Goal
                  </label>
                  <textarea
                    value={primaryGoal}
                    onChange={(e) => setPrimaryGoal(e.target.value)}
                    rows={3}
                    placeholder="e.g. Build daily coding discipline, read 20 pages every night, stay hydrated..."
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-semibold text-slate-900 focus:outline-none focus:border-[#6C5CE7] placeholder:text-slate-400"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                      Initial Habits Target
                    </label>
                    <span className="text-xs font-black text-[#6C5CE7] bg-[#6C5CE7]/10 px-2 py-0.5 rounded-md">
                      Recommended: 3–5
                    </span>
                  </div>
                  <div className="grid grid-cols-4 gap-2">
                    {[2, 3, 4, 5].map((cnt) => (
                      <button
                        type="button"
                        key={cnt}
                        onClick={() => setTargetCount(cnt)}
                        className={`py-3 rounded-2xl font-black text-sm transition-all border min-h-[44px] ${
                          targetCount === cnt
                            ? 'bg-[#6C5CE7] text-white border-[#6C5CE7] shadow-xs'
                            : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        {cnt} Habits
                      </button>
                    ))}
                  </div>
                  <p className="text-[11px] text-slate-500 mt-2 font-medium">
                    💡 Behavioral research indicates starting with 3–5 focused habits leads to a 3x higher retention rate.
                  </p>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                  <Button variant="ghost" size="md" onClick={() => setStep(1)} leftIcon={<ArrowLeft className="w-4 h-4" />} className="min-h-[44px]">
                    Back
                  </Button>
                  <Button
                    variant="primary"
                    size="md"
                    onClick={handleProceedToHabits}
                    rightIcon={<ArrowRight className="w-4 h-4 stroke-[2.5]" />}
                    className="rounded-2xl px-6 font-black min-h-[44px]"
                  >
                    Next: Starter Habits
                  </Button>
                </div>
              </motion.div>
            )}

            {/* STEP 3: Curated Starter Habits */}
            {step === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, x: 15 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -15 }}
                className="space-y-5"
              >
                <div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-[#6C5CE7] bg-[#6C5CE7]/10 px-3 py-1 rounded-full">
                    Step 3 of 3
                  </span>
                  <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight mt-2">
                    Choose your starter habits
                  </h2>
                  <p className="text-xs font-semibold text-slate-500 mt-1">
                    Select the habits to forge starting today. You can customize them anytime.
                  </p>
                </div>

                <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1 no-scrollbar">
                  {selectedFocus.flatMap((cat) => STARTER_HABITS_CATALOG[cat] || []).map((habit, idx) => {
                    const isSelected = selectedHabits.some((h) => h.name === habit.name);
                    return (
                      <div
                        key={idx}
                        onClick={() => toggleHabitSelection(habit)}
                        className={`p-3.5 rounded-2xl border flex items-center justify-between cursor-pointer transition-all min-h-[48px] ${
                          isSelected
                            ? 'border-[#6C5CE7] bg-[#6C5CE7]/10 shadow-xs'
                            : 'border-slate-200 bg-slate-50 hover:bg-slate-100 opacity-80'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-white border border-slate-200 flex items-center justify-center font-black text-xs text-[#6C5CE7]">
                            {habit.category[0]}
                          </div>
                          <div>
                            <h4 className="font-bold text-sm text-slate-900">{habit.name}</h4>
                            <span className="text-xs text-slate-500">
                              {habit.category} • {habit.preferred_time}
                            </span>
                          </div>
                        </div>

                        <div
                          className={`w-6 h-6 rounded-lg flex items-center justify-center transition-colors ${
                            isSelected ? 'bg-[#6C5CE7] text-white' : 'bg-slate-200 text-slate-400'
                          }`}
                        >
                          <Check className="w-4 h-4 stroke-[3]" />
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                  <Button variant="ghost" size="md" onClick={() => setStep(2)} leftIcon={<ArrowLeft className="w-4 h-4" />} className="min-h-[44px]">
                    Back
                  </Button>
                  <Button
                    variant="primary"
                    size="md"
                    isLoading={isLoading}
                    onClick={handleFinishOnboarding}
                    rightIcon={<ArrowRight className="w-4 h-4 stroke-[2.5]" />}
                    className="rounded-2xl px-7 font-black min-h-[44px]"
                  >
                    Enter Dashboard
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </Card>
      </div>
    </div>
  );
}
