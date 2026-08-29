'use client';

import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

interface DayForgeLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'navbar';
  className?: string;
  showTagline?: boolean;
}

export const DayForgeLogo: React.FC<DayForgeLogoProps> = ({
  size = 'md',
  className,
}) => {
  const heightStyles = {
    sm: 'h-7 sm:h-8',
    md: 'h-9 sm:h-11',
    lg: 'h-12 sm:h-14',
    xl: 'h-14 sm:h-16',
    '2xl': 'h-16 sm:h-20',
    navbar: 'h-10 sm:h-12 md:h-14',
  };

  return (
    <div
      className={twMerge(
        clsx(
          'inline-flex items-center justify-center select-none shrink-0 transition-transform duration-200 hover:scale-[1.02]',
          className
        )
      )}
    >
      <img
        src="/dayforge-logo.png"
        alt="DayForge — Build habits. Level yourself."
        className={clsx('w-auto object-contain shrink-0 drop-shadow-xs', heightStyles[size])}
        loading="eager"
      />
    </div>
  );
};

