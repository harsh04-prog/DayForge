import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { api } from '../services/api';
import { HabitDetail, Habit } from '../types';
import { HabitIcon } from '../components/common/IconHelper';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Badge } from '../components/common/Badge';
import { HabitModal } from '../components/habits/HabitModal';
import { useHabits } from '../context/HabitContext';
import {
  ArrowLeft,
  Flame,
  CheckCircle2,
  Calendar,
  Clock,
  Sparkles,
  TrendingUp,
  Edit2,
  Check
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';

export const HabitDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { completeHabit, undoHabit } = useHabits();

  const [habit, setHabit] = useState<HabitDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [notes, setNotes] = useState('');

  const fetchHabitDetail = async () => {
    if (!id) return;
    try {
      setIsLoading(true);
      const res = await api.get<HabitDetail>(`/habits/${id}`);
      setHabit(res.data);
    } catch (err) {
      console.error('Failed to load habit detail', err);
      navigate('/habits');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchHabitDetail();
  }, [id]);

  if (isLoading || !habit) {
    return (
      <div className="py-12 text-center text-sm font-bold text-slate-400 animate-pulse">
        Loading habit analytics...
      </div>
    );
  }

  const isCompleted = habit.today_completed;

  const handleToggleComplete = async () => {
    if (isCompleted) {
      await undoHabit(habit.id);
    } else {
      await completeHabit(habit.id, habit.target_value, notes || undefined);
    }
    await fetchHabitDetail();
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto text-slate-900 dark:text-slate-100">
      {/* Back Button */}
      <Link
        to="/habits"
        className="inline-flex items-center gap-2 text-xs font-bold text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Habit Library
      </Link>

      {/* Main Habit Header Card */}
      <Card className="bg-white dark:bg-[#151724] border border-slate-200/90 dark:border-[#2E3348] shadow-soft p-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div
              className="w-16 h-16 rounded-3xl flex items-center justify-center shadow-xs shrink-0"
              style={{
                backgroundColor: `${habit.color || '#6C5CE7'}18`,
                color: habit.color || '#6C5CE7',
              }}
            >
              <HabitIcon name={habit.icon} className="w-8 h-8" />
            </div>

            <div>
              <div className="flex items-center gap-2 mb-1">
                <Badge size="sm" variant="default" className="text-[10px]">
                  {habit.category}
                </Badge>
                <span className="text-xs text-slate-400 font-semibold capitalize">
                  {habit.preferred_time} routine
                </span>
              </div>
              <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                {habit.name}
              </h1>
              {habit.description && (
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-lg">
                  {habit.description}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsEditModalOpen(true)}
              leftIcon={<Edit2 className="w-3.5 h-3.5" />}
              className="rounded-xl font-bold"
            >
              Edit
            </Button>

            <Button
              variant="primary"
              size="sm"
              onClick={handleToggleComplete}
              leftIcon={isCompleted ? <Check className="w-4 h-4 stroke-[3]" /> : <CheckCircle2 className="w-4 h-4" />}
              className={`rounded-xl font-black ${
                isCompleted
                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs'
                  : ''
              }`}
            >
              {isCompleted ? 'Completed Today' : 'Check In Today'}
            </Button>
          </div>
        </div>
      </Card>

      {/* 4 Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <Card className="p-4 bg-white dark:bg-[#151724] border border-slate-200/90 dark:border-[#2E3348] shadow-soft">
          <div className="flex items-center gap-2 text-slate-400 mb-1 text-[10px] font-black uppercase tracking-wider">
            <Flame className="w-3.5 h-3.5 text-[#FFB547]" />
            <span>Current Streak</span>
          </div>
          <div className="text-2xl font-black text-[#FFB547]">
            {habit.current_streak} <span className="text-xs font-semibold text-slate-400">days</span>
          </div>
        </Card>

        <Card className="p-4 bg-white dark:bg-[#151724] border border-slate-200/90 dark:border-[#2E3348] shadow-soft">
          <div className="flex items-center gap-2 text-slate-400 mb-1 text-[10px] font-black uppercase tracking-wider">
            <TrendingUp className="w-3.5 h-3.5 text-[#6C5CE7]" />
            <span>30d Consistency</span>
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white">
            {habit.completion_rate_30d}%
          </div>
        </Card>

        <Card className="p-4 bg-white dark:bg-[#151724] border border-slate-200/90 dark:border-[#2E3348] shadow-soft">
          <div className="flex items-center gap-2 text-slate-400 mb-1 text-[10px] font-black uppercase tracking-wider">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
            <span>All-Time Logs</span>
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white">
            {habit.total_completions}
          </div>
        </Card>

        <Card className="p-4 bg-white dark:bg-[#151724] border border-slate-200/90 dark:border-[#2E3348] shadow-soft">
          <div className="flex items-center gap-2 text-slate-400 mb-1 text-[10px] font-black uppercase tracking-wider">
            <Flame className="w-3.5 h-3.5 text-[#6C5CE7]" />
            <span>Best Streak</span>
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white">
            {habit.longest_streak} <span className="text-xs font-semibold text-slate-400">days</span>
          </div>
        </Card>
      </div>

      {/* Completion History Bar Chart */}
      <Card className="bg-white dark:bg-[#151724] border border-slate-200/90 dark:border-[#2E3348] shadow-soft p-6 space-y-4">
        <h3 className="text-base font-black text-slate-900 dark:text-white tracking-tight">
          Recent 7-Day Execution History
        </h3>

        <div className="h-56 w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={habit.weekly_progress || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="currentColor" className="text-slate-100 dark:text-[#2E3348]" />
              <XAxis dataKey="day" stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
              <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} domain={[0, 1]} tickFormatter={(v) => (v === 1 ? 'Done' : 'Missed')} />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const d = payload[0].payload;
                    return (
                      <div className="bg-slate-900 text-white rounded-xl px-3 py-2 text-xs shadow-xl">
                        <div className="font-bold">{d.date} ({d.day})</div>
                        <div className={d.completed ? 'text-emerald-400 font-bold' : 'text-slate-400'}>
                          {d.completed ? '✓ Completed' : 'Missed'}
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Bar dataKey="value" fill="#6C5CE7" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* Habit Edit Modal */}
      <HabitModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          fetchHabitDetail();
        }}
        habitToEdit={habit}
      />
    </div>
  );
};
