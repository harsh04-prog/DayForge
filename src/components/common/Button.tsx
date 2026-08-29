'use client';

import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'gold' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = 'primary',
      size = 'md',
      isLoading = false,
      disabled,
      leftIcon,
      rightIcon,
      children,
      ...props
    },
    ref
  ) => {
    const baseStyles =
      'inline-flex items-center justify-center font-bold tracking-tight rounded-2xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none select-none';

    const variants = {
      // Royal Purple Primary Accent
      primary:
        'bg-[#6C5CE7] hover:bg-[#5A48DE] text-white shadow-md shadow-[#6C5CE7]/25 focus:ring-[#6C5CE7]/40 border border-transparent font-black',
      // Warm Gold Secondary Accent
      gold:
        'bg-[#FFB547] hover:bg-[#E59F33] text-slate-900 shadow-md shadow-[#FFB547]/25 focus:ring-[#FFB547]/40 border border-transparent font-black',
      secondary:
        'bg-slate-100 text-slate-800 hover:bg-slate-200 border border-slate-200/80 focus:ring-slate-400',
      outline:
        'bg-transparent border border-slate-300 text-slate-700 hover:bg-slate-100 focus:ring-slate-400',
      ghost:
        'bg-transparent text-slate-600 hover:bg-slate-100 hover:text-slate-900 focus:ring-slate-400',
      danger:
        'bg-rose-500 hover:bg-rose-600 text-white shadow-sm focus:ring-rose-400 border border-transparent',
    };

    const sizes = {
      sm: 'text-xs px-3.5 py-1.5 gap-1.5',
      md: 'text-sm px-4.5 py-2.5 gap-2',
      lg: 'text-base px-6 py-3.5 gap-2.5',
    };

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={twMerge(clsx(baseStyles, variants[variant], sizes[size], className))}
        {...props}
      >
        {isLoading ? (
          <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin shrink-0" />
        ) : (
          leftIcon && <span className="shrink-0">{leftIcon}</span>
        )}
        {children}
        {!isLoading && rightIcon && <span className="shrink-0">{rightIcon}</span>}
      </button>
    );
  }
);

Button.displayName = 'Button';
