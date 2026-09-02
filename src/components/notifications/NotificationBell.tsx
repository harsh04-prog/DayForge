'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useNotifications } from '../../context/NotificationContext';
import { HabitIcon } from '../common/IconHelper';
import {
  Bell,
  CheckCircle2,
  Clock,
  X,
  Sparkles,
  Moon,
  CheckCheck,
  ExternalLink,
  Zap,
  Droplet,
  Coffee
} from 'lucide-react';

export const NotificationBell: React.FC = () => {
  const {
    notifications,
    budget,
    unreadCount,
    markAsRead,
    markAllAsRead,
    dismissNotification,
    snoozeNotification,
    completeFromNotification,
    requestBrowserPermission,
  } = useNotifications();

  const [isOpen, setIsOpen] = useState(false);
  const [activeFilter, setActiveFilter] = useState<'all' | 'habits' | 'wellness' | 'progress' | 'routine'>('all');
  const [snoozeOpenId, setSnoozeOpenId] = useState<number | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSnoozeOpenId(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleNotificationClick = (actionUrl?: string | null, id?: number) => {
    if (id) markAsRead(id);
    if (actionUrl) {
      router.push(actionUrl);
      setIsOpen(false);
    }
  };

  const filteredNotifications = notifications.filter((n) => {
    if (activeFilter === 'all') return true;
    return n.category === activeFilter;
  });

  const sentCount = budget?.sent_today_count ?? 0;
  const maxBudget = budget?.max_daily_budget ?? 12;

  const renderCategoryIcon = (iconName: string, category: string) => {
    switch (category) {
      case 'wellness':
        return <Droplet className="w-4 h-4 text-cyan-500" />;
      case 'routine':
        return <Coffee className="w-4 h-4 text-[#FFB547]" />;
      case 'progress':
        return <Zap className="w-4 h-4 text-[#6C5CE7]" />;
      default:
        return <HabitIcon name={iconName} className="w-4 h-4 text-[#6C5CE7]" />;
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Trigger Button */}
      <button
        onClick={() => {
          setIsOpen(!isOpen);
          requestBrowserPermission();
        }}
        className="relative p-2 text-slate-600  hover:text-slate-900  hover:bg-slate-100  rounded-2xl transition-colors focus:outline-none"
        aria-label="Companion Notifications"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 flex h-4 w-4">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-4 w-4 bg-rose-500 text-[10px] font-black text-white items-center justify-center shadow-xs">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          </span>
        )}
      </button>

      {/* Notification Center Tray */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 mt-2 w-[calc(100vw-32px)] sm:w-[420px] max-w-[420px] bg-white rounded-3xl shadow-2xl border border-slate-200/90 z-50 overflow-hidden"
          >
            {/* Top Companion Header & Daily Budget */}
            <div className="p-4 border-b border-slate-100 bg-slate-50/70">
              <div className="flex items-center justify-between gap-2 mb-2">
                <div className="flex items-center gap-2">
                  <span className="font-black text-sm text-slate-900">DayForge Companion</span>
                  {unreadCount > 0 && (
                    <span className="px-2 py-0.5 bg-rose-500 text-white text-[10px] font-black rounded-full shadow-xs">
                      {unreadCount} new
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  {unreadCount > 0 && (
                    <button
                      onClick={markAllAsRead}
                      className="text-[11px] font-bold text-slate-500 hover:text-[#6C5CE7]  flex items-center gap-1 transition-colors"
                      title="Mark all as read"
                    >
                      <CheckCheck className="w-3.5 h-3.5" />
                      Mark all
                    </button>
                  )}
                </div>
              </div>

              {/* 12-Daily Budget Meter & Spacing indicator */}
              <div className="flex items-center justify-between text-[11px] font-semibold text-slate-600  bg-white  p-2 rounded-xl border border-slate-200/70  shadow-xs">
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span>Daily Budget: <strong>{sentCount} / {maxBudget}</strong> used</span>
                </div>
                {budget?.quiet_hours_active ? (
                  <span className="flex items-center gap-1 text-amber-500 text-[10px] font-bold">
                    <Moon className="w-3 h-3" /> Quiet Hours Active
                  </span>
                ) : (
                  <span className="text-[10px] text-slate-400">Spaced ~2h</span>
                )}
              </div>

              {/* Category Filter Pills */}
              <div className="flex items-center gap-1.5 mt-3 overflow-x-auto pb-0.5 no-scrollbar">
                {[
                  { id: 'all', label: 'All' },
                  { id: 'habits', label: 'Habits' },
                  { id: 'wellness', label: 'Wellness' },
                  { id: 'progress', label: 'Progress' },
                  { id: 'routine', label: 'Routine' },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveFilter(tab.id as any)}
                    className={`px-2.5 py-1 rounded-xl text-[11px] font-bold transition-all whitespace-nowrap ${
                      activeFilter === tab.id
                        ? 'bg-[#6C5CE7] text-white shadow-xs font-black'
                        : 'bg-slate-200/60  text-slate-600  hover:bg-slate-200 '
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Notification Items List */}
            <div className="max-h-[380px] overflow-y-auto divide-y divide-slate-100 ">
              {filteredNotifications.length === 0 ? (
                <div className="py-12 px-4 text-center space-y-2">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-50  text-emerald-600  flex items-center justify-center mx-auto">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <p className="text-xs font-bold text-slate-800 ">You're completely in sync!</p>
                  <p className="text-[11px] text-slate-400 max-w-[240px] mx-auto font-medium">
                    The companion will deliver the next high-leverage suggestion at your next scheduled window.
                  </p>
                </div>
              ) : (
                filteredNotifications.map((notif) => (
                  <div
                    key={notif.id}
                    className="p-4 hover:bg-slate-50  transition-colors space-y-2.5"
                  >
                    <div className="flex items-start justify-between gap-3">
                      {/* Category Icon */}
                      <div className="w-9 h-9 rounded-xl bg-[#6C5CE7]/10  border border-[#6C5CE7]/20 flex items-center justify-center shrink-0 shadow-xs">
                        {renderCategoryIcon(notif.icon, notif.category)}
                      </div>

                      {/* Content */}
                      <div
                        className="flex-1 cursor-pointer"
                        onClick={() => handleNotificationClick(notif.action_url, notif.id)}
                      >
                        <div className="flex items-center gap-1.5 mb-0.5">
                          {notif.priority === 'high' && (
                            <span className="px-1.5 py-0.2 bg-rose-50  text-rose-600  border border-rose-200  text-[9px] font-black uppercase rounded-sm">
                              Priority
                            </span>
                          )}
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider capitalize">
                            {notif.category}
                          </span>
                        </div>

                        <h4 className="text-xs font-black text-slate-900  leading-snug flex items-center gap-1">
                          {notif.title}
                          {notif.action_url && (
                            <ExternalLink className="w-3 h-3 text-slate-400 opacity-60 inline" />
                          )}
                        </h4>
                        <p className="text-[11px] font-medium text-slate-600  mt-0.5 leading-relaxed">
                          {notif.message}
                        </p>
                      </div>

                      {/* Dismiss button */}
                      <button
                        onClick={() => dismissNotification(notif.id)}
                        className="text-slate-400 hover:text-slate-600  p-1 rounded-lg hover:bg-slate-200/50 "
                        title="Dismiss"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Action Bar */}
                    <div className="flex items-center justify-between pt-1 gap-2 border-t border-slate-100 ">
                      {/* Snooze Trigger */}
                      <div className="relative">
                        <button
                          onClick={() =>
                            setSnoozeOpenId(snoozeOpenId === notif.id ? null : notif.id)
                          }
                          className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-500  hover:text-slate-800  px-2 py-1 rounded-lg hover:bg-slate-100  transition-colors"
                        >
                          <Clock className="w-3 h-3" />
                          Snooze
                        </button>

                        {/* Snooze Popup */}
                        {snoozeOpenId === notif.id && (
                          <div className="absolute left-0 bottom-8 bg-white  border border-slate-200  rounded-xl shadow-xl p-1.5 z-50 flex flex-col gap-1 w-28">
                            <button
                              onClick={() => {
                                snoozeNotification(notif.id, 15);
                                setSnoozeOpenId(null);
                              }}
                              className="text-[11px] font-bold text-left px-2 py-1 hover:bg-slate-100  rounded-lg text-slate-700 "
                            >
                              In 15 mins
                            </button>
                            <button
                              onClick={() => {
                                snoozeNotification(notif.id, 30);
                                setSnoozeOpenId(null);
                              }}
                              className="text-[11px] font-bold text-left px-2 py-1 hover:bg-slate-100  rounded-lg text-slate-700 "
                            >
                              In 30 mins
                            </button>
                            <button
                              onClick={() => {
                                snoozeNotification(notif.id, 60);
                                setSnoozeOpenId(null);
                              }}
                              className="text-[11px] font-bold text-left px-2 py-1 hover:bg-slate-100  rounded-lg text-slate-700 "
                            >
                              In 1 hour
                            </button>
                          </div>
                        )}
                      </div>

                      {/* Action Button */}
                      <button
                        onClick={() => completeFromNotification(notif.id)}
                        className="inline-flex items-center gap-1 px-3 py-1 bg-emerald-50  hover:bg-emerald-100  text-emerald-700  text-[11px] font-black rounded-xl border border-emerald-200/80  transition-colors"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        {notif.habit_id ? 'Complete (+10 XP)' : 'Done'}
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Footer */}
            <div className="p-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
              <span className="text-[11px] text-slate-500 font-semibold">
                Daily Reminders & Check-in Alerts
              </span>
              <span className="text-[10px] text-[#6C5CE7] font-black uppercase tracking-wider">
                Active
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

