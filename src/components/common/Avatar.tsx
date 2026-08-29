'use client';

import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { getAvatarSvgSrc } from '../../utils/avatars';

interface AvatarProps {
  src?: string | null;
  name: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  className?: string;
  level?: number;
  glow?: boolean;
}

const sizeClasses = {
  xs: 'w-6 h-6 text-[10px]',
  sm: 'w-8 h-8 text-xs',
  md: 'w-10 h-10 text-sm',
  lg: 'w-12 h-12 text-base',
  xl: 'w-16 h-16 text-xl',
  '2xl': 'w-20 h-20 text-2xl',
};

export const Avatar: React.FC<AvatarProps> = ({
  src,
  name,
  size = 'md',
  className,
  level,
  glow = false,
}) => {
  const getInitials = (n: string) => {
    if (!n) return 'U';
    const parts = n.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  const resolvedSrc = getAvatarSvgSrc(src);

  return (
    <div className="relative inline-flex shrink-0">
      <div
        className={twMerge(
          clsx(
            'rounded-2xl overflow-hidden flex items-center justify-center font-black transition-transform duration-200 border select-none',
            glow
              ? 'ring-2 ring-[#6C5CE7] shadow-[0_0_15px_rgba(108,92,231,0.35)] border-[#6C5CE7]'
              : 'border-slate-200 bg-slate-50',
            sizeClasses[size],
            className
          )
        )}
      >
        {resolvedSrc ? (
          <img
            src={resolvedSrc}
            alt={name || 'Avatar'}
            className="w-full h-full object-cover"
            onError={(e) => {
              (e.target as HTMLElement).style.display = 'none';
            }}
          />
        ) : (
          <div className="w-full h-full bg-[#6C5CE7]/10 text-[#6C5CE7] flex items-center justify-center font-black">
            {getInitials(name)}
          </div>
        )}
      </div>

      {/* Level Tag Overlay */}
      {typeof level === 'number' && level > 0 && (
        <span className="absolute -bottom-1 -right-1 bg-[#6C5CE7] text-white text-[9px] font-black px-1.5 py-0.2 rounded-md shadow-xs border border-white">
          Lv.{level}
        </span>
      )}
    </div>
  );
};
