'use client';

import React, { useState, useEffect } from 'react';
import { api } from '@/services/api';
import { Challenge } from '@/types';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { Badge } from '@/components/common/Badge';
import { HabitIcon } from '@/components/common/IconHelper';
import { Zap, CheckCircle2, ArrowRight, ShieldCheck } from 'lucide-react';
import { useToast } from '@/context/ToastContext';
import { AppLayout } from '@/components/layout/AppLayout';

export default function ChallengesPage() {
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { showSuccess, showError } = useToast();

  const fetchChallenges = async () => {
    try {
      setIsLoading(true);
      const res = await api.get<Challenge[]>('/challenges');
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
    <AppLayout>
      <div className="space-y-6 max-w-5xl mx-auto text-slate-900">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Community Quests & Challenges
          </h1>
          <p className="text-xs sm:text-sm font-semibold text-slate-500 mt-1">
            Join time-limited sprints to boost momentum and earn exclusive badges.
          </p>
        </div>

        {isLoading ? (
          <div className="py-12 text-center text-xs font-bold text-slate-400 animate-pulse">
            Loading active challenges...
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {challenges.map((ch) => (
              <Card
                key={ch.id}
                className="bg-white border border-slate-200/90 shadow-soft p-5 rounded-3xl flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div
                      className="w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-xs"
                      style={{ backgroundColor: ch.color || '#6C5CE7' }}
                    >
                      <HabitIcon name={ch.icon || 'zap'} className="w-6 h-6" />
                    </div>

                    <Badge size="sm" variant="purple" className="text-[10px] font-black">
                      {ch.duration_days} Days
                    </Badge>
                  </div>

                  <h3 className="text-base font-black text-slate-900 tracking-tight mb-1">
                    {ch.title}
                  </h3>
                  <p className="text-xs text-slate-500 font-medium leading-relaxed mb-4">
                    {ch.description}
                  </p>

                  <div className="space-y-2 p-3 rounded-2xl bg-slate-50 border border-slate-100 text-xs">
                    <div className="flex items-center justify-between font-bold">
                      <span className="text-slate-500">Reward</span>
                      <span className="text-[#D97706] font-black flex items-center gap-1">
                        <Zap className="w-3.5 h-3.5 fill-[#FFB547]" />
                        +{ch.xp_reward} XP
                      </span>
                    </div>

                    {ch.badge_name && (
                      <div className="flex items-center justify-between font-bold">
                        <span className="text-slate-500">Exclusive Badge</span>
                        <span className="text-[#6C5CE7] font-black flex items-center gap-1">
                          <ShieldCheck className="w-3.5 h-3.5" />
                          {ch.badge_name}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-5 pt-3 border-t border-slate-100">
                  {ch.is_joined ? (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleLeave(ch.id)}
                      className="w-full text-rose-600 hover:bg-rose-50 border-rose-200 font-bold text-xs rounded-xl py-2"
                    >
                      Leave Challenge
                    </Button>
                  ) : (
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => handleJoin(ch.id)}
                      rightIcon={<ArrowRight className="w-4 h-4 stroke-[2.5]" />}
                      className="w-full font-black text-xs rounded-xl py-2 shadow-md shadow-[#6C5CE7]/20"
                    >
                      Join Challenge
                    </Button>
                  )}
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
