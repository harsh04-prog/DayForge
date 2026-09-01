'use client';

import React, { useState, useEffect } from 'react';
import { api } from '@/services/api';
import { Challenge } from '@/types';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { Badge } from '@/components/common/Badge';
import { Modal } from '@/components/common/Modal';
import { HabitIcon } from '@/components/common/IconHelper';
import {
  Zap,
  CheckCircle2,
  AlertTriangle,
  Flame,
  Calendar,
  XCircle,
  LogOut,
  Sparkles,
  Trophy,
  Filter,
  Clock,
  ArrowRight,
  ShieldCheck
} from 'lucide-react';
import { useToast } from '@/context/ToastContext';
import { useHabits } from '@/context/HabitContext';
import { AppLayout } from '@/components/layout/AppLayout';

export default function ChallengesPage() {
  const { challenges, joinChallenge, leaveChallenge, fetchChallenges, isLoading } = useHabits();
  const [activeTab, setActiveTab] = useState<'all' | 'joined'>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('All');
  const [challengeToLeave, setChallengeToLeave] = useState<Challenge | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const { showSuccess, showError } = useToast();

  useEffect(() => {
    fetchChallenges();
  }, [fetchChallenges]);

  const handleJoin = async (id: number) => {
    try {
      setIsProcessing(true);
      await joinChallenge(id);
    } catch {
      // Toast handled by HabitContext
    } finally {
      setIsProcessing(false);
    }
  };

  const confirmLeave = async () => {
    if (!challengeToLeave) return;
    try {
      setIsProcessing(true);
      await leaveChallenge(challengeToLeave.id);
      setChallengeToLeave(null);
    } catch {
      // Toast handled by HabitContext
    } finally {
      setIsProcessing(false);
    }
  };

  const joinedChallenges = challenges.filter((c) => c.is_joined);
  const filteredChallenges = challenges.filter((c) => {
    if (activeTab === 'joined' && !c.is_joined) return false;
    if (categoryFilter === 'Strict Only' && !c.is_strict) return false;
    if (categoryFilter !== 'All' && categoryFilter !== 'Strict Only' && c.category !== categoryFilter) return false;
    return true;
  });

  return (
    <AppLayout>
      <div className="space-y-6 max-w-5xl mx-auto text-slate-900">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Quests & Multi-Day Sprints
            </h1>
            <p className="text-xs sm:text-sm font-semibold text-slate-500 mt-1">
              Join structured discipline challenges, execute real habits, and claim XP badges.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('all')}
              className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all ${
                activeTab === 'all'
                  ? 'bg-[#6C5CE7] text-white shadow-md shadow-[#6C5CE7]/20 font-black'
                  : 'bg-slate-100 text-slate-600 hover:text-slate-900'
              }`}
            >
              All Quests ({challenges.length})
            </button>
            <button
              onClick={() => setActiveTab('joined')}
              className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all ${
                activeTab === 'joined'
                  ? 'bg-[#6C5CE7] text-white shadow-md shadow-[#6C5CE7]/20 font-black'
                  : 'bg-slate-100 text-slate-600 hover:text-slate-900'
              }`}
            >
              Joined ({joinedChallenges.length})
            </button>
          </div>
        </div>

        {/* Category Filters */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar text-xs font-bold">
          {['All', 'Strict Only', 'Productivity', 'Fitness', 'Mindfulness', 'Health', 'Study', 'General'].map((cat) => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={`px-3.5 py-1.5 rounded-xl whitespace-nowrap transition-all ${
                categoryFilter === cat
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-white border border-slate-200/90 text-slate-600 hover:bg-slate-50'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {isLoading ? (
          <div className="py-12 text-center text-xs font-bold text-slate-400 animate-pulse">
            Loading real challenge metrics...
          </div>
        ) : filteredChallenges.length === 0 ? (
          <Card className="p-12 text-center bg-white border border-slate-200/90 rounded-3xl">
            <Trophy className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <h3 className="text-base font-black text-slate-800">No Challenges in this view</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              {activeTab === 'joined'
                ? "You haven't joined any challenges yet. Switch to 'All Quests' to join a sprint!"
                : 'No challenges match the selected filter.'}
            </p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredChallenges.map((ch) => {
              const isFailed = ch.status === 'failed';
              const isCompleted = ch.status === 'completed';
              const isActive = ch.status === 'active';

              return (
                <Card
                  key={ch.id}
                  className={`bg-white border shadow-soft p-5 rounded-3xl flex flex-col justify-between transition-all ${
                    isFailed
                      ? 'border-rose-300/80 bg-rose-50/20'
                      : isCompleted
                      ? 'border-emerald-300/80 bg-emerald-50/20'
                      : isActive
                      ? 'border-[#6C5CE7]/40 ring-1 ring-[#6C5CE7]/20 shadow-md'
                      : 'border-slate-200/90 hover:border-slate-300'
                  }`}
                >
                  <div>
                    {/* Top Row: Icon + Badges */}
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div
                        className="w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-xs"
                        style={{ backgroundColor: ch.color || '#6C5CE7' }}
                      >
                        <HabitIcon name={ch.icon || 'zap'} className="w-6 h-6" />
                      </div>

                      <div className="flex flex-col items-end gap-1">
                        <div className="flex items-center gap-1">
                          {ch.is_strict && (
                            <span className="px-2 py-0.5 rounded-md bg-rose-100 border border-rose-200 text-rose-700 text-[10px] font-black uppercase tracking-wider">
                              STRICT
                            </span>
                          )}
                          <Badge size="sm" variant="purple" className="text-[10px] font-black">
                            {ch.duration_days} Days
                          </Badge>
                        </div>

                        {/* Status Label */}
                        {isFailed && (
                          <span className="text-[10px] font-black text-rose-600 flex items-center gap-1">
                            <XCircle className="w-3 h-3" /> Streak Broken
                          </span>
                        )}
                        {isCompleted && (
                          <span className="text-[10px] font-black text-emerald-600 flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" /> Completed
                          </span>
                        )}
                        {isActive && (
                          <span className="text-[10px] font-black text-[#6C5CE7] flex items-center gap-1">
                            <Flame className="w-3 h-3 text-[#FFB547] fill-[#FFB547]" /> Active Sprint
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Challenge Title & Description */}
                    <h3 className="text-base font-black text-slate-900 tracking-tight mb-1">
                      {ch.title}
                    </h3>
                    <p className="text-xs text-slate-600 font-medium leading-relaxed mb-3">
                      {ch.description}
                    </p>

                    {/* Strict Rule Description */}
                    <div className="p-2.5 rounded-2xl bg-slate-50 border border-slate-200/70 text-[11px] text-slate-600 mb-3 space-y-1">
                      <div className="font-bold text-slate-800 flex items-center gap-1.5">
                        <ShieldCheck className="w-3.5 h-3.5 text-[#6C5CE7]" />
                        <span>Rule Guidelines:</span>
                      </div>
                      <p className="leading-snug text-slate-500">{ch.rule_description}</p>
                    </div>

                    {/* Real Progress Bar if Joined */}
                    {ch.is_joined && (
                      <div className="space-y-1.5 p-3 rounded-2xl bg-slate-100/70 border border-slate-200/80 mb-3">
                        <div className="flex items-center justify-between text-xs font-black">
                          <span className="text-slate-700">Sprint Progress</span>
                          <span className="text-[#6C5CE7]">
                            {ch.completed_days || 0} / {ch.duration_days} Days ({ch.progress_percentage || 0}%)
                          </span>
                        </div>
                        <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${
                              isFailed ? 'bg-rose-500' : isCompleted ? 'bg-emerald-500' : 'bg-[#6C5CE7]'
                            }`}
                            style={{ width: `${ch.progress_percentage || 0}%` }}
                          />
                        </div>
                        <div className="flex items-center justify-between text-[10px] text-slate-500 font-semibold pt-0.5">
                          <span>Started: {ch.started_date || 'Today'}</span>
                          <span>{ch.remaining_days || 0} days remaining</span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Footer Stats & Actions */}
                  <div className="mt-3 pt-3 border-t border-slate-100 space-y-3">
                    <div className="flex items-center justify-between text-xs font-bold">
                      <span className="text-[#D97706] flex items-center gap-1 font-black">
                        <Zap className="w-3.5 h-3.5 fill-[#FFB547]" />
                        +{ch.xp_reward} XP
                      </span>
                      <span className="text-slate-500 text-[11px]">
                        Badge: <strong className="text-slate-800">{ch.badge_name}</strong>
                      </span>
                    </div>

                    {/* Action Button */}
                    <div className="flex items-center gap-2">
                      {!ch.is_joined ? (
                        <Button
                          variant="primary"
                          size="sm"
                          disabled={isProcessing}
                          onClick={() => handleJoin(ch.id)}
                          className="w-full rounded-xl py-2 font-black text-xs shadow-xs"
                        >
                          Join Challenge
                        </Button>
                      ) : isFailed ? (
                        <div className="flex items-center gap-2 w-full">
                          <Button
                            variant="primary"
                            size="sm"
                            disabled={isProcessing}
                            onClick={() => handleJoin(ch.id)}
                            className="flex-1 rounded-xl py-2 font-black text-xs"
                          >
                            Restart Challenge
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={isProcessing}
                            onClick={() => setChallengeToLeave(ch)}
                            className="rounded-xl py-2 text-rose-600 hover:bg-rose-50 border-rose-200"
                            title="Leave Challenge"
                          >
                            <LogOut className="w-4 h-4" />
                          </Button>
                        </div>
                      ) : isCompleted ? (
                        <Button
                          variant="outline"
                          size="sm"
                          disabled
                          className="w-full rounded-xl py-2 font-black text-xs text-emerald-700 bg-emerald-50 border-emerald-200 cursor-default"
                        >
                          ✓ Completed & Claimed
                        </Button>
                      ) : (
                        <div className="flex items-center gap-2 w-full">
                          <Button
                            variant="outline"
                            size="sm"
                            disabled
                            className="flex-1 rounded-xl py-2 font-black text-xs text-[#6C5CE7] bg-[#6C5CE7]/10 border-[#6C5CE7]/20 cursor-default"
                          >
                            Active ({ch.completed_days || 0}d Done)
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={isProcessing}
                            onClick={() => setChallengeToLeave(ch)}
                            className="rounded-xl py-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 border-slate-200"
                            title="Leave Challenge"
                          >
                            <LogOut className="w-4 h-4" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}

        {/* Leave Confirmation Modal */}
        <Modal
          isOpen={Boolean(challengeToLeave)}
          onClose={() => setChallengeToLeave(null)}
          title="Leave Challenge?"
          description="Are you sure you want to leave this sprint?"
        >
          <div className="space-y-4 text-xs text-slate-600">
            <p>
              Leaving <strong>{challengeToLeave?.title}</strong> will stop tracking your progress for this quest.
              You can rejoin anytime to restart your sprint.
            </p>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setChallengeToLeave(null)}
                className="rounded-xl"
              >
                Keep Challenge
              </Button>
              <Button
                variant="danger"
                size="sm"
                disabled={isProcessing}
                onClick={confirmLeave}
                className="rounded-xl font-black"
              >
                Confirm & Leave
              </Button>
            </div>
          </div>
        </Modal>
      </div>
    </AppLayout>
  );
}
