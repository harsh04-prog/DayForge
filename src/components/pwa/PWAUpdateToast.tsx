'use client';

import React from 'react';
import { usePWA } from '../../context/PWAContext';
import { Button } from '../common/Button';
import { RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const PWAUpdateToast: React.FC = () => {
  const { isUpdateAvailable, applyUpdate } = usePWA();

  if (!isUpdateAvailable) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="fixed top-4 left-4 right-4 sm:left-auto sm:right-6 sm:max-w-md z-50"
      >
        <div className="bg-white border border-[#6C5CE7]/30 rounded-3xl p-4 shadow-2xl flex items-center justify-between gap-3 ring-2 ring-[#6C5CE7]/20">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#6C5CE7]/10 flex items-center justify-center text-[#6C5CE7] shrink-0">
              <RefreshCw className="w-5 h-5 animate-spin" />
            </div>
            <div>
              <h4 className="text-xs font-black text-slate-900 leading-tight">
                New version available
              </h4>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Update DayForge to get the latest features.
              </p>
            </div>
          </div>

          <Button
            size="sm"
            variant="primary"
            onClick={applyUpdate}
            className="font-black text-xs rounded-xl px-3.5 py-1.5 min-h-[36px] shadow-xs shrink-0"
          >
            Update
          </Button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

