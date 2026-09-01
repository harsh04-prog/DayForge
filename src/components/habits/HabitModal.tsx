'use client';

import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { HabitIcon, AVAILABLE_ICONS } from '../common/IconHelper';
import { Habit } from '../../types';
import { useHabits } from '../../context/HabitContext';
import { Bell } from 'lucide-react';

interface HabitModalProps {
  isOpen: boolean;
  onClose: () => void;
  habitToEdit?: Habit | null;
}

const CATEGORIES = [
  'General',
  'Health',
  'Fitness',
  'Study',
  'Career',
  'Productivity',
  'Sleep',
  'Reading',
  'Personal Growth',
];

const CATEGORY_COLORS: Record<string, string> = {
  Health: '#10B981',
  Fitness: '#F97316',
  Study: '#6C5CE7',
  Career: '#3B82F6',
  Productivity: '#06B6D4',
  Sleep: '#8B5CF6',
  Reading: '#EC4899',
  'Personal Growth': '#FFB547',
  General: '#6C5CE7',
};

const COMMON_UNITS = ['glasses', 'steps', 'pages', 'min', 'hours', 'L', 'reps', 'times', 'tasks', 'sessions'];

export const HabitModal: React.FC<HabitModalProps> = ({
  isOpen,
  onClose,
  habitToEdit,
}) => {
  const { createHabit, updateHabit } = useHabits();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [icon, setIcon] = useState('sparkles');
  const [category, setCategory] = useState('General');
  const [habitType, setHabitType] = useState<'binary' | 'quantitative'>('binary');
  const [targetValue, setTargetValue] = useState<number | string>(1);
  const [unit, setUnit] = useState('times');
  const [frequencyType, setFrequencyType] = useState<'daily' | 'weekdays' | 'weekends' | 'custom_days' | 'times_per_week'>('daily');
  const [selectedDays, setSelectedDays] = useState<number[]>([0, 1, 2, 3, 4, 5, 6]);
  const [preferredTime, setPreferredTime] = useState<'morning' | 'afternoon' | 'evening' | 'anytime'>('anytime');
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
  const [reminderEnabled, setReminderEnabled] = useState(false);
  const [reminderTime, setReminderTime] = useState('08:00');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (habitToEdit) {
      setName(habitToEdit.name || habitToEdit.title || '');
      setDescription(habitToEdit.description || '');
      setIcon(habitToEdit.icon || 'sparkles');
      setCategory(habitToEdit.category || 'General');
      const isQuant = habitToEdit.habit_type === 'quantitative' || (habitToEdit.target_value && habitToEdit.target_value > 1);
      setHabitType(isQuant ? 'quantitative' : 'binary');
      setTargetValue(habitToEdit.target_value ?? 1);
      setUnit(habitToEdit.unit || habitToEdit.target_unit || (isQuant ? 'glasses' : 'times'));
      setFrequencyType(habitToEdit.frequency_type || 'daily');
      setPreferredTime((habitToEdit.preferred_time || habitToEdit.time_of_day || 'anytime') as any);
      setDifficulty(habitToEdit.difficulty || 'medium');
      setReminderEnabled(Boolean(habitToEdit.reminder_enabled || habitToEdit.reminder_time));
      setReminderTime(habitToEdit.reminder_time || '08:00');

      if (habitToEdit.frequency_days) {
        try {
          setSelectedDays(habitToEdit.frequency_days.split(',').map((x) => parseInt(x.trim(), 10)));
        } catch {
          setSelectedDays([0, 1, 2, 3, 4, 5, 6]);
        }
      }
    } else {
      setName('');
      setDescription('');
      setIcon('sparkles');
      setCategory('General');
      setHabitType('binary');
      setTargetValue(1);
      setUnit('times');
      setFrequencyType('daily');
      setSelectedDays([0, 1, 2, 3, 4, 5, 6]);
      setPreferredTime('anytime');
      setDifficulty('medium');
      setReminderEnabled(false);
      setReminderTime('08:00');
    }
    setError('');
  }, [habitToEdit, isOpen]);

  const toggleDay = (dayIdx: number) => {
    if (selectedDays.includes(dayIdx)) {
      if (selectedDays.length > 1) {
        setSelectedDays(selectedDays.filter((d) => d !== dayIdx));
      }
    } else {
      setSelectedDays([...selectedDays, dayIdx].sort());
    }
  };

  const handleHabitTypeSwitch = (type: 'binary' | 'quantitative') => {
    setHabitType(type);
    if (type === 'binary') {
      setTargetValue(1);
      setUnit('times');
    } else {
      if (targetValue === 1 || targetValue === '1') {
        setTargetValue(8);
        setUnit('glasses');
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Please enter a habit name.');
      return;
    }

    const parsedTarget = Number(targetValue);
    if (isNaN(parsedTarget) || parsedTarget <= 0) {
      setError('Please enter a valid target amount greater than 0.');
      return;
    }

    setIsSubmitting(true);
    setError('');

    const isQuantitative = habitType === 'quantitative' || parsedTarget > 1;

    const payload: any = {
      title: name.trim(),
      name: name.trim(),
      description: description.trim() || undefined,
      icon,
      color: CATEGORY_COLORS[category] || '#6C5CE7',
      category,
      habit_type: isQuantitative ? 'quantitative' : 'binary',
      target_value: parsedTarget,
      target_unit: isQuantitative ? (unit.trim() || 'units') : (unit.trim() || 'times'),
      unit: isQuantitative ? (unit.trim() || 'units') : (unit.trim() || 'times'),
      frequency_type: frequencyType,
      frequency_days: frequencyType === 'custom_days' ? selectedDays.join(',') : '0,1,2,3,4,5,6',
      preferred_time: preferredTime,
      time_of_day: preferredTime,
      difficulty,
      reminder_enabled: reminderEnabled,
      reminder_time: reminderEnabled ? reminderTime : undefined,
    };

    try {
      if (habitToEdit) {
        await updateHabit(habitToEdit.id, payload);
      } else {
        await createHabit(payload);
      }
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to save habit. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const dayLabels = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={habitToEdit ? 'Edit Habit' : 'Create New Habit'}
      description="Build real momentum with a focused, sustainable routine."
      maxWidth="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
        {error && (
          <div className="bg-rose-50 border border-rose-200 text-rose-600 text-xs font-bold p-3 sm:p-3.5 rounded-2xl flex items-center gap-2">
            <span>⚠️</span>
            <span className="flex-1">{error}</span>
          </div>
        )}

        {/* Name & Icon Row */}
        <div>
          <label className="block text-[11px] sm:text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
            Habit Name & Icon
          </label>
          <div className="flex gap-2">
            <div className="relative shrink-0">
              <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-slate-100 border border-slate-200 flex items-center justify-center text-[#6C5CE7] shadow-xs">
                <HabitIcon name={icon} className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
            </div>

            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Drink Water, Gym Workout, Read Pages..."
              className="flex-1 min-w-0 px-3.5 sm:px-4 py-2 sm:py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs sm:text-sm font-bold text-slate-900 focus:outline-none focus:border-[#6C5CE7] focus:ring-2 focus:ring-[#6C5CE7]/20 transition-all placeholder:text-slate-400"
              maxLength={100}
              required
            />
          </div>
        </div>

        {/* Icon selector strip */}
        <div>
          <span className="block text-[11px] sm:text-xs font-bold text-slate-500 mb-1.5">Select Icon</span>
          <div className="flex flex-wrap gap-1.5 p-2 bg-slate-50 border border-slate-200/80 rounded-2xl max-h-24 overflow-y-auto no-scrollbar">
            {AVAILABLE_ICONS.map((ic) => (
              <button
                type="button"
                key={ic}
                onClick={() => setIcon(ic)}
                className={`p-2 rounded-xl transition-all ${
                  icon === ic
                    ? 'bg-[#6C5CE7] text-white shadow-md shadow-[#6C5CE7]/20 scale-105 font-black'
                    : 'text-slate-500 hover:text-slate-900 hover:bg-slate-200'
                }`}
                aria-label={`Select icon ${ic}`}
              >
                <HabitIcon name={ic} className="w-4 h-4" />
              </button>
            ))}
          </div>
        </div>

        {/* Category & Difficulty */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          <div>
            <label className="block text-[11px] sm:text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Category
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-3 py-2 sm:py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs sm:text-sm font-semibold text-slate-800 focus:outline-none focus:border-[#6C5CE7]"
            >
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat} className="bg-white text-slate-900">
                  {cat}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] sm:text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Difficulty & Reward
            </label>
            <div className="grid grid-cols-3 gap-1 p-1 bg-slate-100 border border-slate-200 rounded-2xl">
              {(['easy', 'medium', 'hard'] as const).map((diff) => (
                <button
                  type="button"
                  key={diff}
                  onClick={() => setDifficulty(diff)}
                  className={`py-1.5 px-1 text-[11px] sm:text-xs font-bold rounded-xl capitalize transition-all truncate text-center ${
                    difficulty === diff
                      ? 'bg-white text-[#6C5CE7] shadow-xs font-black'
                      : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  {diff} ({diff === 'easy' ? '+5' : diff === 'medium' ? '+10' : '+15'})
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Target Mode & Custom User-Defined Amount */}
        <div>
          <label className="block text-[11px] sm:text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
            Target & Daily Goal
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3 mb-2.5">
            <button
              type="button"
              onClick={() => handleHabitTypeSwitch('binary')}
              className={`p-2.5 sm:p-3 rounded-2xl border text-left transition-all ${
                habitType === 'binary'
                  ? 'border-[#6C5CE7] bg-[#6C5CE7]/10 shadow-xs'
                  : 'border-slate-200 bg-slate-50 hover:bg-slate-100'
              }`}
            >
              <div className="font-bold text-xs sm:text-sm text-slate-900">Simple Yes/No</div>
              <div className="text-[10px] sm:text-xs text-slate-500 mt-0.5">1 check-in per day</div>
            </button>

            <button
              type="button"
              onClick={() => handleHabitTypeSwitch('quantitative')}
              className={`p-2.5 sm:p-3 rounded-2xl border text-left transition-all ${
                habitType === 'quantitative'
                  ? 'border-[#6C5CE7] bg-[#6C5CE7]/10 shadow-xs'
                  : 'border-slate-200 bg-slate-50 hover:bg-slate-100'
              }`}
            >
              <div className="font-bold text-xs sm:text-sm text-slate-900">Measure Amount</div>
              <div className="text-[10px] sm:text-xs text-slate-500 mt-0.5">e.g. 8 glasses, 5000 steps</div>
            </button>
          </div>

          {/* User-defined Target Inputs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 p-3 sm:p-3.5 bg-slate-50 border border-slate-200 rounded-2xl">
            <div>
              <label className="text-[11px] sm:text-xs font-bold text-slate-700 block mb-1">
                Daily Target Amount
              </label>
              <input
                type="number"
                step="any"
                min="0.1"
                value={targetValue}
                onChange={(e) => setTargetValue(e.target.value)}
                placeholder="e.g. 8, 30, 5000"
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm font-black text-slate-900 focus:outline-none focus:border-[#6C5CE7]"
                required
              />
            </div>
            <div>
              <label className="text-[11px] sm:text-xs font-bold text-slate-700 block mb-1">
                Unit of Measurement
              </label>
              <input
                type="text"
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                placeholder="e.g. glasses, steps, min, pages"
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold text-slate-900 focus:outline-none focus:border-[#6C5CE7]"
                list="unit-suggestions"
                required
              />
              <datalist id="unit-suggestions">
                {COMMON_UNITS.map((u) => (
                  <option key={u} value={u} />
                ))}
              </datalist>
            </div>
          </div>
        </div>

        {/* Frequency & Time */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          <div>
            <label className="block text-[11px] sm:text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Frequency
            </label>
            <select
              value={frequencyType}
              onChange={(e) => setFrequencyType(e.target.value as any)}
              className="w-full px-3 py-2 sm:py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs sm:text-sm font-semibold text-slate-800 focus:outline-none focus:border-[#6C5CE7]"
            >
              <option value="daily" className="bg-white text-slate-900">Every Day</option>
              <option value="weekdays" className="bg-white text-slate-900">Weekdays (Mon-Fri)</option>
              <option value="weekends" className="bg-white text-slate-900">Weekends (Sat-Sun)</option>
              <option value="custom_days" className="bg-white text-slate-900">Specific Days of Week</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] sm:text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Preferred Time
            </label>
            <select
              value={preferredTime}
              onChange={(e) => setPreferredTime(e.target.value as any)}
              className="w-full px-3 py-2 sm:py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs sm:text-sm font-semibold text-slate-800 focus:outline-none focus:border-[#6C5CE7]"
            >
              <option value="anytime" className="bg-white text-slate-900">Anytime</option>
              <option value="morning" className="bg-white text-slate-900">Morning</option>
              <option value="afternoon" className="bg-white text-slate-900">Afternoon</option>
              <option value="evening" className="bg-white text-slate-900">Evening</option>
            </select>
          </div>
        </div>

        {/* Custom Days Grid */}
        {frequencyType === 'custom_days' && (
          <div>
            <span className="block text-[11px] sm:text-xs font-bold text-slate-700 mb-1.5">Select Active Days</span>
            <div className="flex gap-1 sm:gap-1.5 justify-between">
              {dayLabels.map((label, idx) => {
                const isSelected = selectedDays.includes(idx);
                return (
                  <button
                    type="button"
                    key={idx}
                    onClick={() => toggleDay(idx)}
                    className={`flex-1 max-w-[42px] h-8 sm:h-9 rounded-xl font-bold text-xs transition-all flex items-center justify-center ${
                      isSelected
                        ? 'bg-[#6C5CE7] text-white shadow-xs font-black'
                        : 'bg-slate-100 border border-slate-200 text-slate-500 hover:text-slate-900'
                    }`}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Reminder Time Schedule */}
        <div className="p-3 sm:p-3.5 bg-slate-50 border border-slate-200 rounded-2xl space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bell className="w-4 h-4 text-[#6C5CE7]" />
              <span className="text-[11px] sm:text-xs font-bold text-slate-900">Daily Reminder Notification</span>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={reminderEnabled}
                onChange={(e) => setReminderEnabled(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#6C5CE7]"></div>
            </label>
          </div>

          {reminderEnabled && (
            <div className="pt-2 border-t border-slate-200/80 flex items-center justify-between gap-3">
              <span className="text-[11px] sm:text-xs text-slate-600 font-medium">Notification Time</span>
              <input
                type="time"
                value={reminderTime}
                onChange={(e) => setReminderTime(e.target.value)}
                className="px-2.5 py-1 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:border-[#6C5CE7]"
              />
            </div>
          )}
        </div>

        {/* Motivation Description */}
        <div>
          <label className="block text-[11px] sm:text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
            Why this habit matters (Optional)
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="e.g. Read 20 pages every evening to expand knowledge..."
            rows={2}
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-2xl text-xs sm:text-sm font-semibold text-slate-900 focus:outline-none focus:border-[#6C5CE7] placeholder:text-slate-400"
          />
        </div>

        {/* Action Buttons */}
        <div className="sticky bottom-0 bg-white/95 backdrop-blur-md pt-3 pb-1 border-t border-slate-100 flex items-center justify-end gap-2.5 z-10">
          <Button type="button" variant="ghost" onClick={onClose} className="min-h-[40px] text-xs sm:text-sm px-4">
            Cancel
          </Button>
          <Button type="submit" variant="primary" isLoading={isSubmitting} className="font-black min-h-[40px] text-xs sm:text-sm px-5 sm:px-6 shadow-md shadow-[#6C5CE7]/20">
            {habitToEdit ? 'Save Changes' : 'Create Habit'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
