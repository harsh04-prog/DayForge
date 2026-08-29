'use client';

import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { HabitIcon, AVAILABLE_ICONS } from '../common/IconHelper';
import { Habit } from '../../types';
import { useHabits } from '../../context/HabitContext';

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

const COMMON_UNITS = ['pages', 'min', 'hours', 'L', 'reps', 'steps', 'glasses', 'tasks'];

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
  const [targetValue, setTargetValue] = useState<number>(1);
  const [unit, setUnit] = useState('');
  const [frequencyType, setFrequencyType] = useState<'daily' | 'weekdays' | 'weekends' | 'custom_days' | 'times_per_week'>('daily');
  const [selectedDays, setSelectedDays] = useState<number[]>([0, 1, 2, 3, 4, 5, 6]);
  const [preferredTime, setPreferredTime] = useState<'morning' | 'afternoon' | 'evening' | 'anytime'>('anytime');
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (habitToEdit) {
      setName(habitToEdit.name);
      setDescription(habitToEdit.description || '');
      setIcon(habitToEdit.icon || 'sparkles');
      setCategory(habitToEdit.category || 'General');
      setHabitType(habitToEdit.habit_type || 'binary');
      setTargetValue(habitToEdit.target_value || 1);
      setUnit(habitToEdit.unit || '');
      setFrequencyType(habitToEdit.frequency_type || 'daily');
      setPreferredTime(habitToEdit.preferred_time || 'anytime');
      setDifficulty(habitToEdit.difficulty || 'medium');
      if (habitToEdit.frequency_days) {
        try {
          setSelectedDays(habitToEdit.frequency_days.split(',').map((x) => parseInt(x.trim())));
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
      setUnit('');
      setFrequencyType('daily');
      setSelectedDays([0, 1, 2, 3, 4, 5, 6]);
      setPreferredTime('anytime');
      setDifficulty('medium');
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Please enter a habit name.');
      return;
    }

    setIsSubmitting(true);
    setError('');

    const payload: Partial<Habit> = {
      name: name.trim(),
      description: description.trim() || undefined,
      icon,
      color: CATEGORY_COLORS[category] || '#6C5CE7',
      category,
      habit_type: habitType,
      target_value: habitType === 'quantitative' ? Number(targetValue) || 1 : 1,
      unit: habitType === 'quantitative' ? unit.trim() || 'units' : undefined,
      frequency_type: frequencyType,
      frequency_days: frequencyType === 'custom_days' ? selectedDays.join(',') : '0,1,2,3,4,5,6',
      preferred_time: preferredTime,
      difficulty,
    };

    try {
      if (habitToEdit) {
        await updateHabit(habitToEdit.id, payload);
      } else {
        await createHabit(payload);
      }
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to save habit.');
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
      <form onSubmit={handleSubmit} className="space-y-5">
        {error && (
          <div className="bg-rose-50  border border-rose-200  text-rose-600  text-xs font-bold p-3 rounded-2xl">
            {error}
          </div>
        )}

        {/* Name & Icon Row */}
        <div>
          <label className="block text-xs font-bold text-slate-700  uppercase tracking-wider mb-2">
            Habit Name & Icon
          </label>
          <div className="flex gap-2.5">
            {/* Icon Picker button */}
            <div className="relative group">
              <div className="w-11 h-11 rounded-2xl bg-slate-100  border border-slate-200  flex items-center justify-center text-[#6C5CE7]  shadow-xs">
                <HabitIcon name={icon} className="w-6 h-6" />
              </div>
            </div>

            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Read 20 Pages, Morning Workout, Meditate..."
              className="flex-1 px-4 py-2.5 bg-slate-50  border border-slate-200  rounded-2xl text-sm font-bold text-slate-900  focus:outline-none focus:border-[#6C5CE7] focus:ring-2 focus:ring-[#6C5CE7]/20 transition-all placeholder:text-slate-400"
              maxLength={100}
              required
            />
          </div>
        </div>

        {/* Icon selector strip */}
        <div>
          <span className="block text-xs font-bold text-slate-500  mb-2">Select Icon</span>
          <div className="flex flex-wrap gap-2 p-2 bg-slate-50  border border-slate-200/80  rounded-2xl max-h-24 overflow-y-auto no-scrollbar">
            {AVAILABLE_ICONS.map((ic) => (
              <button
                type="button"
                key={ic}
                onClick={() => setIcon(ic)}
                className={`p-2 rounded-xl transition-all ${
                  icon === ic
                    ? 'bg-[#6C5CE7] text-white shadow-md shadow-[#6C5CE7]/20 scale-105 font-black'
                    : 'text-slate-500 hover:text-slate-900  hover:bg-slate-200 '
                }`}
              >
                <HabitIcon name={ic} className="w-4 h-4" />
              </button>
            ))}
          </div>
        </div>

        {/* Category & Difficulty */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700  uppercase tracking-wider mb-2">
              Category
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50  border border-slate-200  rounded-2xl text-sm font-semibold text-slate-800  focus:outline-none focus:border-[#6C5CE7]"
            >
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat} className="bg-white  text-slate-900 ">
                  {cat}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700  uppercase tracking-wider mb-2">
              Difficulty & Reward
            </label>
            <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-100  border border-slate-200  rounded-2xl">
              {(['easy', 'medium', 'hard'] as const).map((diff) => (
                <button
                  type="button"
                  key={diff}
                  onClick={() => setDifficulty(diff)}
                  className={`py-1.5 text-xs font-bold rounded-xl capitalize transition-all ${
                    difficulty === diff
                      ? 'bg-white  text-[#6C5CE7]  shadow-xs font-black'
                      : 'text-slate-500 hover:text-slate-900 '
                  }`}
                >
                  {diff} ({diff === 'easy' ? '+5' : diff === 'medium' ? '+10' : '+15'} XP)
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Habit Type (Binary vs Quantitative) */}
        <div>
          <label className="block text-xs font-bold text-slate-700  uppercase tracking-wider mb-2">
            Target Type
          </label>
          <div className="grid grid-cols-2 gap-3 mb-3">
            <button
              type="button"
              onClick={() => setHabitType('binary')}
              className={`p-3 rounded-2xl border text-left transition-all ${
                habitType === 'binary'
                  ? 'border-[#6C5CE7] bg-[#6C5CE7]/10  shadow-xs'
                  : 'border-slate-200  bg-slate-50  hover:bg-slate-100 '
              }`}
            >
              <div className="font-bold text-sm text-slate-900 ">Simple Yes/No</div>
              <div className="text-xs text-slate-500  mt-0.5">e.g. Floss teeth, Take vitamins</div>
            </button>

            <button
              type="button"
              onClick={() => setHabitType('quantitative')}
              className={`p-3 rounded-2xl border text-left transition-all ${
                habitType === 'quantitative'
                  ? 'border-[#6C5CE7] bg-[#6C5CE7]/10  shadow-xs'
                  : 'border-slate-200  bg-slate-50  hover:bg-slate-100 '
              }`}
            >
              <div className="font-bold text-sm text-slate-900 ">Measure Amount</div>
              <div className="text-xs text-slate-500  mt-0.5">e.g. 20 pages, 30 min, 2.5L</div>
            </button>
          </div>

          {habitType === 'quantitative' && (
            <div className="flex gap-3 p-3.5 bg-slate-50  border border-slate-200  rounded-2xl">
              <div className="w-1/2">
                <span className="text-xs font-bold text-slate-700  block mb-1">Target Amount</span>
                <input
                  type="number"
                  step="any"
                  min="0.1"
                  value={targetValue}
                  onChange={(e) => setTargetValue(parseFloat(e.target.value) || 1)}
                  className="w-full px-3 py-2 bg-white  border border-slate-200  rounded-xl text-sm font-bold text-slate-900  focus:outline-none focus:border-[#6C5CE7]"
                  required
                />
              </div>
              <div className="w-1/2">
                <span className="text-xs font-bold text-slate-700  block mb-1">Unit</span>
                <input
                  type="text"
                  value={unit}
                  onChange={(e) => setUnit(e.target.value)}
                  placeholder="e.g. pages, min, L"
                  className="w-full px-3 py-2 bg-white  border border-slate-200  rounded-xl text-sm font-medium text-slate-900  focus:outline-none focus:border-[#6C5CE7]"
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
          )}
        </div>

        {/* Frequency & Time */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700  uppercase tracking-wider mb-2">
              Frequency
            </label>
            <select
              value={frequencyType}
              onChange={(e) => setFrequencyType(e.target.value as any)}
              className="w-full px-3.5 py-2.5 bg-slate-50  border border-slate-200  rounded-2xl text-sm font-semibold text-slate-800  focus:outline-none focus:border-[#6C5CE7]"
            >
              <option value="daily" className="bg-white  text-slate-900 ">Every Day</option>
              <option value="weekdays" className="bg-white  text-slate-900 ">Weekdays (Mon-Fri)</option>
              <option value="weekends" className="bg-white  text-slate-900 ">Weekends (Sat-Sun)</option>
              <option value="custom_days" className="bg-white  text-slate-900 ">Specific Days of Week</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700  uppercase tracking-wider mb-2">
              Preferred Time
            </label>
            <select
              value={preferredTime}
              onChange={(e) => setPreferredTime(e.target.value as any)}
              className="w-full px-3.5 py-2.5 bg-slate-50  border border-slate-200  rounded-2xl text-sm font-semibold text-slate-800  focus:outline-none focus:border-[#6C5CE7]"
            >
              <option value="anytime" className="bg-white  text-slate-900 ">Anytime</option>
              <option value="morning" className="bg-white  text-slate-900 ">Morning</option>
              <option value="afternoon" className="bg-white  text-slate-900 ">Afternoon</option>
              <option value="evening" className="bg-white  text-slate-900 ">Evening</option>
            </select>
          </div>
        </div>

        {frequencyType === 'custom_days' && (
          <div>
            <span className="block text-xs font-bold text-slate-700  mb-2">Select Active Days</span>
            <div className="flex gap-2">
              {dayLabels.map((label, idx) => {
                const isSelected = selectedDays.includes(idx);
                return (
                  <button
                    type="button"
                    key={idx}
                    onClick={() => toggleDay(idx)}
                    className={`w-9 h-9 rounded-xl font-bold text-xs transition-all ${
                      isSelected
                        ? 'bg-[#6C5CE7] text-white shadow-xs font-black'
                        : 'bg-slate-100  border border-slate-200  text-slate-500 hover:text-slate-900 '
                    }`}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Description */}
        <div>
          <label className="block text-xs font-bold text-slate-700  uppercase tracking-wider mb-2">
            Why this habit matters (Optional)
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="e.g. Read 20 pages every evening to expand knowledge and wind down before sleep."
            rows={2}
            className="w-full px-3.5 py-2.5 bg-slate-50  border border-slate-200  rounded-2xl text-sm font-semibold text-slate-900  focus:outline-none focus:border-[#6C5CE7] placeholder:text-slate-400"
          />
        </div>

        {/* Submit Actions */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 ">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" isLoading={isSubmitting} className="font-black">
            {habitToEdit ? 'Save Changes' : 'Create Habit'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};


