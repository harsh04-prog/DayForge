'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  CheckSquare,
  ListTodo,
  Trophy,
  Swords,
  Settings,
} from 'lucide-react';
import { useTodos } from '../../context/TodoContext';

export const MobileBottomNav: React.FC = () => {
  const pathname = usePathname();
  const { stats } = useTodos();

  const navItems = [
    { to: '/', label: 'Today', icon: LayoutDashboard },
    { to: '/todos', label: 'To-Do', icon: ListTodo, badge: stats.pending > 0 ? stats.pending : undefined },
    { to: '/habits', label: 'Habits', icon: CheckSquare },
    { to: '/challenges', label: 'Quests', icon: Swords },
    { to: '/settings', label: 'Settings', icon: Settings },
  ];

  return (
    <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200/90 px-2 py-1.5 shadow-[0_-2px_10px_rgba(0,0,0,0.05)]">
      <nav className="flex items-center justify-around max-w-lg mx-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.to || (item.to !== '/' && pathname.startsWith(item.to));
          return (
            <Link
              key={item.to}
              href={item.to}
              className={`flex flex-col items-center justify-center min-w-[56px] min-h-[48px] py-1 px-2 rounded-2xl text-[10px] font-black transition-all select-none relative ${
                isActive
                  ? 'text-[#6C5CE7] scale-105'
                  : 'text-slate-400 hover:text-slate-700 active:scale-95'
              }`}
            >
              <div className="relative">
                <Icon className="w-5 h-5 stroke-[2.2]" />
                {item.badge !== undefined && (
                  <span className="absolute -top-1.5 -right-2 px-1.5 py-0.2 bg-[#6C5CE7] text-white text-[8px] font-black rounded-full shadow-xs">
                    {item.badge}
                  </span>
                )}
              </div>
              <span className="mt-0.5 tracking-tight">{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
};
