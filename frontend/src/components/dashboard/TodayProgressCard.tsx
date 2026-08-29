import React from 'react';
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
    <Card className="relative overflow-hidden bg-white dark:bg-[#181B26] border border-slate-200/90 dark:border-[#2E3348] shadow-soft">
      {/* Subtle Purple Ambient Glow in corner in dark mode */}
      <div className="absolute -top-12 -right-12 w-36 h-36 rounded-full bg-[#6C5CE7]/5 dark:bg-[#6C5CE7]/15 blur-2xl pointer-events-none" />

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
                <span className="text-[10px] font-black uppercase tracking-widest text-[#6C5CE7] bg-[#6C5CE7]/10 dark:bg-[#6C5CE7]/20 border border-[#6C5CE7]/25 px-2.5 py-0.5 rounded-full">
                  Today's Progress
                </span>
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                  {new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                </span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight mt-0.5">
                {completed} of {scheduled} completed
              </h2>
            </div>
          </div>

          <p className="text-xs text-slate-600 dark:text-slate-300 font-medium">
            {percentage === 100 && scheduled > 0
              ? '✨ All daily habits forged! 100% completion bonus unlocked.'
              : percentage >= 50
              ? '🔥 Great momentum. Finish your remaining habits today!'
              : '⚡ Take your next action to forge your compounding discipline.'}
          </p>

          {/* Level Progress Bar */}
          <div className="bg-slate-50 dark:bg-[#0F121C] border border-slate-200/80 dark:border-[#2E3348] rounded-2xl p-3 space-y-2">
            <div className="flex items-center justify-between text-xs font-bold">
              <div className="flex items-center gap-1.5 text-[#6C5CE7] dark:text-[#A29BFE]">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Level {levelInfo.level} — {levelInfo.title}</span>
              </div>
              <span className="text-slate-500 dark:text-slate-400 font-semibold text-[11px]">
                <strong className="text-[#FFB547]">{levelInfo.current_xp}</strong> / {levelInfo.next_level_xp} XP
              </span>
            </div>
            <div className="w-full bg-slate-200 dark:bg-[#1E2232] rounded-full h-2 overflow-hidden">
              <div
                className="bg-[#6C5CE7] h-full rounded-full transition-all duration-500 shadow-[0_0_10px_rgba(108,92,231,0.5)]"
                style={{ width: `${levelInfo.level_progress_percentage}%` }}
              />
            </div>
          </div>
        </div>

        {/* Circular Progress Ring */}
        <div className="shrink-0 flex flex-col items-center">
          <ProgressRing
            percentage={percentage}
            size={136}
            strokeWidth={11}
            color="#6C5CE7"
            bgColor="#E2E8F0"
          >
            <div className="text-center">
              <span className="text-3xl font-black text-slate-900 dark:text-white tracking-tight block leading-none">
                {percentage}%
              </span>
              <span className="text-[10px] font-black text-[#6C5CE7] dark:text-[#A29BFE] uppercase tracking-widest mt-1 block">
                Done
              </span>
            </div>
          </ProgressRing>
        </div>
      </div>
    </Card>
  );
};
