'use client';

import React from 'react';
import { Card } from '../common/Card';
import { TrendPoint } from '../../types';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

interface CompletionRateChartProps {
  trends: TrendPoint[];
}

export const CompletionRateChart: React.FC<CompletionRateChartProps> = ({ trends }) => {
  return (
    <Card className="bg-white border border-slate-200/90 shadow-soft p-5 sm:p-6 space-y-4">
      <div>
        <h3 className="text-base font-black text-slate-900 tracking-tight">
          7-Day Completion Velocity
        </h3>
        <p className="text-xs text-slate-500 mt-0.5">
          Real percentage of scheduled routines executed each day.
        </p>
      </div>

      <div className="h-64 w-full pt-2">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={trends} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="rateGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#6C5CE7" stopOpacity={0.25} />
                <stop offset="95%" stopColor="#6C5CE7" stopOpacity={0.0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
            <XAxis
              dataKey="period"
              stroke="#64748B"
              fontSize={12}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              stroke="#64748B"
              fontSize={12}
              tickLine={false}
              axisLine={false}
              domain={[0, 100]}
              tickFormatter={(v) => `${v}%`}
            />
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const d = payload[0].payload as TrendPoint;
                  return (
                    <div className="bg-white text-slate-900 rounded-xl px-3 py-2 text-xs shadow-xl space-y-0.5 border border-slate-200">
                      <div className="font-bold">{d.period}</div>
                      <div className="text-[#6C5CE7] font-semibold">{d.rate}% Completion</div>
                      <div className="text-slate-500">
                        {d.completed} of {d.scheduled} habits
                      </div>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Area
              type="monotone"
              dataKey="rate"
              stroke="#6C5CE7"
              strokeWidth={3}
              fillOpacity={1}
              fill="url(#rateGradient)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
};
