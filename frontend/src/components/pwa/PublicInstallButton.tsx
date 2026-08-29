import React from 'react';
import { usePWA } from '../../context/PWAContext';
import { Download } from 'lucide-react';

interface PublicInstallButtonProps {
  variant?: 'outline' | 'primary' | 'ghost' | 'header';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const PublicInstallButton: React.FC<PublicInstallButtonProps> = ({
  variant = 'outline',
  size = 'sm',
  className = '',
}) => {
  const { isInstalled, promptInstall, openInstallGuide, isInstallable } = usePWA();

  // If already installed, don't show the button
  if (isInstalled) return null;

  const handleClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (isInstallable) {
      const installed = await promptInstall();
      if (!installed) {
        openInstallGuide();
      }
    } else {
      openInstallGuide();
    }
  };

  const baseStyles =
    'inline-flex items-center justify-center gap-1.5 font-bold transition-all duration-200 select-none cursor-pointer rounded-2xl min-h-[40px] focus:outline-none';

  const sizeStyles = {
    sm: 'text-xs px-3.5 py-2',
    md: 'text-xs sm:text-sm px-4 py-2.5 min-h-[44px]',
    lg: 'text-sm sm:text-base px-6 py-3 min-h-[48px]',
  }[size];

  const variantStyles = {
    outline:
      'bg-white hover:bg-slate-50 text-slate-700 border border-slate-200/90 hover:border-[#6C5CE7]/40 hover:text-[#6C5CE7] shadow-xs active:bg-slate-100',
    primary:
      'bg-[#6C5CE7] hover:bg-[#5b4cc4] text-white shadow-md shadow-[#6C5CE7]/25 active:scale-98',
    ghost:
      'text-slate-600 hover:text-[#6C5CE7] hover:bg-[#6C5CE7]/10 active:bg-[#6C5CE7]/15',
    header:
      'bg-white/80 hover:bg-white text-[#6C5CE7] border border-[#6C5CE7]/30 hover:border-[#6C5CE7] shadow-xs active:scale-98 font-black',
  }[variant];

  return (
    <button
      type="button"
      onClick={handleClick}
      className={`${baseStyles} ${sizeStyles} ${variantStyles} ${className}`}
      title="Install DayForge as an App on your phone or desktop"
      aria-label="Install DayForge App"
    >
      <Download className="w-4 h-4 shrink-0 text-[#6C5CE7]" />
      <span>Install App</span>
    </button>
  );
};
