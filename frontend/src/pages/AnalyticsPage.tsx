import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { HeatmapResponse, TrendPoint, CategoryBreakdown, Recommendation } from '../types';
import { HeatmapCalendar } from '../components/analytics/HeatmapCalendar';
import { CompletionRateChart } from '../components/analytics/CompletionRateChart';
import { CategoryBreakdownChart } from '../components/analytics/CategoryBreakdownChart';
import { SmartRecommendations } from '../components/analytics/SmartRecommendations';
import { Card } from '../components/common/Card';
import { Calendar, Clock, Trophy, Flame } from 'lucide-react';

export const AnalyticsPage: React.FC = () => {
  const [heatmapData, setHeatmapData] = useState<HeatmapResponse | null>(null);
  const [trends, setTrends] = useState<TrendPoint[]>([]);
  const [categories, setCategories] = useState<CategoryBreakdown[]>([]);
  const [insights, setInsights] = useState<{
    best_day?: string;
    weakest_day?: string;
    best_time?: string;
    most_consistent_habit?: string;
    least_consistent_habit?: string;
  }>({});
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadAnalytics = async () => {
      try {
        setIsLoading(true);
        const [hmRes, inRes, recRes] = await Promise.all([
          api.get<HeatmapResponse>('/analytics/heatmap'),
          api.get<any>('/analytics/insights'),
          api.get<Recommendation[]>('/analytics/recommendations'),
        ]);

        setHeatmapData(hmRes.data);
        setTrends(inRes.data.trends || []);
        setCategories(inRes.data.categories || []);
        setInsights({
          best_day: inRes.data.best_day,
          weakest_day: inRes.data.weakest_day,
          best_time: inRes.data.best_time,
          most_consistent_habit: inRes.data.most_consistent_habit,
          least_consistent_habit: inRes.data.least_consistent_habit,
        });
        setRecommendations(recRes.data);
      } catch (err) {
        console.error('Failed to load analytics', err);
      } finally {
        setIsLoading(false);
      }
    };
    loadAnalytics();
  }, []);

  if (isLoading) {
    return (
      <div className="py-12 text-center text-xs font-bold text-slate-400 animate-pulse">
        Generating real behavior analytics...
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto text-slate-900 dark:text-slate-100">
      {/* Top Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
          Analytics & Behavioral Matrix
        </h1>
        <p className="text-xs sm:text-sm font-semibold text-slate-500 dark:text-slate-400 mt-1">
          Measurable data on your consistency, timing, and momentum.
        </p>
      </div>

      {/* 4 Peak Productivity KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <Card className="p-4 bg-white dark:bg-[#181B26] border border-slate-200/90 dark:border-[#2E3348] shadow-soft">
          <div className="flex items-center gap-2 text-slate-400 mb-1 text-[10px] font-black uppercase tracking-wider">
            <Calendar className="w-3.5 h-3.5 text-[#6C5CE7]" />
            <span>Peak Day</span>
          </div>
          <div className="text-lg font-black text-slate-900 dark:text-white">
            {insights.best_day || 'Weekday'}
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">Highest execution rate</p>
        </Card>

        <Card className="p-4 bg-white dark:bg-[#181B26] border border-slate-200/90 dark:border-[#2E3348] shadow-soft">
          <div className="flex items-center gap-2 text-slate-400 mb-1 text-[10px] font-black uppercase tracking-wider">
            <Clock className="w-3.5 h-3.5 text-[#6C5CE7]" />
            <span>Peak Time</span>
          </div>
          <div className="text-lg font-black text-slate-900 dark:text-white">
            {insights.best_time || '9 AM'}
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">Most frequent completions</p>
        </Card>

        <Card className="p-4 bg-white dark:bg-[#181B26] border border-slate-200/90 dark:border-[#2E3348] shadow-soft">
          <div className="flex items-center gap-2 text-slate-400 mb-1 text-[10px] font-black uppercase tracking-wider">
            <Trophy className="w-3.5 h-3.5 text-[#FFB547]" />
            <span>Top Habit</span>
          </div>
          <div className="text-lg font-black text-slate-900 dark:text-white truncate">
            {insights.most_consistent_habit || 'Daily Habit'}
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">Strongest habit loop</p>
        </Card>

        <Card className="p-4 bg-white dark:bg-[#181B26] border border-slate-200/90 dark:border-[#2E3348] shadow-soft">
          <div className="flex items-center gap-2 text-slate-400 mb-1 text-[10px] font-black uppercase tracking-wider">
            <Flame className="w-3.5 h-3.5 text-[#FFB547]" />
            <span>Longest Streak</span>
          </div>
          <div className="text-lg font-black text-[#FFB547]">
            {heatmapData?.longest_streak || 0} Days
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">Compounding momentum</p>
        </Card>
      </div>

      {/* 365-Day Heatmap */}
      {heatmapData && (
        <HeatmapCalendar
          days={heatmapData.days}
          totalActiveDays={heatmapData.total_active_days}
          longestStreak={heatmapData.longest_streak}
          currentStreak={heatmapData.current_streak}
        />
      )}

      {/* Smart Recommendations Engine */}
      {recommendations.length > 0 && (
        <SmartRecommendations recommendations={recommendations} />
      )}

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <CompletionRateChart trends={trends} />
        <CategoryBreakdownChart categories={categories} />
      </div>
    </div>
  );
};
