'use client';

import React from 'react';
import { Card } from '../common/Card';
import { Button } from '../common/Button';
import { Recommendation } from '../../types';
import { Sparkles, AlertTriangle, Flame, Clock, ArrowRight } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface SmartRecommendationsProps {
  recommendations: Recommendation[];
}

export const SmartRecommendations: React.FC<SmartRecommendationsProps> = ({ recommendations }) => {
  const router = useRouter();

  const getIcon = (type: string) => {
    switch (type) {
      case 'overload':
        return <AlertTriangle className="w-5 h-5 text-amber-500" />;
      case 'celebration':
      case 'streak':
        return <Flame className="w-5 h-5 text-amber-500" />;
      case 'habit_stack':
      case 'optimization':
        return <Sparkles className="w-5 h-5 text-indigo-500" />;
      default:
        return <Clock className="w-5 h-5 text-blue-500" />;
    }
  };

  if (!recommendations || recommendations.length === 0) {
    return (
      <Card className="p-6 text-center">
        <Sparkles className="w-8 h-8 text-slate-300 mx-auto mb-2" />
        <p className="text-sm font-medium text-slate-500">
          No recommendations right now. Keep building consistency!
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {recommendations.map((rec, i) => (
        <Card
          key={i}
          className="p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:border-indigo-200 transition-colors"
        >
          <div className="flex items-start gap-4">
            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 shrink-0">
              {getIcon(rec.type)}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-indigo-600">
                  {rec.type.replace('_', ' ')}
                </span>
                <span className="text-xs text-slate-400">•</span>
                <span className="text-xs text-slate-400 font-medium capitalize">
                  {rec.priority} Priority
                </span>
              </div>
              <p className="text-sm font-semibold text-slate-800 mt-1">
                {rec.message}
              </p>
            </div>
          </div>

          {rec.action_label && (
            <Button
              variant="outline"
              size="sm"
              className="shrink-0 w-full sm:w-auto"
              rightIcon={<ArrowRight className="w-4 h-4" />}
              onClick={() => {
                if (rec.action_url) router.push(rec.action_url);
              }}
            >
              {rec.action_label}
            </Button>
          )}
        </Card>
      ))}
    </div>
  );
};
