'use client';

import React, { useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { useTodos, TodoItem } from '@/context/TodoContext';
import { TodoCard } from '@/components/todos/TodoCard';
import { TodoModal } from '@/components/todos/TodoModal';
import { Button } from '@/components/common/Button';
import { Card } from '@/components/common/Card';
import { Plus, CheckSquare, Sparkles, Filter, Search } from 'lucide-react';
import { formatDate } from '@/lib/streakEngine';

export default function TodosPage() {
  const { todos, stats, isLoading } = useTodos();

  const [activeTab, setActiveTab] = useState<'all' | 'today' | 'upcoming' | 'overdue' | 'completed'>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [todoToEdit, setTodoToEdit] = useState<TodoItem | null>(null);

  const todayStr = formatDate(new Date());

  const filteredTodos = todos.filter((todo) => {
    // Tab filter
    if (activeTab === 'today') {
      if (todo.completed || todo.due_date !== todayStr) return false;
    } else if (activeTab === 'upcoming') {
      if (todo.completed || !todo.due_date || todo.due_date <= todayStr) return false;
    } else if (activeTab === 'overdue') {
      if (todo.completed || !todo.due_date || todo.due_date >= todayStr) return false;
    } else if (activeTab === 'completed') {
      if (!todo.completed) return false;
    }

    // Category filter
    if (selectedCategory !== 'All' && todo.category !== selectedCategory) {
      return false;
    }

    // Search filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const matchTitle = todo.title.toLowerCase().includes(q);
      const matchDesc = todo.description?.toLowerCase().includes(q);
      if (!matchTitle && !matchDesc) return false;
    }

    return true;
  });

  const categories = ['All', 'General', 'Work', 'Study', 'Personal', 'Urgent', 'Health'];

  return (
    <AppLayout>
      <div className="space-y-6 max-w-4xl mx-auto text-slate-900 pb-12">
        {/* Header & Primary Action Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3.5">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                <CheckSquare className="w-7 h-7 text-[#6C5CE7]" />
                To-Do List
              </h1>
              {stats.pending > 0 && (
                <span className="text-xs font-black text-[#6C5CE7] bg-[#6C5CE7]/10 border border-[#6C5CE7]/20 px-2.5 py-0.5 rounded-full">
                  {stats.pending} Pending
                </span>
              )}
            </div>
            <p className="text-xs sm:text-sm font-semibold text-slate-500 mt-1">
              Capture tasks, assign due dates, and set smart reminders.
            </p>
          </div>

          <Button
            variant="primary"
            size="md"
            onClick={() => {
              setTodoToEdit(null);
              setIsModalOpen(true);
            }}
            leftIcon={<Plus className="w-4 h-4 stroke-[2.5]" />}
            className="rounded-2xl px-5 font-black text-xs shadow-md shadow-[#6C5CE7]/20 min-h-[44px] justify-center"
          >
            Add Task
          </Button>
        </div>

        {/* Stats Summary Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3">
          <div className="bg-white border border-slate-200/90 rounded-2xl p-3 sm:p-3.5 shadow-xs">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
              Today Due
            </span>
            <span className="text-lg sm:text-xl font-black text-[#6C5CE7] mt-0.5 block">
              {stats.today}
            </span>
          </div>

          <div className="bg-white border border-slate-200/90 rounded-2xl p-3 sm:p-3.5 shadow-xs">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
              Overdue
            </span>
            <span className="text-lg sm:text-xl font-black text-rose-600 mt-0.5 block">
              {stats.overdue}
            </span>
          </div>

          <div className="bg-white border border-slate-200/90 rounded-2xl p-3 sm:p-3.5 shadow-xs">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
              Total Pending
            </span>
            <span className="text-lg sm:text-xl font-black text-slate-900 mt-0.5 block">
              {stats.pending}
            </span>
          </div>

          <div className="bg-white border border-slate-200/90 rounded-2xl p-3 sm:p-3.5 shadow-xs">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
              Completed
            </span>
            <span className="text-lg sm:text-xl font-black text-emerald-600 mt-0.5 block">
              {stats.completed}
            </span>
          </div>
        </div>

        {/* Filter Pills & Search */}
        <div className="space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            {/* Status Tabs */}
            <div className="flex items-center gap-1 bg-slate-100 border border-slate-200/80 p-1 rounded-2xl overflow-x-auto text-xs font-bold no-scrollbar">
              {[
                { id: 'all', label: `All (${todos.length})` },
                { id: 'today', label: `Today (${stats.today})` },
                { id: 'upcoming', label: 'Upcoming' },
                { id: 'overdue', label: `Overdue (${stats.overdue})` },
                { id: 'completed', label: `Completed (${stats.completed})` },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`px-3 py-1.5 rounded-xl capitalize transition-all whitespace-nowrap min-h-[32px] ${
                    activeTab === tab.id
                      ? 'bg-white text-slate-900 shadow-xs font-black'
                      : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Search Input */}
            <div className="relative min-w-[200px]">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <Search className="w-3.5 h-3.5" />
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search tasks..."
                className="w-full pl-8 pr-3 py-1.5 bg-white border border-slate-200/90 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:border-[#6C5CE7]"
              />
            </div>
          </div>

          {/* Category Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar text-xs font-bold">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1 rounded-xl whitespace-nowrap transition-all text-[11px] ${
                  selectedCategory === cat
                    ? 'bg-slate-900 text-white shadow-xs font-black'
                    : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Task Cards List */}
        {isLoading ? (
          <div className="py-12 text-center text-xs font-bold text-slate-400 animate-pulse">
            Loading tasks...
          </div>
        ) : filteredTodos.length === 0 ? (
          <Card className="p-10 text-center bg-white border border-slate-200/90 rounded-3xl shadow-soft space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-[#6C5CE7]/10 text-[#6C5CE7] flex items-center justify-center mx-auto shadow-xs">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-900">
                {activeTab === 'completed'
                  ? 'No completed tasks in this view'
                  : 'No tasks found'}
              </h3>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto font-medium">
                {activeTab === 'completed'
                  ? 'Check off pending tasks to see them completed here.'
                  : 'Add a new task to stay organized and check things off.'}
              </p>
            </div>
            {activeTab !== 'completed' && (
              <Button
                size="sm"
                variant="primary"
                onClick={() => {
                  setTodoToEdit(null);
                  setIsModalOpen(true);
                }}
                leftIcon={<Plus className="w-4 h-4 stroke-[2.5]" />}
                className="mt-2 min-h-[40px] font-black"
              >
                Create Task
              </Button>
            )}
          </Card>
        ) : (
          <div className="space-y-3">
            {filteredTodos.map((todo) => (
              <TodoCard
                key={todo.id}
                todo={todo}
                onEdit={(t) => {
                  setTodoToEdit(t);
                  setIsModalOpen(true);
                }}
              />
            ))}
          </div>
        )}

        {/* Modal */}
        <TodoModal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setTodoToEdit(null);
          }}
          todoToEdit={todoToEdit}
        />
      </div>
    </AppLayout>
  );
}
