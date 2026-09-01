'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Check, Calendar, Bell, Edit3, Trash2, Clock, AlertCircle } from 'lucide-react';
import { TodoItem, useTodos } from '../../context/TodoContext';
import { formatDate } from '../../lib/streakEngine';

interface TodoCardProps {
  todo: TodoItem;
  onEdit: (todo: TodoItem) => void;
}

export const TodoCard: React.FC<TodoCardProps> = ({ todo, onEdit }) => {
  const { toggleTodo, deleteTodo } = useTodos();

  const todayStr = formatDate(new Date());
  const isOverdue = !todo.completed && todo.due_date && todo.due_date < todayStr;
  const isToday = todo.due_date === todayStr;

  const getPriorityColor = (p?: string) => {
    switch (p) {
      case 'high':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      case 'medium':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      default:
        return 'bg-slate-100 text-slate-600 border-slate-200';
    }
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.2 }}
      className={`group w-full rounded-3xl p-4 sm:p-5 transition-all duration-200 border flex items-start justify-between gap-3.5 ${
        todo.completed
          ? 'bg-slate-50/70 border-slate-200/60 opacity-60 shadow-xs'
          : isOverdue
          ? 'bg-rose-50/30 border-rose-200/80 hover:border-rose-300 shadow-soft'
          : 'bg-white border-slate-200/90 hover:border-[#6C5CE7]/40 hover:shadow-soft'
      }`}
    >
      {/* Checkbox Tick Button */}
      <button
        type="button"
        onClick={() => toggleTodo(todo.id)}
        className={`w-7 h-7 sm:w-8 sm:h-8 rounded-xl flex items-center justify-center shrink-0 transition-all select-none mt-0.5 ${
          todo.completed
            ? 'bg-[#10B981] text-white shadow-xs'
            : 'border-2 border-slate-300 hover:border-[#6C5CE7] hover:bg-[#6C5CE7]/10'
        }`}
        aria-label={todo.completed ? 'Mark task pending' : 'Mark task completed'}
      >
        {todo.completed && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 500, damping: 25 }}
          >
            <Check className="w-4 h-4 sm:w-5 sm:h-5 stroke-[3]" />
          </motion.div>
        )}
      </button>

      {/* Task Content Column */}
      <div className="flex-1 min-w-0 space-y-1.5">
        <div className="flex items-center gap-2 flex-wrap">
          {todo.priority && (
            <span
              className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md border ${getPriorityColor(
                todo.priority
              )}`}
            >
              {todo.priority}
            </span>
          )}

          {todo.category && (
            <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
              {todo.category}
            </span>
          )}

          {isToday && !todo.completed && (
            <span className="text-[10px] font-black text-[#6C5CE7] bg-[#6C5CE7]/10 border border-[#6C5CE7]/20 px-2 py-0.5 rounded-md flex items-center gap-1">
              <Clock className="w-3 h-3" /> Due Today
            </span>
          )}

          {isOverdue && (
            <span className="text-[10px] font-black text-rose-600 bg-rose-100/70 border border-rose-200 px-2 py-0.5 rounded-md flex items-center gap-1">
              <AlertCircle className="w-3 h-3" /> Overdue
            </span>
          )}
        </div>

        <h3
          className={`font-black text-sm sm:text-base tracking-tight leading-snug break-words ${
            todo.completed ? 'line-through text-slate-400' : 'text-slate-900'
          }`}
        >
          {todo.title}
        </h3>

        {todo.description && (
          <p
            className={`text-xs font-medium leading-relaxed break-words ${
              todo.completed ? 'line-through text-slate-300' : 'text-slate-500'
            }`}
          >
            {todo.description}
          </p>
        )}

        {/* Due Date & Reminder Footer */}
        <div className="flex items-center gap-3 pt-1 text-[11px] font-semibold text-slate-400 flex-wrap">
          {todo.due_date && (
            <div className="flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" />
              <span>{todo.due_date}</span>
            </div>
          )}

          {todo.reminder_enabled && todo.reminder_time && (
            <div className="flex items-center gap-1 text-[#6C5CE7] font-bold">
              <Bell className="w-3 h-3" />
              <span>{todo.reminder_time}</span>
            </div>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-1 shrink-0 opacity-80 sm:opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          type="button"
          onClick={() => onEdit(todo)}
          className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors"
          title="Edit task"
        >
          <Edit3 className="w-4 h-4" />
        </button>

        <button
          type="button"
          onClick={() => deleteTodo(todo.id)}
          className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"
          title="Delete task"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </motion.div>
  );
};
