import React from 'react';
import { Card } from '../common/Card';
import { Button } from '../common/Button';
import { Recommendation } from '../../types';
import { Sparkles, AlertTriangle, Flame, Clock, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface SmartRecommendationsProps {
  recommendations: Recommendation[];
}

export const SmartRecommendations: React.FC<SmartRecommendationsProps> = ({ recommendations }) => {
  const navigate = useNavigate();

  const getIcon = (type: string) => {
    switch (type) {
      case 'overload':
        return <AlertTriangle className="w-5 h-5 text-amber-500" />;
      case 'celebration':
      case 'streak':
        return <Flame className="w-5 h-5 text-[#FFB547]" />;
      case 'timing':
        return <Clock className="w-5 h-5 text-[#6C5CE7]" />;
      default:
        return <Sparkles className="w-5 h-5 text-[#6C5CE7]" />;
    }
  };

  const handleAction = (rec: Recommendation) => {
    if (rec.action_type === 'navigate_habits') {
      navigate('/habits');
    } else if (rec.action_type === 'view_habit' && rec.habit_id) {
      navigate(`/habits/${rec.habit_id}`);
    } else {
      navigate('/');
    }
  };

  return (
    <div className="space-y-3 text-slate-900 dark:text-slate-100">
      <div className="flex items-center gap-2 mb-1">
        <Sparkles className="w-4 h-4 text-[#6C5CE7]" />
        <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider">
          Smart Behavior Insights
        </h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
        {recommendations.map((rec) => (
          <Card
            key={rec.id}
            className="p-4 bg-white dark:bg-[#151724] border border-slate-200/90 dark:border-[#2E3348] shadow-soft flex flex-col justify-between hover:border-[#6C5CE7]/40 transition-all"
          >
            <div className="flex items-start gap-3 mb-3">
              <div className="w-9 h-9 rounded-xl bg-slate-50 dark:bg-[#0F121C] border border-slate-200/80 dark:border-[#2E3348] flex items-center justify-center shrink-0">
                {getIcon(rec.type)}
              </div>
              <div>
                <h4 className="text-sm font-black text-slate-900 dark:text-white">{rec.title}</h4>
                <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">{rec.message}</p>
              </div>
            </div>

            {rec.action_label && (
              <div className="pt-2 border-t border-slate-100 dark:border-[#2E3348]/60 flex justify-end">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => handleAction(rec)}
                  rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
                  className="text-xs text-[#6C5CE7] dark:text-[#A29BFE] hover:underline p-0 h-auto font-black"
                >
                  {rec.action_label}
                </Button>
              </div>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
};
