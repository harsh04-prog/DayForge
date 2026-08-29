'use client';

import React, { useState } from 'react';
import { Card } from '../common/Card';
import { DailyScoreBreakdown } from '../../types';
import { Activity, Info, CheckCircle2, TrendingUp, Flame } from 'lucide-react';
import { Modal } from '../common/Modal';

interface DailyScoreCardProps {
  scoreData?: DailyScoreBreakdown;
}

export const DailyScoreCard: React.FC<DailyScoreCardProps> = ({ scoreData }) => {
  const [showExplanation, setShowExplanation] = useState(false);

  const score = scoreData?.total_score ?? 80;
  const summary = scoreData?.summary ?? 'Consistent daily progress.';

  return (
    <>
      <Card className="flex flex-col justify-between h-full bg-white border border-slate-200/90 shadow-soft">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-[#6C5CE7]/10 border border-[#6C5CE7]/20 flex items-center justify-center text-[#6C5CE7]">
              <Activity className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-900 leading-tight">Daily Score</h3>
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Discipline Index</span>
            </div>
          </div>

          <button
            onClick={() => setShowExplanation(true)}
            className="text-slate-400 hover:text-slate-700 p-1 rounded-lg hover:bg-slate-100 transition-colors"
            title="How is this score calculated?"
          >
            <Info className="w-4 h-4" />
          </button>
        </div>

        <div className="flex items-baseline gap-2 my-2">
          <span className="text-4xl font-black text-slate-900 tracking-tight">
            {score}
          </span>
          <span className="text-sm font-bold text-slate-400">/ 100</span>
        </div>

        <p className="text-xs text-slate-600 font-medium line-clamp-2 mt-1">
          {summary}
        </p>

        <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500 font-bold">
          <span>Habits: <strong className="text-slate-800">{scoreData?.completion_score || 0}</strong></span>
          <span>Consistency: <strong className="text-slate-800">{scoreData?.consistency_score || 0}</strong></span>
          <span className="text-[#D97706]">Streak: +{scoreData?.streak_bonus || 0}</span>
        </div>
      </Card>

      {/* Score Explanation Modal */}
      <Modal
        isOpen={showExplanation}
        onClose={() => setShowExplanation(false)}
        title="How Your Daily Score Works"
        description="DayForge calculates a deterministic, meaningful score based on your real consistency."
      >
        <div className="space-y-4 text-xs text-slate-600">
          <div className="flex items-start gap-3 p-3.5 bg-slate-50 border border-slate-200/80 rounded-2xl">
            <CheckCircle2 className="w-5 h-5 text-[#6C5CE7] shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-slate-900 block">Today's Habits (up to 60 pts)</span>
              <span>Direct proportion of your scheduled habits completed today.</span>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3.5 bg-slate-50 border border-slate-200/80 rounded-2xl">
            <TrendingUp className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-slate-900 block">Historical Consistency (up to 25 pts)</span>
              <span>Reflects your completion percentage over the last 30 days.</span>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3.5 bg-slate-50 border border-slate-200/80 rounded-2xl">
            <Flame className="w-5 h-5 text-[#FFB547] shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-slate-900 block">Active Streak Bonus (up to 15 pts)</span>
              <span>Bonus awarded for maintaining multi-day unbroken streaks.</span>
            </div>
          </div>

          <p className="text-[11px] text-slate-400 italic">
            Zero random numbers. You control every point through your daily actions.
          </p>
        </div>
      </Modal>
    </>
  );
};
