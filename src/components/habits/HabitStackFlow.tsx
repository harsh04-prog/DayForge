'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '../common/Card';
import { Button } from '../common/Button';
import { Modal } from '../common/Modal';
import { HabitStack, Habit } from '../../types';
import { api } from '../../services/api';
import { Layers, ArrowRight, Plus, Trash2 } from 'lucide-react';
import { useToast } from '../../context/ToastContext';

interface HabitStackFlowProps {
  habits: Habit[];
}

export const HabitStackFlow: React.FC<HabitStackFlowProps> = ({ habits }) => {
  const [stacks, setStacks] = useState<HabitStack[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [triggerId, setTriggerId] = useState<number>(habits[0]?.id || 0);
  const [actionId, setActionId] = useState<number>(habits[1]?.id || 0);
  const { showSuccess, showError } = useToast();

  const fetchStacks = async () => {
    try {
      setIsLoading(true);
      const res = await api.get<HabitStack[]>('/habits/stacks/all');
      setStacks(res.data);
    } catch (err) {
      console.error('Failed to load stacks', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStacks();
  }, []);

  const handleCreateStack = async (e: React.FormEvent) => {
    e.preventDefault();
    if (triggerId === actionId) {
      showError('Invalid Stack', 'Please select two different habits to chain together.');
      return;
    }

    try {
      await api.post('/habits/stacks', {
        trigger_habit_id: triggerId,
        action_habit_id: actionId,
      });
      showSuccess('Habit Stack Created', 'Habits linked successfully!');
      setIsModalOpen(false);
      fetchStacks();
    } catch (err: any) {
      showError('Error', err.response?.data?.detail || 'Failed to create stack.');
    }
  };

  const handleDeleteStack = async (id: number) => {
    try {
      await api.delete(`/habits/stacks/${id}`);
      setStacks((prev) => prev.filter((s) => s.id !== id));
      showSuccess('Stack Removed', 'Habit chain unlinked.');
    } catch {
      showError('Error', 'Failed to delete stack.');
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-black text-slate-900  tracking-tight flex items-center gap-2">
            <Layers className="w-5 h-5 text-[#6C5CE7]" />
            Habit Stacking Chains
          </h3>
          <p className="text-xs text-slate-500  mt-0.5">
            Anchor a new habit to an already established routine to make execution automatic.
          </p>
        </div>

        {habits.length >= 2 && (
          <Button
            size="sm"
            variant="outline"
            leftIcon={<Plus className="w-4 h-4" />}
            onClick={() => {
              setTriggerId(habits[0].id);
              setActionId(habits[1].id);
              setIsModalOpen(true);
            }}
            className="rounded-2xl font-bold"
          >
            New Stack
          </Button>
        )}
      </div>

      {stacks.length === 0 ? (
        <Card className="bg-slate-50/70  border-dashed border-slate-300  text-center py-8">
          <Layers className="w-8 h-8 text-slate-400 mx-auto mb-2 opacity-60" />
          <h4 className="text-sm font-bold text-slate-700 ">No habit chains created yet</h4>
          <p className="text-xs text-slate-500  mt-1 max-w-sm mx-auto">
            Stack habits like: "After I [Drink 2L Water], I will immediately [Read 20 Pages]".
          </p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {stacks.map((stk) => (
            <Card
              key={stk.id}
              className="p-5 bg-white  border border-slate-200/90  shadow-soft flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-3">
                  <span className="text-[10px] font-black uppercase tracking-wider text-[#6C5CE7] bg-[#6C5CE7]/10  px-2 py-0.5 rounded-md">
                    Habit Stack Flow
                  </span>
                  <button
                    type="button"
                    onClick={() => handleDeleteStack(stk.id)}
                    className="text-slate-400 hover:text-rose-600  p-1 rounded-lg transition-colors"
                    title="Remove Stack"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="flex items-center gap-3 my-2">
                  <div className="flex-1 p-3 rounded-2xl bg-slate-50  border border-slate-200/80 ">
                    <span className="text-[10px] text-slate-400 font-bold uppercase block">Trigger Habit</span>
                    <span className="text-xs font-black text-slate-900  truncate block mt-0.5">
                      {stk.trigger_habit_name || `Habit #${stk.trigger_habit_id}`}
                    </span>
                  </div>

                  <ArrowRight className="w-4 h-4 text-[#6C5CE7] shrink-0" />

                  <div className="flex-1 p-3 rounded-2xl bg-slate-50  border border-slate-200/80 ">
                    <span className="text-[10px] text-slate-400 font-bold uppercase block">Next Habit</span>
                    <span className="text-xs font-black text-slate-900  truncate block mt-0.5">
                      {stk.action_habit_name || `Habit #${stk.action_habit_id}`}
                    </span>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Create Stack Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Create Habit Stack Chain"
        description="Link two habits together into an effortless automatic sequence."
      >
        <form onSubmit={handleCreateStack} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700  uppercase tracking-wider mb-1.5">
              1. When I Complete (Trigger):
            </label>
            <select
              value={triggerId}
              onChange={(e) => setTriggerId(Number(e.target.value))}
              className="w-full px-4 py-2.5 bg-slate-50  border border-slate-200  rounded-2xl text-sm font-semibold text-slate-900  focus:outline-none focus:border-[#6C5CE7]"
            >
              {habits.map((h) => (
                <option key={h.id} value={h.id} className="bg-white  text-slate-900 ">
                  {h.name} ({h.category})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700  uppercase tracking-wider mb-1.5">
              2. I Will Immediately Do (Action):
            </label>
            <select
              value={actionId}
              onChange={(e) => setActionId(Number(e.target.value))}
              className="w-full px-4 py-2.5 bg-slate-50  border border-slate-200  rounded-2xl text-sm font-semibold text-slate-900  focus:outline-none focus:border-[#6C5CE7]"
            >
              {habits.map((h) => (
                <option key={h.id} value={h.id} className="bg-white  text-slate-900 ">
                  {h.name} ({h.category})
                </option>
              ))}
            </select>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 ">
            <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" className="font-black">
              Link Habits
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};


