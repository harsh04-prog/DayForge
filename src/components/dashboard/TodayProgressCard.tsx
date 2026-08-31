'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '../common/Card';
import { ProgressRing } from '../common/ProgressRing';
import { Avatar } from '../common/Avatar';
import { Sparkles } from 'lucide-react';
import { DashboardData } from '../../types';
import { useAuth } from '../../context/AuthContext';

interface TodayProgressCardProps {
  data: DashboardData | null;
}

export const TodayProgressCard: React.FC<TodayProgressCardProps> = ({ data }) => {
  const { user, profile } = useAuth();
  const [formattedDate, setFormattedDate] = useState<string>('');

  useEffect(() => {
    setFormattedDate(
      new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
    );
  }, []);

  const completed = data?.today_completed_count ?? 0;
  const scheduled = data?.today_scheduled_count ?? 0;
  const percentage = data?.today_completion_rate ?? 0;
  const levelInfo = data?.level_info || {
    level: profile?.level || 1,
    title: 'Disciplined',
    current_xp: profile?.xp || 0,
    next_level_xp: 100,
    level_progress_percentage: 0,
  };

  return (
    <Card className="relative overflow-hidden bg-white border border-slate-200/90 shadow-soft">
      {/* Subtle Purple Ambient Glow in corner */}
      <div className="absolute -top-12 -right-12 w-36 h-36 rounded-full bg-[#6C5CE7]/5 blur-2xl pointer-events-none" />

      <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
        {/* Left Stats & User 3D Avatar */}
        <div className="flex-1 space-y-4 w-full">
          {/* Avatar & Greeting Row */}
          <div className="flex items-center gap-3.5">
            <Avatar
              src={profile?.avatar_url}
              name={user?.full_name || 'Hero'}
              size="lg"
              level={levelInfo.level}
              glow
            />
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-widest text-[#6C5CE7] bg-[#6C5CE7]/10 border border-[#6C5CE7]/25 px-2.5 py-0.5 rounded-full">
                  Today's Progress
                </span>
                {formattedDate && (
                  <span className="text-xs font-semibold text-slate-500">
                    {formattedDate}
                  </span>
                )}
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight mt-0.5">
                {completed} of {scheduled} completed
              </h2>
            </div>
          </div>

          <p className="text-xs text-slate-600 font-medium">
            {completed === scheduled && scheduled > 0
              ? '✨ Outstanding discipline! All daily habits completed today.'
              : '⚡ Take your next action to forge your compounding discipline.'}
          </p>

          {/* Level & XP Mini Bar */}
          <div className="space-y-1.5 pt-1">
            <div className="flex items-center justify-between text-xs font-bold">
              <span className="text-slate-700 flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-[#6C5CE7]" />
                Level {levelInfo.level} — {levelInfo.title}
              </span>
              <span className="text-[#D97706] font-black">
                {levelInfo.current_xp} / {levelInfo.next_level_xp} XP
              </span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden border border-slate-200/80">
              <div
                className="bg-[#6C5CE7] h-full rounded-full transition-all duration-500 shadow-xs"
                style={{ width: `${levelInfo.level_progress_percentage}%` }}
              />
            </div>
          </div>
        </div>

        {/* Right Progress Donut Ring */}
        <div className="shrink-0 flex flex-col items-center">
          <ProgressRing
            percentage={percentage}
            size={110}
            strokeWidth={10}
            color="#6C5CE7"
            bgColor="#F1F5F9"
          >
            <div className="text-center">
              <span className="text-2xl font-black text-slate-900 leading-none block">
                {percentage}%
              </span>
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-0.5 block">
                DONE
              </span>
            </div>
          </ProgressRing>
        </div>
      </div>
    </Card>
  );
};
