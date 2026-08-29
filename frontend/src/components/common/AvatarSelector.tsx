import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, Sparkles, User } from 'lucide-react';
import { MALE_AVATARS, FEMALE_AVATARS, AvatarOption } from '../../utils/avatars';

interface AvatarSelectorProps {
  selectedAvatarId?: string | null;
  onSelect: (avatarId: string) => void;
  title?: string;
  subtitle?: string;
}

export const AvatarSelector: React.FC<AvatarSelectorProps> = ({
  selectedAvatarId,
  onSelect,
  title = 'Choose Your 3D Avatar',
  subtitle = 'Pick a polished 3D identity that represents your journey',
}) => {
  const [genderTab, setGenderTab] = useState<'male' | 'female'>('male');

  const currentAvatars = genderTab === 'male' ? MALE_AVATARS : FEMALE_AVATARS;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="text-center space-y-1">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#6C5CE7]/10 border border-[#6C5CE7]/20 text-[#6C5CE7] text-xs font-black">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Realistic 3D Characters</span>
        </div>
        <h3 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
          {title}
        </h3>
        <p className="text-xs sm:text-sm font-semibold text-slate-500 dark:text-slate-400 max-w-md mx-auto">
          {subtitle}
        </p>
      </div>

      {/* Gender Switcher Tabs */}
      <div className="flex items-center justify-center">
        <div className="inline-flex p-1 bg-slate-100 dark:bg-[#1E2232] border border-slate-200/80 dark:border-[#2E3348] rounded-2xl">
          <button
            type="button"
            onClick={() => setGenderTab('male')}
            className={`flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-bold transition-all ${
              genderTab === 'male'
                ? 'bg-[#6C5CE7] text-white shadow-md shadow-[#6C5CE7]/25 font-black'
                : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span>Male (10)</span>
          </button>

          <button
            type="button"
            onClick={() => setGenderTab('female')}
            className={`flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-bold transition-all ${
              genderTab === 'female'
                ? 'bg-[#6C5CE7] text-white shadow-md shadow-[#6C5CE7]/25 font-black'
                : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span>Female (10)</span>
          </button>
        </div>
      </div>

      {/* Avatars Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 max-h-[380px] overflow-y-auto p-1.5 no-scrollbar">
        <AnimatePresence mode="wait">
          {currentAvatars.map((avatar: AvatarOption) => {
            const isSelected = selectedAvatarId === avatar.id;
            return (
              <motion.button
                key={avatar.id}
                type="button"
                onClick={() => onSelect(avatar.id)}
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.96 }}
                className={`relative flex flex-col items-center p-3 rounded-3xl transition-all text-center select-none group border ${
                  isSelected
                    ? 'border-[#6C5CE7] bg-[#6C5CE7]/5 dark:bg-[#6C5CE7]/15 ring-2 ring-[#6C5CE7]/30 shadow-[0_0_15px_rgba(108,92,231,0.35)]'
                    : 'border-slate-200/80 dark:border-[#2E3348] bg-white dark:bg-[#181B26] hover:border-[#6C5CE7]/40 hover:shadow-soft'
                }`}
              >
                {/* Selection Checkmark Indicator Badge */}
                {isSelected && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute -top-1.5 -right-1.5 w-6 h-6 rounded-full bg-[#6C5CE7] text-white flex items-center justify-center shadow-md shadow-[#6C5CE7]/40 z-10"
                  >
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                  </motion.div>
                )}

                {/* Avatar 3D Preview */}
                <div className="w-16 h-16 sm:w-18 sm:h-18 rounded-2xl overflow-hidden mb-2 relative shadow-xs">
                  <img
                    src={avatar.svg}
                    alt={avatar.name}
                    className="w-full h-full object-cover transition-transform group-hover:scale-105"
                    loading="lazy"
                  />
                </div>

                {/* Avatar Label */}
                <span
                  className={`text-xs font-black tracking-tight truncate w-full block ${
                    isSelected
                      ? 'text-[#6C5CE7] dark:text-white'
                      : 'text-slate-800 dark:text-slate-200'
                  }`}
                >
                  {avatar.name}
                </span>
                <span className="text-[10px] font-semibold text-slate-400 dark:text-slate-400 truncate w-full block">
                  {avatar.category}
                </span>
              </motion.button>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Feedback notice */}
      <p className="text-[11px] text-center text-slate-400 font-medium italic">
        💡 Your realistic 3D avatar will represent your level progress, streak completions, and character sheet.
      </p>
    </div>
  );
};
