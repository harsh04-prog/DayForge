'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useHabits } from '@/context/HabitContext';
import { api } from '@/services/api';
import { Achievement, XPTransaction } from '@/types';
import { Card } from '@/components/common/Card';
import { Badge } from '@/components/common/Badge';
import { Button } from '@/components/common/Button';
import { Avatar } from '@/components/common/Avatar';
import { HabitIcon } from '@/components/common/IconHelper';
import { AppLayout } from '@/components/layout/AppLayout';
import {
  Trophy,
  Shield,
  Zap,
  Lock,
  History
} from 'lucide-react';

export default function ProgressPage() {
  const { user, profile } = useAuth();
  const { dashboardData, useStreakShield } = useHabits();

  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [transactions, setTransactions] = useState<XPTransaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'achievements' | 'transactions'>('achievements');

  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        const [achRes, txRes] = await Promise.all([
          api.get<Achievement[]>('/progress/achievements'),
          api.get<XPTransaction[]>('/progress/transactions').catch(() => ({ data: [] })),
        ]);
        setAchievements(achRes.data);
        setTransactions(txRes.data);
      } catch (err) {
        console.error('Failed to load progress data', err);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, []);

  const levelInfo = dashboardData?.level_info;
  const level = levelInfo?.level ?? profile?.level ?? 1;
  const title = levelInfo?.title ?? 'Disciplined';
  const xp = levelInfo?.current_xp ?? profile?.xp ?? 0;
  const nextXp = levelInfo?.next_level_xp ?? 100;
  const pct = levelInfo?.level_progress_percentage ?? 0;
  const availableShields = profile?.available_shields ?? 2;

  const unlockedCount = achievements.filter((a) => a.unlocked).length;

  return (
    <AppLayout>
      <div className="space-y-6 max-w-5xl mx-auto text-slate-900">
        {/* Top Header */}
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Character Sheet & Progression
          </h1>
          <p className="text-xs sm:text-sm font-semibold text-slate-500 mt-1">
            Your real-world stats, unlocked badges, and compounding discipline.
          </p>
        </div>

        {/* Main Character Hero Card */}
        <Card className="bg-white border border-slate-200/90 shadow-soft p-6 sm:p-8 relative overflow-hidden">
          {/* Subtle Ambient Glow */}
          <div className="absolute -top-20 -right-20 w-60 h-60 rounded-full bg-[#6C5CE7]/5 blur-3xl pointer-events-none" />

          <div className="flex flex-col md:flex-row items-center md:items-start justify-between gap-6 relative z-10">
            <div className="flex flex-col sm:flex-row items-center gap-5 text-center sm:text-left">
              <Avatar
                src={profile?.avatar_url}
                name={user?.full_name || 'Hero'}
                size="2xl"
                glow
              />
              <div>
                <div className="flex items-center justify-center sm:justify-start gap-2 mb-1">
                  <span className="text-[10px] font-black uppercase tracking-widest text-[#6C5CE7] bg-[#6C5CE7]/10 border border-[#6C5CE7]/20 px-3 py-0.5 rounded-full">
                    Level {level}
                  </span>
                  <span className="text-xs font-bold text-slate-600">
                    {title}
                  </span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900">
                  {user?.full_name}
                </h2>
                <p className="text-xs text-slate-600 mt-1 max-w-md font-medium">
                  {profile?.bio || 'Forging habits one day at a time.'}
                </p>
              </div>
            </div>

            {/* Streak Shields Box */}
            <div className="bg-slate-50 border border-slate-200/90 rounded-3xl p-4 text-center sm:text-left min-w-[200px] shadow-xs">
              <div className="flex items-center justify-between gap-2 mb-2">
                <span className="text-xs font-bold text-slate-700">Streak Shields</span>
                <Shield className="w-4 h-4 text-[#6C5CE7]" />
              </div>
              <div className="text-2xl font-black text-slate-900 mb-2">
                {availableShields} <span className="text-xs text-slate-500 font-normal">Available</span>
              </div>
              {availableShields > 0 ? (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => useStreakShield()}
                  className="w-full bg-white hover:bg-slate-100 border-[#6C5CE7]/30 text-[#6C5CE7] text-xs font-bold rounded-xl py-1.5"
                >
                  Use Streak Shield
                </Button>
              ) : (
                <span className="text-[11px] text-slate-500 italic block">
                  Earned via 14-day streaks
                </span>
              )}
            </div>
          </div>

          {/* Level XP Bar */}
          <div className="mt-8 pt-6 border-t border-slate-200/80 space-y-2 relative z-10">
            <div className="flex items-center justify-between text-xs font-bold">
              <span className="text-slate-700">Progression to Level {level + 1}</span>
              <span className="text-[#D97706] font-black">{xp} / {nextXp} XP ({pct}%)</span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden p-0.5 border border-slate-200/80">
              <div
                className="bg-[#6C5CE7] h-full rounded-full transition-all duration-500 shadow-xs"
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
        </Card>

        {/* Tabs (Achievements vs XP History) */}
        <div className="flex items-center gap-2 border-b border-slate-200 pb-3">
          <button
            onClick={() => setActiveTab('achievements')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition-all ${
              activeTab === 'achievements'
                ? 'bg-[#6C5CE7] text-white shadow-md shadow-[#6C5CE7]/20 font-black'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Trophy className="w-4 h-4" />
            Achievements ({unlockedCount} / {achievements.length})
          </button>

          <button
            onClick={() => setActiveTab('transactions')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition-all ${
              activeTab === 'transactions'
                ? 'bg-[#6C5CE7] text-white shadow-md shadow-[#6C5CE7]/20 font-black'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <History className="w-4 h-4" />
            XP Transaction History
          </button>
        </div>

        {/* Achievements Grid */}
        {activeTab === 'achievements' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {achievements.map((ach) => (
              <Card
                key={ach.id}
                className={`p-5 flex flex-col justify-between transition-all rounded-3xl ${
                  ach.unlocked
                    ? 'bg-white border-[#6C5CE7]/40 shadow-soft'
                    : 'bg-slate-50 border-slate-200/80 shadow-xs'
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div
                      className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-xs ${
                        ach.unlocked
                          ? 'bg-[#6C5CE7] text-white'
                          : 'bg-slate-200 border border-slate-300 text-slate-500'
                      }`}
                    >
                      {ach.unlocked ? (
                        <HabitIcon name={ach.icon} className="w-6 h-6" />
                      ) : (
                        <Lock className="w-5 h-5" />
                      )}
                    </div>

                    <Badge
                      size="sm"
                      variant={ach.unlocked ? 'purple' : 'default'}
                      className="text-[10px] capitalize"
                    >
                      {ach.badge_tier || 'Standard'}
                    </Badge>
                  </div>

                  <h4 className="font-bold text-sm text-slate-900 mb-1">
                    {ach.name}
                  </h4>
                  <p className="text-xs text-slate-600 leading-relaxed font-medium">
                    {ach.description}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-200/70 flex items-center justify-between text-xs">
                  <span className="font-black text-[#D97706] flex items-center gap-1">
                    <Zap className="w-3.5 h-3.5 fill-[#FFB547]" />
                    +{ach.xp_reward} XP
                  </span>
                  {ach.unlocked ? (
                    <span className="text-[11px] font-bold text-emerald-600">
                      ✓ Unlocked
                    </span>
                  ) : (
                    <span className="text-[11px] font-semibold text-slate-400">
                      Locked
                    </span>
                  )}
                </div>
              </Card>
            ))}
          </div>
        ) : (
          /* Transactions List */
          <Card className="bg-white border border-slate-200/90 divide-y divide-slate-100 p-0 overflow-hidden rounded-3xl shadow-soft">
            {transactions.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-500 font-medium">
                No XP history recorded yet. Complete habits to earn XP!
              </div>
            ) : (
              transactions.map((tx) => (
                <div key={tx.id} className="p-4 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-[#6C5CE7]/10 border border-[#6C5CE7]/20 flex items-center justify-center text-[#6C5CE7]">
                      <Zap className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-900">
                        {tx.description || tx.source}
                      </p>
                      <p className="text-[10px] text-slate-400">
                        {new Date(tx.created_at).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <span className="text-xs font-black text-[#D97706]">
                    +{tx.amount} XP
                  </span>
                </div>
              ))
            )}
          </Card>
        )}
      </div>
    </AppLayout>
  );
}
