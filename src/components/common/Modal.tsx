'use client';

import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children: React.ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl';
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  description,
  children,
  maxWidth = 'md',
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  const maxWidths = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-2xl',
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-4 md:p-6 overflow-hidden">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs transition-opacity"
          />

          {/* Modal Dialog Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 15 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className={`relative w-full ${maxWidths[maxWidth]} max-h-[92dvh] sm:max-h-[88vh] bg-white border border-slate-200/90 rounded-3xl shadow-2xl flex flex-col overflow-hidden z-10`}
          >
            {/* Sticky Header */}
            {(title || description) && (
              <div className="px-4 sm:px-6 pt-5 pb-3.5 border-b border-slate-100 bg-white/95 backdrop-blur-md shrink-0 flex items-start justify-between gap-3 z-20">
                <div className="min-w-0 flex-1">
                  {title && (
                    <h3 className="text-base sm:text-lg font-black text-slate-900 tracking-tight truncate">
                      {title}
                    </h3>
                  )}
                  {description && (
                    <p className="text-[11px] sm:text-xs font-semibold text-slate-500 mt-0.5 line-clamp-2">
                      {description}
                    </p>
                  )}
                </div>

                <button
                  type="button"
                  onClick={onClose}
                  className="text-slate-400 hover:text-slate-700 p-1.5 rounded-xl hover:bg-slate-100 active:bg-slate-200 transition-colors shrink-0 focus:outline-none"
                  aria-label="Close modal"
                >
                  <X className="w-5 h-5 stroke-[2.2]" />
                </button>
              </div>
            )}

            {/* Scrollable Content Body */}
            <div className="p-4 sm:p-6 overflow-y-auto overscroll-contain flex-1">
              {children}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
