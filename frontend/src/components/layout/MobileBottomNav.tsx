import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  CheckSquare,
  Trophy,
  Swords,
  Settings,
} from 'lucide-react';

export const MobileBottomNav: React.FC = () => {
  const navItems = [
    { to: '/', label: 'Today', icon: LayoutDashboard },
    { to: '/habits', label: 'Habits', icon: CheckSquare },
    { to: '/progress', label: 'Progress', icon: Trophy },
    { to: '/challenges', label: 'Quests', icon: Swords },
    { to: '/settings', label: 'Settings', icon: Settings },
  ];

  return (
    <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200/90 px-2 py-1.5 shadow-[0_-2px_10px_rgba(0,0,0,0.05)]">
      <nav className="flex items-center justify-around max-w-lg mx-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex flex-col items-center justify-center min-w-[56px] min-h-[48px] py-1 px-2 rounded-2xl text-[10px] font-black transition-all select-none ${
                  isActive
                    ? 'text-[#6C5CE7] scale-105'
                    : 'text-slate-400 hover:text-slate-700 active:scale-95'
                }`
              }
            >
              <div className="relative">
                <Icon className="w-5 h-5 stroke-[2.2]" />
              </div>
              <span className="mt-0.5 tracking-tight">{item.label}</span>
            </NavLink>
          );
        })}
      </nav>
    </div>
  );
};
