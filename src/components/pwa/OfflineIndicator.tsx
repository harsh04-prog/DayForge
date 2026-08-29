'use client';

import React from 'react';
import { usePWA } from '../../context/PWAContext';
import { WifiOff } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const OfflineIndicator: React.FC = () => {
  const { isOnline } = usePWA();

  if (isOnline) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, height: 0 }}
        animate={{ opacity: 1, height: 'auto' }}
        exit={{ opacity: 0, height: 0 }}
        className="bg-amber-500 text-white text-xs font-bold py-1.5 px-4 text-center flex items-center justify-center gap-2 z-50 sticky top-0 shadow-xs"
      >
        <WifiOff className="w-3.5 h-3.5" />
        <span>You're offline. Cached features are available; changes will sync when reconnected.</span>
      </motion.div>
    </AnimatePresence>
  );
};

