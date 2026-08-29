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
      'bg-slate-100 dark:bg-[#1E2232] text-slate-700 dark:text-slate-300 border border-slate-200/80 dark:border-[#2E3348]',
    purple:
      'bg-[#6C5CE7]/10 dark:bg-[#6C5CE7]/20 text-[#6C5CE7] dark:text-[#A29BFE] border border-[#6C5CE7]/30',
    gold:
      'bg-[#FFB547]/15 dark:bg-[#FFB547]/20 text-[#D97706] dark:text-[#FFB547] border border-[#FFB547]/30',
    success:
      'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20',
    danger:
      'bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-500/20',
    warning:
      'bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-500/20',
    outline:
      'bg-transparent border border-slate-300 dark:border-[#2E3348] text-slate-600 dark:text-slate-400',
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
