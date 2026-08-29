'use client';

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
        return 'bg-[#6C5CE7] shadow-sm hover:ring-2 hover:ring-[#6C5CE7]';
      default:
        return 'bg-slate-100 border border-slate-200/80 hover:bg-slate-200';
    }
  };

  return (
    <Card className="bg-white border border-slate-200/90 shadow-soft p-5 sm:p-6 space-y-4">
      {/* Header & Stats */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-base font-black text-slate-900 tracking-tight">
            Yearly Consistency Heatmap
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            365 days of relentless personal improvement.
          </p>
        </div>

        <div className="flex items-center gap-4 text-xs font-semibold text-slate-600">
          <div>
            <span className="text-slate-400 font-normal">Active: </span>
            <span className="text-slate-900 font-bold">{totalActiveDays} days</span>
          </div>
          <div>
            <span className="text-slate-400 font-normal">Current: </span>
            <span className="text-[#D97706] font-bold">{currentStreak}d</span>
          </div>
          <div>
            <span className="text-slate-400 font-normal">Best: </span>
            <span className="text-[#6C5CE7] font-bold">{longestStreak}d</span>
          </div>
        </div>
      </div>

      {/* Heatmap Grid (Horizontal scrollable on mobile) */}
      <div className="overflow-x-auto pb-2 no-scrollbar">
        <div className="inline-flex gap-1 min-w-[700px]">
          {weeks.map((week, weekIndex) => (
            <div key={weekIndex} className="flex flex-col gap-1">
              {week.map((day) => (
                <div
                  key={day.date}
                  onMouseEnter={() => setHoveredDay(day)}
                  onMouseLeave={() => setHoveredDay(null)}
                  className={`w-3 h-3 rounded-xs transition-all cursor-pointer ${getCellColor(day.level)}`}
                />
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* Tooltip & Legend */}
      <div className="flex items-center justify-between text-xs text-slate-500 pt-1 border-t border-slate-100">
        <div>
          {hoveredDay ? (
            <span className="font-bold text-slate-800">
              {hoveredDay.date}: <span className="text-[#6C5CE7]">{hoveredDay.count} completions</span>
            </span>
          ) : (
            <span className="text-[11px] text-slate-400">Hover over a square to view details</span>
          )}
        </div>

        <div className="flex items-center gap-1.5 text-[10px] font-semibold">
          <span>Less</span>
          <div className="w-2.5 h-2.5 rounded-xs bg-slate-100 border border-slate-200" />
          <div className="w-2.5 h-2.5 rounded-xs bg-[#6C5CE7]/25" />
          <div className="w-2.5 h-2.5 rounded-xs bg-[#6C5CE7]/50" />
          <div className="w-2.5 h-2.5 rounded-xs bg-[#6C5CE7]/75" />
          <div className="w-2.5 h-2.5 rounded-xs bg-[#6C5CE7]" />
          <span>More</span>
        </div>
      </div>
    </Card>
  );
};
