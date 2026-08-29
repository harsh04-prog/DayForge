import React from 'react';
import { Card } from '../common/Card';
import { CategoryBreakdown } from '../../types';

interface CategoryBreakdownChartProps {
  categories: CategoryBreakdown[];
}

export const CategoryBreakdownChart: React.FC<CategoryBreakdownChartProps> = ({ categories }) => {
  return (
    <Card className="bg-white dark:bg-[#151724] border border-slate-200/90 dark:border-[#2E3348] shadow-soft p-5 sm:p-6 space-y-4">
      <div>
        <h3 className="text-base font-black text-slate-900 dark:text-white tracking-tight">
          Category Distribution
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          Where you are allocating your energy.
        </p>
      </div>

      <div className="space-y-3.5 pt-1">
        {categories.map((cat) => (
          <div key={cat.category} className="space-y-1.5">
            <div className="flex items-center justify-between text-xs font-bold">
              <span className="text-slate-800 dark:text-slate-200">{cat.category}</span>
              <span className="text-slate-500 dark:text-slate-400 font-medium">
                {cat.completions} completions ({cat.total_habits} {cat.total_habits === 1 ? 'habit' : 'habits'})
              </span>
            </div>
            <div className="w-full bg-slate-100 dark:bg-[#0F121C] rounded-full h-2 overflow-hidden border border-slate-200/60 dark:border-[#2E3348]">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${Math.max(8, Math.min(100, cat.completions * 5))}%`,
                  backgroundColor: cat.color || '#6C5CE7',
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
};
