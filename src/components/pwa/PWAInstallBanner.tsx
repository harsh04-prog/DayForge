'use client';

import React from 'react';
import { usePWA } from '../../context/PWAContext';
import { Button } from '../common/Button';
import { Download, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const PWAInstallBanner: React.FC = () => {
  const { showInstallBanner, promptInstall, dismissInstallBanner, isInstallable } = usePWA();

  if (!showInstallBanner || !isInstallable) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 30 }}
        className="fixed bottom-20 lg:bottom-6 left-4 right-4 sm:left-auto sm:right-6 sm:max-w-md z-40"
      >
        <div className="bg-white border border-slate-200/90 rounded-3xl p-4 sm:p-5 shadow-2xl backdrop-blur-md relative flex items-start gap-3.5">
          {/* App Icon Mark */}
          <div className="w-12 h-12 rounded-2xl bg-[#F8F9FC] border border-slate-200/80 p-1.5 flex items-center justify-center shrink-0 shadow-xs">
            <img
              src="/icons/icon-192x192.png"
              alt="DayForge App"
              className="w-full h-full object-contain"
            />
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between gap-1">
              <h4 className="text-sm font-black text-slate-900 leading-tight">
                Install DayForge
              </h4>
              <button
                type="button"
                onClick={dismissInstallBanner}
                className="w-7 h-7 flex items-center justify-center rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                aria-label="Dismiss install prompt"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-slate-500 mt-0.5 leading-snug">
              Add DayForge to your home screen for a faster app-like experience.
            </p>

            {/* Action Buttons */}
            <div className="flex items-center gap-2 mt-3">
              <Button
                size="sm"
                variant="primary"
                onClick={promptInstall}
                leftIcon={<Download className="w-3.5 h-3.5" />}
                className="font-black text-xs rounded-xl px-4 py-2 min-h-[36px] shadow-xs"
              >
                Install
              </Button>
              <button
                type="button"
                onClick={dismissInstallBanner}
                className="text-xs font-bold text-slate-500 hover:text-slate-800 px-3 py-2 rounded-xl transition-colors min-h-[36px]"
              >
                Not now
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

