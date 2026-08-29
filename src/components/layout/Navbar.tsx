'use client';

import React from 'react';
import Link from 'next/link';
import { DayForgeLogo } from '../common/DayForgeLogo';
import { Menu, X } from 'lucide-react';

interface NavbarProps {
  onMobileMenuToggle?: () => void;
  isMobileMenuOpen?: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  onMobileMenuToggle,
  isMobileMenuOpen = false,
}) => {
  return (
    // Only rendered on mobile devices (< lg). On desktop, the sidebar provides complete navigation and profile access.
    <header className="lg:hidden sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-xs transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-14 sm:h-16">
          {/* Left: Mobile Navigation Trigger */}
          <button
            type="button"
            onClick={onMobileMenuToggle}
            className="w-11 h-11 flex items-center justify-center rounded-2xl text-slate-700 hover:bg-slate-100 active:bg-slate-200 transition-colors focus:outline-none"
            aria-label="Open navigation menu"
          >
            {isMobileMenuOpen ? <X className="w-6 h-6 stroke-[2.2]" /> : <Menu className="w-6 h-6 stroke-[2.2]" />}
          </button>

          {/* Center: Official DayForge Logo */}
          <Link href="/" className="inline-flex items-center justify-center py-1">
            <DayForgeLogo size="md" />
          </Link>

          {/* Right Spacer for balanced centering */}
          <div className="w-11 h-11" />
        </div>
      </div>
    </header>
  );
};
