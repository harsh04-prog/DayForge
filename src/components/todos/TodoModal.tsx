'use client';

import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { useTodos, TodoItem } from '../../context/TodoContext';
import { Calendar, Bell, Flag, Tag } from 'lucide-react';
import { formatDate } from '../../lib/streakEngine';

interface TodoModalProps {
  isOpen: boolean;
  onClose: () => void;
  todoToEdit?: TodoItem | null;
}

const CATEGORIES = ['General', 'Work', 'Study', 'Personal', 'Urgent', 'Health'];

export const TodoModal: React.FC<TodoModalProps> = ({ isOpen, onClose, todoToEdit }) => {
  const { createTodo, updateTodo } = useTodos();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [reminderEnabled, setReminderEnabled] = useState(false);
  const [reminderTime, setReminderTime] = useState('09:00');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [category, setCategory] = useState('General');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (todoToEdit) {
      setTitle(todoToEdit.title);
      setDescription(todoToEdit.description || '');
      setDueDate(todoToEdit.due_date || '');
      setReminderEnabled(Boolean(todoToEdit.reminder_enabled || todoToEdit.reminder_time));
      setReminderTime(todoToEdit.reminder_time || '09:00');
      setPriority(todoToEdit.priority || 'medium');
      setCategory(todoToEdit.category || 'General');
    } else {
      setTitle('');
      setDescription('');
      setDueDate(formatDate(new Date()));
      setReminderEnabled(false);
      setReminderTime('09:00');
      setPriority('medium');
      setCategory('General');
    }
    setError('');
  }, [todoToEdit, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Please enter a task title.');
      return;
    }

    setIsSubmitting(true);
    setError('');

    const payload: Partial<TodoItem> = {
      title: title.trim(),
      description: description.trim() || undefined,
      due_date: dueDate || undefined,
      reminder_enabled: reminderEnabled,
      reminder_time: reminderEnabled ? reminderTime : undefined,
      priority,
      category,
    };

    try {
      if (todoToEdit) {
        await updateTodo(todoToEdit.id, payload);
      } else {
        await createTodo(payload);
      }
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to save task.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={todoToEdit ? 'Edit Task' : 'Add New Task'}
      description="Capture what needs to get done today or schedule ahead."
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="bg-rose-50 border border-rose-200 text-rose-600 text-xs font-bold p-3 rounded-2xl flex items-center gap-2">
            <span>⚠️</span>
            <span>{error}</span>
          </div>
        )}

        {/* Task Title */}
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
            Task Title
          </label>
          <input
            type="text"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Complete math chapter, Submit project report, Buy groceries..."
            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-slate-900 focus:outline-none focus:border-[#6C5CE7] focus:ring-2 focus:ring-[#6C5CE7]/20 placeholder:text-slate-400"
            maxLength={120}
          />
        </div>

        {/* Due Date & Category */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-[#6C5CE7]" />
              Due Date
            </label>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-900 focus:outline-none focus:border-[#6C5CE7]"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1">
              <Tag className="w-3.5 h-3.5 text-[#6C5CE7]" />
              Category
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-900 focus:outline-none focus:border-[#6C5CE7]"
            >
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Priority Selector */}
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1">
            <Flag className="w-3.5 h-3.5 text-[#6C5CE7]" />
            Priority Level
          </label>
          <div className="grid grid-cols-3 gap-2 p-1 bg-slate-100 rounded-2xl border border-slate-200/80">
            {(['low', 'medium', 'high'] as const).map((p) => (
              <button
                type="button"
                key={p}
                onClick={() => setPriority(p)}
                className={`py-1.5 text-xs font-bold rounded-xl capitalize transition-all ${
                  priority === p
                    ? p === 'high'
                      ? 'bg-rose-500 text-white shadow-xs font-black'
                      : p === 'medium'
                      ? 'bg-[#6C5CE7] text-white shadow-xs font-black'
                      : 'bg-slate-700 text-white shadow-xs font-black'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                {p}
              </button>
            ))}
          </div>
        </div>

        {/* Reminder Time Schedule */}
        <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bell className="w-4 h-4 text-[#6C5CE7]" />
              <span className="text-xs font-bold text-slate-900">Task Reminder Notification</span>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={reminderEnabled}
                onChange={(e) => setReminderEnabled(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#6C5CE7]"></div>
            </label>
          </div>

          {reminderEnabled && (
            <div className="pt-2 border-t border-slate-200/80 flex items-center justify-between gap-3">
              <span className="text-xs text-slate-600 font-medium">Notification Time</span>
              <input
                type="time"
                value={reminderTime}
                onChange={(e) => setReminderTime(e.target.value)}
                className="px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:border-[#6C5CE7]"
              />
            </div>
          )}
        </div>

        {/* Description */}
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
            Notes / Details (Optional)
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Add relevant links, sub-notes, or key details..."
            rows={2}
            className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-semibold text-slate-900 focus:outline-none focus:border-[#6C5CE7] placeholder:text-slate-400"
          />
        </div>

        {/* Modal Submit Actions */}
        <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
          <Button type="button" variant="ghost" onClick={onClose} className="min-h-[40px]">
            Cancel
          </Button>
          <Button type="submit" variant="primary" isLoading={isSubmitting} className="font-black min-h-[40px] px-6">
            {todoToEdit ? 'Save Changes' : 'Add Task'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
