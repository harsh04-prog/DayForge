import React, { useState } from 'react';
import { Card } from '../common/Card';
import { HeatmapDay } from '../../types';

interface HeatmapCalendarProps {
  days: HeatmapDay[];
  totalActiveDays: number;
  longestStreak: number;
  currentStreak: number;
}

export const HeatmapCalendar: React.FC<HeatmapCalendarProps> = ({
  days,
  totalActiveDays,
  longestStreak,
  currentStreak,
}) => {
  const [hoveredDay, setHoveredDay] = useState<HeatmapDay | null>(null);

  // Group days into weeks (columns)
  const weeks: HeatmapDay[][] = [];
  let currentWeek: HeatmapDay[] = [];

  days.forEach((day, index) => {
    currentWeek.push(day);
    if (currentWeek.length === 7 || index === days.length - 1) {
      weeks.push(currentWeek);
      currentWeek = [];
    }
  });

  const getCellColor = (level: number) => {
    switch (level) {
      case 1:
        return 'bg-[#6C5CE7]/25 hover:ring-2 hover:ring-[#6C5CE7]/50';
      case 2:
        return 'bg-[#6C5CE7]/50 hover:ring-2 hover:ring-[#6C5CE7]/70';
      case 3:
        return 'bg-[#6C5CE7]/75 hover:ring-2 hover:ring-[#6C5CE7]';
      case 4:
        return 'bg-[#6C5CE7] shadow-[0_0_8px_rgba(108,92,231,0.5)] hover:ring-2 hover:ring-white';
      default:
        return 'bg-slate-100 dark:bg-[#0F121C] border border-slate-200/60 dark:border-[#2E3348] hover:bg-slate-200 dark:hover:bg-[#1E2232]';
    }
  };

  return (
    <Card className="bg-white dark:bg-[#181B26] border border-slate-200/90 dark:border-[#2E3348] shadow-soft p-5 sm:p-6 space-y-4">
      {/* Header & Stats */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-base font-black text-slate-900 dark:text-white tracking-tight">
            Yearly Consistency Heatmap
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            365 days of relentless personal improvement.
          </p>
        </div>

        <div className="flex items-center gap-4 text-xs font-semibold text-slate-600 dark:text-slate-300">
          <div>
            <span className="text-slate-400 font-normal">Active: </span>
            <span className="text-slate-900 dark:text-white font-bold">{totalActiveDays} days</span>
          </div>
          <div>
            <span className="text-slate-400 font-normal">Current: </span>
            <span className="text-[#FFB547] font-bold">{currentStreak}d</span>
          </div>
          <div>
            <span className="text-slate-400 font-normal">Best: </span>
            <span className="text-[#6C5CE7] dark:text-[#A29BFE] font-bold">{longestStreak}d</span>
          </div>
        </div>
      </div>

      {/* Grid Container */}
      <div className="overflow-x-auto pb-2 -mx-2 px-2 no-scrollbar">
        <div className="inline-flex gap-1 min-w-[700px]">
          {weeks.map((week, wIdx) => (
            <div key={wIdx} className="flex flex-col gap-1">
              {week.map((d) => (
                <div
                  key={d.date}
                  onMouseEnter={() => setHoveredDay(d)}
                  onMouseLeave={() => setHoveredDay(null)}
                  className={`w-3 h-3 rounded-xs transition-all cursor-pointer ${getCellColor(
                    d.level
                  )}`}
                />
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* Legend & Tooltip indicator */}
      <div className="flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-slate-100 dark:border-[#2E3348]/60">
        <div className="h-4 text-slate-600 dark:text-slate-300 font-medium">
          {hoveredDay ? (
            <span>
              <strong className="text-slate-900 dark:text-white">{hoveredDay.count} habits completed</strong> on{' '}
              {new Date(hoveredDay.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
            </span>
          ) : (
            <span className="text-slate-400">Hover over a square to view details</span>
          )}
        </div>

        <div className="flex items-center gap-1.5">
          <span>Less</span>
          <span className="w-2.5 h-2.5 rounded-xs bg-slate-100 dark:bg-[#0F121C] border border-slate-200 dark:border-[#2E3348]" />
          <span className="w-2.5 h-2.5 rounded-xs bg-[#6C5CE7]/25" />
          <span className="w-2.5 h-2.5 rounded-xs bg-[#6C5CE7]/50" />
          <span className="w-2.5 h-2.5 rounded-xs bg-[#6C5CE7]/75" />
          <span className="w-2.5 h-2.5 rounded-xs bg-[#6C5CE7]" />
          <span>More</span>
        </div>
      </div>
    </Card>
  );
};
