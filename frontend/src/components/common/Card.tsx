import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  hoverEffect?: boolean;
  interactive?: boolean;
  bordered?: boolean;
}

export const Card: React.FC<CardProps> = ({
  children,
  className,
  hoverEffect = false,
  interactive = false,
  bordered = true,
  ...props
}) => {
  return (
    <div
      className={twMerge(
        clsx(
          'rounded-3xl p-5 transition-all duration-200',
          'bg-white dark:bg-[#181B26]',
          bordered && 'border border-slate-200/80 dark:border-[#2E3348]',
          'shadow-soft dark:shadow-[0_4px_20px_rgba(0,0,0,0.25)]',
          hoverEffect && 'hover:shadow-soft-lg hover:border-[#6C5CE7]/30 dark:hover:border-[#6C5CE7]/40 hover:-translate-y-0.5',
          interactive && 'cursor-pointer select-none active:scale-[0.99]',
          className
        )
      )}
      {...props}
    >
      {children}
    </div>
  );
};
