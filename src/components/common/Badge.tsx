'use client';

import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'purple' | 'gold' | 'success' | 'danger' | 'warning' | 'outline';
  size?: 'sm' | 'md';
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'default',
  size = 'md',
  className,
  ...props
}) => {
  const variants = {
    default:
      'bg-slate-100 text-slate-700 border border-slate-200/80',
    purple:
      'bg-[#6C5CE7]/10 text-[#6C5CE7] border border-[#6C5CE7]/30',
    gold:
      'bg-[#FFB547]/15 text-[#D97706] border border-[#FFB547]/30',
    success:
      'bg-emerald-50 text-emerald-700 border border-emerald-200',
    danger:
      'bg-rose-50 text-rose-700 border border-rose-200',
    warning:
      'bg-amber-50 text-amber-700 border border-amber-200',
    outline:
      'bg-transparent border border-slate-300 text-slate-600',
  };

  const sizes = {
    sm: 'text-[10px] px-2 py-0.5 font-bold rounded-lg',
    md: 'text-xs px-2.5 py-1 font-bold rounded-xl',
  };

  return (
    <span
      className={twMerge(
        clsx(
          'inline-flex items-center gap-1 leading-none tracking-tight select-none',
          variants[variant],
          sizes[size],
          className
        )
      )}
      {...props}
    >
      {children}
    </span>
  );
};
