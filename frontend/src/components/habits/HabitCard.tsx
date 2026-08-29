import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Habit } from '../../types';
import { HabitIcon } from '../common/IconHelper';
import { Badge } from '../common/Badge';
import {
  Flame,
  MoreVertical,
  Edit2,
  Pause,
  Play,
  Archive,
  Trash2,
  ExternalLink,
} from 'lucide-react';
import { useHabits } from '../../context/HabitContext';

interface HabitCardProps {
  habit: Habit;
  onEdit: (habit: Habit) => void;
}

export const HabitCard: React.FC<HabitCardProps> = ({ habit, onEdit }) => {
  const { pauseHabit, resumeHabit, archiveHabit, deleteHabit } = useHabits();
  const [menuOpen, setMenuOpen] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleDelete = async () => {
    await deleteHabit(habit.id);
    setShowDeleteConfirm(false);
  };

  return (
    <div
      className={`relative bg-white border rounded-3xl p-4 sm:p-5 shadow-soft transition-all duration-200 hover:shadow-soft-lg flex flex-col justify-between ${
        habit.is_paused
          ? 'opacity-65 bg-slate-50/70 border-slate-200'
          : 'border-slate-200/90 hover:border-[#6C5CE7]/40'
      }`}
    >
      <div>
        {/* Header Row: Icon + Title + Menu */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-start gap-3 sm:gap-3.5 min-w-0 flex-1">
            <div
              className="w-12 h-12 rounded-2xl flex items-center justify-center text-[#6C5CE7] shadow-xs shrink-0"
              style={{
                backgroundColor: `${habit.color || '#6C5CE7'}18`,
                color: habit.color || '#6C5CE7',
              }}
            >
              <HabitIcon name={habit.icon} className="w-6 h-6 shrink-0" />
            </div>

            <div className="min-w-0 flex-1 space-y-1">
              <Link
                to={`/habits/${habit.id}`}
                className="font-black text-base text-slate-900 hover:text-[#6C5CE7] transition-colors flex items-center gap-1.5 line-clamp-2 break-words leading-snug"
              >
                <span>{habit.name}</span>
                <ExternalLink className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 text-slate-400 shrink-0" />
              </Link>

              <div className="flex items-center gap-1.5 flex-wrap">
                <Badge size="sm" variant="default" className="text-[10px] py-0.5 px-2">
                  {habit.category}
                </Badge>
                {habit.is_paused && (
                  <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full">
                    Paused
                  </span>
                )}
                <span className="text-[11px] font-bold text-slate-400 capitalize">
                  {habit.preferred_time}
                </span>
              </div>
            </div>
          </div>

          {/* Menu Dropdown Button (min 44px touch area) */}
          <div className="relative shrink-0">
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="w-10 h-10 flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 active:bg-slate-200 rounded-2xl transition-colors"
              aria-label="Habit options"
            >
              <MoreVertical className="w-5 h-5" />
            </button>

            {menuOpen && (
              <>
                <div className="fixed inset-0 z-20" onClick={() => setMenuOpen(false)} />
                <div className="absolute right-0 mt-1 w-48 bg-white border border-slate-200 rounded-2xl shadow-xl py-1.5 z-30 animate-in fade-in zoom-in-95 duration-100">
                  <button
                    onClick={() => {
                      setMenuOpen(false);
                      onEdit(habit);
                    }}
                    className="w-full text-left px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 flex items-center gap-2.5 min-h-[40px]"
                  >
                    <Edit2 className="w-4 h-4 text-slate-400" />
                    Edit Habit
                  </button>

                  {habit.is_paused ? (
                    <button
                      onClick={() => {
                        setMenuOpen(false);
                        resumeHabit(habit.id);
                      }}
                      className="w-full text-left px-4 py-2.5 text-xs font-bold text-emerald-700 hover:bg-emerald-50 flex items-center gap-2.5 min-h-[40px]"
                    >
                      <Play className="w-4 h-4 text-emerald-500" />
                      Resume Habit
                    </button>
                  ) : (
                    <button
                      onClick={() => {
                        setMenuOpen(false);
                        pauseHabit(habit.id);
                      }}
                      className="w-full text-left px-4 py-2.5 text-xs font-bold text-amber-700 hover:bg-amber-50 flex items-center gap-2.5 min-h-[40px]"
                    >
                      <Pause className="w-4 h-4 text-amber-500" />
                      Pause Habit
                    </button>
                  )}

                  <button
                    onClick={() => {
                      setMenuOpen(false);
                      archiveHabit(habit.id);
                    }}
                    className="w-full text-left px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 flex items-center gap-2.5 min-h-[40px]"
                  >
                    <Archive className="w-4 h-4 text-slate-400" />
                    Archive
                  </button>

                  <div className="border-t border-slate-100 my-1" />

                  <button
                    onClick={() => {
                      setMenuOpen(false);
                      setShowDeleteConfirm(true);
                    }}
                    className="w-full text-left px-4 py-2.5 text-xs font-bold text-rose-600 hover:bg-rose-50 flex items-center gap-2.5 min-h-[40px]"
                  >
                    <Trash2 className="w-4 h-4 text-rose-500" />
                    Delete
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Description if present */}
        {habit.description && (
          <p className="text-xs text-slate-500 line-clamp-2 mb-3">
            {habit.description}
          </p>
        )}
      </div>

      {/* Footer Stats Row */}
      <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
        <div className="flex items-center gap-1.5 font-bold text-[#D97706]">
          <Flame className="w-3.5 h-3.5 fill-[#FFB547]" />
          <span>{habit.current_streak}d streak</span>
          <span className="text-slate-400 font-normal">| best {habit.longest_streak}d</span>
        </div>

        <Link
          to={`/habits/${habit.id}`}
          className="font-black text-[#6C5CE7] hover:underline flex items-center gap-1 text-xs py-1"
        >
          <span>View Insights →</span>
        </Link>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <h4 className="text-lg font-black text-slate-900">Delete Habit?</h4>
            <p className="text-xs text-slate-500 mt-1.5 mb-5">
              Are you sure you want to delete "{habit.name}"? Historical logs will be removed.
            </p>
            <div className="flex items-center justify-end gap-2.5">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-2xl min-h-[44px]"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="px-4 py-2.5 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-2xl shadow-xs min-h-[44px]"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
