'use client';

import React, { useState } from 'react';
import { Sidebar } from './Sidebar';
import { Navbar } from './Navbar';
import { MobileBottomNav } from './MobileBottomNav';
import { NotificationBell } from '../notifications/NotificationBell';

export const AppLayout: React.FC<{ children?: React.ReactNode }> = ({ children }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#F8F9FC] text-slate-900 flex flex-col selection:bg-[#6C5CE7] selection:text-white">
      <div className="flex-1 flex w-full">
        {/* Desktop Fixed Sidebar */}
        <div className="hidden lg:block shrink-0 h-screen sticky top-0">
          <Sidebar />
        </div>

        {/* Mobile Drawer Backdrop & Sidebar */}
        {isMobileMenuOpen && (
          <div className="lg:hidden fixed inset-0 z-50 flex">
            <div
              className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-200"
              onClick={() => setIsMobileMenuOpen(false)}
            />
            <div className="relative w-72 sm:w-80 bg-white h-full shadow-2xl z-10 animate-in slide-in-from-left duration-200">
              <Sidebar
                onCloseMobile={() => setIsMobileMenuOpen(false)}
                isMobileDrawer={true}
              />
            </div>
          </div>
        )}

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0 pb-24 lg:pb-10">
          <Navbar
            isMobileMenuOpen={isMobileMenuOpen}
            onMobileMenuToggle={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          />

          {/* Desktop Top Header with Notification Bell */}
          <header className="hidden lg:flex items-center justify-between px-8 py-3 bg-white/80 backdrop-blur-md border-b border-slate-200/70 sticky top-0 z-30">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                DayForge Focus
              </span>
            </div>

            <div className="flex items-center gap-3">
              <NotificationBell />
            </div>
          </header>

          <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-6xl w-full mx-auto">
            {children}
          </main>
        </div>
      </div>

      {/* Fixed Mobile Bottom Navigation */}
      <MobileBottomNav />
    </div>
  );
};
