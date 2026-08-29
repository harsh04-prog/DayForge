import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { Challenge } from '../types';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Badge } from '../components/common/Badge';
import { HabitIcon } from '../components/common/IconHelper';
import { Zap, CheckCircle2, ArrowRight, ShieldCheck } from 'lucide-react';
import { useToast } from '../context/ToastContext';

export const ChallengesPage: React.FC = () => {
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { showSuccess, showError } = useToast();

  const fetchChallenges = async () => {
    try {
      setIsLoading(true);
      const res = await api.get<Challenge[]>('/challenges/');
      setChallenges(res.data);
    } catch (err) {
      console.error('Failed to load challenges', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchChallenges();
  }, []);

  const handleJoin = async (id: number) => {
    try {
      const res = await api.post(`/challenges/${id}/join`);
      showSuccess('Challenge Joined!', res.data.message);
      fetchChallenges();
    } catch (err: any) {
      showError('Error', err.response?.data?.detail || 'Failed to join challenge.');
    }
  };

  const handleLeave = async (id: number) => {
    try {
      const res = await api.post(`/challenges/${id}/leave`);
      showSuccess('Left Challenge', res.data.message);
      fetchChallenges();
    } catch (err: any) {
      showError('Error', err.response?.data?.detail || 'Failed to leave challenge.');
    }
  };

  return (
    <div className="space-y-5 sm:space-y-6 max-w-5xl mx-auto text-slate-900">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl md:text-3xl font-black text-slate-900 tracking-tight">
          Challenges & Quests
        </h1>
        <p className="text-xs sm:text-sm font-semibold text-slate-500 mt-0.5">
          Structured sprints with major bonus XP and exclusive mastery badges.
        </p>
      </div>

      {isLoading ? (
        <div className="py-12 text-center text-sm font-bold text-slate-400 animate-pulse">
          Loading active quests...
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
          {challenges.map((chal) => (
            <Card
              key={chal.id}
              className={`p-5 sm:p-6 flex flex-col justify-between transition-all rounded-3xl ${
                chal.is_joined
                  ? 'bg-white border-[#6C5CE7]/40 shadow-soft ring-2 ring-[#6C5CE7]/20'
                  : 'bg-white border-slate-200/90 shadow-soft'
              }`}
            >
              <div>
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div className="w-12 h-12 rounded-2xl bg-[#6C5CE7]/10 border border-[#6C5CE7]/20 flex items-center justify-center text-[#6C5CE7] shadow-xs shrink-0">
                    <HabitIcon name={chal.icon} className="w-6 h-6" />
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-bold text-[#D97706] bg-[#FFB547]/15 px-2.5 py-1 rounded-xl border border-[#FFB547]/30 flex items-center gap-1">
                      <Zap className="w-3.5 h-3.5 fill-[#FFB547]" />
                      +{chal.xp_reward} XP
                    </span>
                    <Badge size="sm" variant="default">
                      {chal.duration_days} Days
                    </Badge>
                  </div>
                </div>

                <h3 className="font-black text-base sm:text-lg text-slate-900 mb-1 leading-snug">
                  {chal.title}
                </h3>
                <p className="text-xs text-slate-500 leading-relaxed font-medium mb-4">
                  {chal.description}
                </p>

                {/* Progress if joined */}
                {chal.is_joined && (
                  <div className="space-y-1.5 p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 mb-4">
                    <div className="flex items-center justify-between text-xs font-bold">
                      <span className="text-[#6C5CE7] flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Quest in progress
                      </span>
                      <span className="text-slate-500">
                        {chal.completed_days || 0} / {chal.duration_days} days
                      </span>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-[#6C5CE7] h-full rounded-full transition-all duration-300"
                        style={{
                          width: `${chal.progress_percentage || 0}%`,
                        }}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Action Button (min 44px touch area) */}
              <div className="pt-3.5 border-t border-slate-100 flex items-center justify-between gap-3">
                <span className="text-xs text-slate-400 font-semibold flex items-center gap-1">
                  <ShieldCheck className="w-4 h-4 text-[#6C5CE7]" />
                  {chal.category}
                </span>

                {chal.is_joined ? (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleLeave(chal.id)}
                    className="text-xs text-slate-500 hover:text-rose-600 min-h-[40px]"
                  >
                    Leave Challenge
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    variant="primary"
                    onClick={() => handleJoin(chal.id)}
                    rightIcon={<ArrowRight className="w-3.5 h-3.5 stroke-[2.5]" />}
                    className="font-black rounded-xl min-h-[40px] px-4"
                  >
                    Join Quest
                  </Button>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
