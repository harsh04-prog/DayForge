'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '../common/Card';
import { Button } from '../common/Button';
import { Modal } from '../common/Modal';
import { HabitIcon } from '../common/IconHelper';
import { api } from '@/services/api';
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  CheckCircle2,
  Clock,
  Zap,
  Sparkles
} from 'lucide-react';

interface DayActivity {
  date: string;
  day: number;
  total_completed: number;
  total_scheduled: number;
  completion_rate: number;
  completed_habits: Array<{
    log_id: number;
    habit_id: number;
    title: string;
    category: string;
    color: string;
    icon: string;
    xp_earned: number;
  }>;
  is_today: boolean;
}

interface MonthActivityData {
  year: number;
  month: number;
  days: DayActivity[];
}

export const InteractiveActivityCalendar: React.FC = () => {
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [monthData, setMonthData] = useState<MonthActivityData | null>(null);
  const [selectedDay, setSelectedDay] = useState<DayActivity | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth() + 1;

  const fetchMonthData = async (y: number, m: number) => {
    try {
      setIsLoading(true);
      const res = await api.get<MonthActivityData>(`/analytics/calendar?year=${y}&month=${m}`);
      setMonthData(res.data);
    } catch (err) {
      console.error('Failed to load month calendar activity', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMonthData(year, month);
  }, [year, month]);

  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 2, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month, 1));
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  // Calculate day-of-week offset for first day of month (0 = Sunday, 1 = Monday)
  const firstDayOfWeek = new Date(year, month - 1, 1).getDay();

  return (
    <Card className="bg-white border border-slate-200/90 shadow-soft p-5 sm:p-6 space-y-4">
      {/* Calendar Header & Month Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-100">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-2xl bg-[#6C5CE7]/10 border border-[#6C5CE7]/20 flex items-center justify-center text-[#6C5CE7]">
            <CalendarIcon className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-base font-black text-slate-900 tracking-tight">
              Habit & Activity Calendar
            </h3>
            <p className="text-xs text-slate-500 font-medium">
              Real logged consistency and daily execution history.
            </p>
          </div>
        </div>

        {/* Navigation Controls */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={handleToday}
            className="text-xs font-bold px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 transition-colors"
          >
            Today
          </button>
          <div className="flex items-center bg-slate-100 p-1 rounded-2xl border border-slate-200/80">
            <button
              onClick={handlePrevMonth}
              className="p-1.5 rounded-xl hover:bg-white text-slate-600 transition-colors"
              aria-label="Previous Month"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-3 text-xs font-black text-slate-900 min-w-[120px] text-center">
              {monthNames[month - 1]} {year}
            </span>
            <button
              onClick={handleNextMonth}
              className="p-1.5 rounded-xl hover:bg-white text-slate-600 transition-colors"
              aria-label="Next Month"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Weekday Names Header */}
      <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-black text-slate-400 uppercase tracking-wider py-1">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
          <div key={d}>{d}</div>
        ))}
      </div>

      {/* Calendar Days Grid */}
      <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
        {/* Leading empty days */}
        {Array.from({ length: firstDayOfWeek }).map((_, idx) => (
          <div key={`empty-${idx}`} className="h-14 sm:h-16 rounded-2xl bg-slate-50/50 border border-transparent" />
        ))}

        {/* Real Month Days */}
        {monthData?.days.map((day) => {
          const hasCompletions = day.total_completed > 0;
          const isToday = day.is_today;

          return (
            <button
              key={day.date}
              onClick={() => setSelectedDay(day)}
              className={`h-14 sm:h-16 p-1.5 sm:p-2 rounded-2xl border transition-all text-left flex flex-col justify-between group relative select-none ${
                isToday
                  ? 'border-[#6C5CE7] ring-2 ring-[#6C5CE7]/30 bg-[#6C5CE7]/5 shadow-xs'
                  : hasCompletions
                  ? 'border-slate-200/90 bg-white hover:border-[#6C5CE7]/40 hover:shadow-soft'
                  : 'border-slate-100 bg-slate-50/50 hover:bg-slate-100/80'
              }`}
            >
              <div className="flex items-center justify-between">
                <span
                  className={`text-xs font-bold leading-none ${
                    isToday ? 'text-[#6C5CE7] font-black' : 'text-slate-700'
                  }`}
                >
                  {day.day}
                </span>

                {isToday && (
                  <span className="w-1.5 h-1.5 rounded-full bg-[#6C5CE7]" />
                )}
              </div>

              {/* Completion indicators */}
              {hasCompletions ? (
                <div className="flex items-center gap-1">
                  <div className="px-1.5 py-0.5 rounded-md bg-[#6C5CE7] text-white text-[9px] font-black leading-none flex items-center gap-0.5 shadow-xs">
                    <CheckCircle2 className="w-2.5 h-2.5 stroke-[2.5]" />
                    <span>{day.total_completed}</span>
                  </div>
                </div>
              ) : (
                <span className="text-[10px] text-slate-300 font-medium leading-none group-hover:text-slate-400">
                  —
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Date Inspection Modal */}
      <Modal
        isOpen={Boolean(selectedDay)}
        onClose={() => setSelectedDay(null)}
        title={selectedDay ? `Activity for ${selectedDay.date}` : ''}
        description={
          selectedDay?.is_today
            ? "Today's logged habits and routine execution"
            : 'Logged discipline records for this date'
        }
      >
        {selectedDay && (
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-200/80 text-xs font-bold">
              <span className="text-slate-600">Total Completed:</span>
              <span className="text-slate-900 font-black text-sm">
                {selectedDay.total_completed} of {selectedDay.total_scheduled} Habits ({selectedDay.completion_rate}%)
              </span>
            </div>

            {selectedDay.completed_habits.length === 0 ? (
              <div className="p-8 text-center bg-slate-50 rounded-2xl border border-slate-100 text-xs text-slate-400">
                <Clock className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                <p className="font-semibold text-slate-600">No habit completions logged on this date.</p>
                <p className="text-[11px] text-slate-400 mt-0.5">Stay consistent to fill your activity matrix!</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-[300px] overflow-y-auto no-scrollbar">
                {selectedDay.completed_habits.map((h, i) => (
                  <div
                    key={i}
                    className="p-3 rounded-2xl bg-white border border-slate-200/90 shadow-xs flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-8 h-8 rounded-xl flex items-center justify-center text-white shadow-xs shrink-0"
                        style={{ backgroundColor: h.color || '#6C5CE7' }}
                      >
                        <HabitIcon name={h.icon || 'check'} className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-slate-900 leading-tight">
                          {h.title}
                        </h4>
                        <span className="text-[10px] text-slate-400 font-semibold uppercase">
                          {h.category}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-xs font-black text-[#D97706] flex items-center gap-0.5">
                        <Zap className="w-3 h-3 fill-[#FFB547]" />
                        +{h.xp_earned} XP
                      </span>
                      <span className="text-[11px] font-bold text-emerald-600">
                        ✓ Done
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </Modal>
    </Card>
  );
};
