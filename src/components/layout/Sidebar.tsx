'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  CheckSquare,
  ListTodo,
  Trophy,
  BarChart2,
  Swords,
  CalendarCheck2,
  Settings,
  Flame,
  LogOut,
  X,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useHabits } from '../../context/HabitContext';
import { useTodos } from '../../context/TodoContext';
import { Avatar } from '../common/Avatar';
import { DayForgeLogo } from '../common/DayForgeLogo';

interface SidebarProps {
  onCloseMobile?: () => void;
  isMobileDrawer?: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({ onCloseMobile, isMobileDrawer = false }) => {
  const { user, profile, logout } = useAuth();
  const { dashboardData } = useHabits();
  const { stats } = useTodos();
  const pathname = usePathname();

  const streak = dashboardData?.active_streak || 0;
  const level = profile?.level || 1;

  const navItems = [
    { to: '/', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/todos', label: 'To-Do List', icon: ListTodo, badge: stats.pending > 0 ? stats.pending : undefined },
    { to: '/habits', label: 'All Habits', icon: CheckSquare },
    { to: '/progress', label: 'Progression & XP', icon: Trophy },
    { to: '/analytics', label: 'Analytics', icon: BarChart2 },
    { to: '/challenges', label: 'Challenges', icon: Swords },
    { to: '/weekly-review', label: 'Weekly Review', icon: CalendarCheck2 },
    { to: '/settings', label: 'Settings & Profile', icon: Settings },
  ];

  return (
    <aside className="w-72 sm:w-80 lg:w-64 h-full bg-white border-r border-slate-200/80 flex flex-col justify-between p-4 sm:p-5 overflow-y-auto">
      {/* Top Header with Brand Logo & Mobile Close Button */}
      <div className="space-y-6">
        <div className="flex items-center justify-between px-1 pt-1">
          <Link href="/" onClick={onCloseMobile} className="inline-block group">
            <DayForgeLogo size="md" />
          </Link>

          {isMobileDrawer && (
            <button
              type="button"
              onClick={onCloseMobile}
              className="lg:hidden w-10 h-10 flex items-center justify-center rounded-2xl text-slate-500 hover:bg-slate-100 active:bg-slate-200 transition-colors"
              aria-label="Close navigation drawer"
            >
              <X className="w-5 h-5 stroke-[2.2]" />
            </button>
          )}
        </div>

        {/* Mobile User Summary Banner */}
        {isMobileDrawer && (
          <div className="p-3.5 rounded-3xl bg-slate-50 border border-slate-200/80 flex items-center gap-3">
            <Avatar
              src={profile?.avatar_url}
              name={user?.full_name || 'Hero'}
              size="md"
              level={level}
              glow
            />
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-1">
                <span className="text-xs font-black text-slate-900 truncate">
                  {user?.full_name}
                </span>
                <span className="text-[10px] font-black text-[#6C5CE7] bg-[#6C5CE7]/10 px-1.5 py-0.5 rounded-md shrink-0">
                  Lv.{level}
                </span>
              </div>
              <div className="flex items-center gap-2 mt-0.5 text-[11px] text-slate-500 font-semibold">
                <span className="flex items-center gap-1 text-[#D97706] font-black">
                  <Flame className="w-3.5 h-3.5 fill-[#FFB547]" />
                  {streak}d
                </span>
                <span>•</span>
                <span className="text-slate-500">{profile?.xp || 0} XP</span>
              </div>
            </div>
          </div>
        )}

        {/* Navigation Items (minimum 44px touch targets) */}
        <nav className="space-y-1.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.to || (item.to !== '/' && pathname.startsWith(item.to));
            return (
              <Link
                key={item.to}
                href={item.to}
                onClick={onCloseMobile}
                className={`flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-bold transition-all duration-150 select-none min-h-[44px] ${
                  isActive
                    ? 'bg-[#6C5CE7] text-white shadow-md shadow-[#6C5CE7]/20 font-black'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 active:bg-slate-200'
                }`}
              >
                <Icon className="w-4 h-4 shrink-0 stroke-[2.2]" />
                <span className="flex-1 truncate">{item.label}</span>
                {item.badge !== undefined && (
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-black shrink-0 ${
                      isActive
                        ? 'bg-white text-[#6C5CE7]'
                        : 'bg-[#6C5CE7]/10 text-[#6C5CE7] border border-[#6C5CE7]/20'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Footer Area: Character Profile Card & Logout Button */}
      <div className="pt-4 border-t border-slate-200/80 space-y-2">
        <div className="flex items-center gap-2">
          <Link
            href="/progress"
            onClick={onCloseMobile}
            className="flex items-center gap-2.5 p-2.5 rounded-2xl bg-slate-50 border border-slate-200/80 hover:border-[#6C5CE7]/40 hover:bg-white transition-all group shadow-xs min-h-[44px] flex-1 min-w-0"
            title="View Character Progression"
          >
            <Avatar
              src={profile?.avatar_url}
              name={user?.full_name || 'Hero'}
              size="sm"
              level={level}
              glow
            />
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-slate-900 truncate">
                  {user?.full_name?.split(' ')[0] || user?.username}
                </span>
                <span className="text-[10px] font-black text-[#6C5CE7] bg-[#6C5CE7]/10 px-1.5 py-0.5 rounded-md shrink-0">
                  Lv.{level}
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-[10px] text-slate-500 font-semibold truncate">
                <span className="text-[#D97706] font-black">{streak}d</span>
                <span>•</span>
                <span className="truncate">{profile?.xp || 0} XP</span>
              </div>
            </div>
          </Link>

          {/* Dedicated Logout Action Button */}
          <button
            type="button"
            onClick={() => {
              if (onCloseMobile) onCloseMobile();
              logout();
            }}
            className="w-11 h-11 flex items-center justify-center rounded-2xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 border border-slate-200/80 transition-colors shrink-0"
            title="Log Out"
            aria-label="Log Out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
};
