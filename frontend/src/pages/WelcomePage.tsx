import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Sparkles, Flame, Trophy, ArrowRight, Zap } from 'lucide-react';
import { Button } from '../components/common/Button';
import { DayForgeLogo } from '../components/common/DayForgeLogo';
import { PublicInstallButton } from '../components/pwa/PublicInstallButton';

export const WelcomePage: React.FC = () => {
  const featureCards = [
    {
      icon: <Flame className="w-5 h-5 text-[#FFB547]" />,
      title: 'Reliable Streak Engine',
      description: 'Streaks designed for human life, featuring smart streak shields and schedule flexibility.',
    },
    {
      icon: <Sparkles className="w-5 h-5 text-[#6C5CE7]" />,
      title: 'Character Progression',
      description: 'Earn XP from genuine habit completions. Advance from Beginner to Master.',
    },
    {
      icon: <Trophy className="w-5 h-5 text-[#FFB547]" />,
      title: 'Achievements & Badges',
      description: 'Unlock milestone badges and celebrate compounding consistency.',
    },
    {
      icon: <Zap className="w-5 h-5 text-[#6C5CE7]" />,
      title: 'Real Behavioral Insights',
      description: 'Yearly heatmaps, automated weekly reviews, and intelligent companion reminders.',
    },
  ];

  return (
    <div className="min-h-screen bg-[#F8F9FC] text-slate-900 flex flex-col justify-between selection:bg-[#6C5CE7] selection:text-white">
      {/* Top Bar */}
      <header className="px-4 sm:px-6 py-4 sm:py-5 max-w-7xl mx-auto w-full flex items-center justify-between">
        <Link to="/" className="inline-block group">
          <DayForgeLogo size="md" />
        </Link>

        <div className="flex items-center gap-2 sm:gap-3">
          {/* Public PWA Install Button */}
          <PublicInstallButton variant="header" size="sm" className="hidden sm:inline-flex" />

          <Link to="/login">
            <Button variant="ghost" size="sm" className="font-bold text-slate-700 min-h-[40px]">
              Sign In
            </Button>
          </Link>
          <Link to="/register">
            <Button variant="primary" size="sm" className="font-black rounded-2xl shadow-md shadow-[#6C5CE7]/25 min-h-[40px]">
              Get Started
            </Button>
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-16 md:py-20 text-center flex-1 flex flex-col items-center justify-center relative">
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="space-y-5 sm:space-y-6 max-w-3xl relative z-10"
        >
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#6C5CE7]/10 border border-[#6C5CE7]/25 text-[#6C5CE7] text-xs font-black shadow-xs">
            <Sparkles className="w-4 h-4 text-[#6C5CE7]" />
            <span>The Character Sheet For Your Real Life</span>
          </div>

          <h1 className="text-3xl sm:text-5xl md:text-6xl font-black text-slate-900 tracking-tight leading-[1.15]">
            Build habits. <br />
            <span className="text-[#6C5CE7]">
              Level yourself.
            </span>
          </h1>

          <p className="text-sm sm:text-base md:text-lg text-slate-600 max-w-2xl mx-auto font-medium leading-relaxed">
            DayForge turns personal development into a clean, motivating progression system. Complete real habits, maintain unbroken streaks, unlock achievements, and level up your life without clutter.
          </p>

          {/* Emotional Loop Badge */}
          <div className="p-3 bg-white border border-slate-200/80 rounded-2xl shadow-soft flex flex-wrap items-center justify-center gap-2 text-xs font-bold text-slate-700 max-w-xl mx-auto">
            <span>Set Goal</span>
            <span className="text-slate-300">→</span>
            <span>Complete Habit</span>
            <span className="text-slate-300">→</span>
            <span className="text-[#FFB547]">Earn XP</span>
            <span className="text-slate-300">→</span>
            <span className="text-[#FFB547]">Maintain Streak</span>
            <span className="text-slate-300">→</span>
            <span className="text-[#6C5CE7] font-black">Level Up</span>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-3">
            <Link to="/register" className="w-full sm:w-auto">
              <Button
                size="lg"
                variant="primary"
                className="w-full sm:w-auto px-8 font-black rounded-2xl shadow-md shadow-[#6C5CE7]/30 text-base min-h-[48px]"
                rightIcon={<ArrowRight className="w-5 h-5 stroke-[2.5]" />}
              >
                Start Forging Free
              </Button>
            </Link>

            {/* Install App Button in Hero */}
            <PublicInstallButton
              variant="outline"
              size="lg"
              className="w-full sm:w-auto px-6 font-black rounded-2xl min-h-[48px]"
            />
          </div>
        </motion.div>

        {/* Feature Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-12 sm:mt-16 w-full text-left">
          {featureCards.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 * i, duration: 0.3 }}
              className="p-5 rounded-3xl bg-white border border-slate-200/90 shadow-soft hover:shadow-soft-lg hover:border-[#6C5CE7]/40 transition-all group"
            >
              <div className="w-10 h-10 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform shadow-xs">
                {f.icon}
              </div>
              <h3 className="text-sm font-black text-slate-900 tracking-tight">
                {f.title}
              </h3>
              <p className="text-xs text-slate-500 font-medium mt-1 leading-snug">
                {f.description}
              </p>
            </motion.div>
          ))}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200/80 py-6 text-center text-xs text-slate-500 font-semibold max-w-7xl mx-auto w-full px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
        <p>© 2026 DayForge. Build habits. Level yourself.</p>
        <div className="flex items-center gap-4">
          <PublicInstallButton variant="ghost" size="sm" />
          <Link to="/login" className="hover:text-[#6C5CE7] transition-colors">Sign In</Link>
          <Link to="/register" className="hover:text-[#6C5CE7] transition-colors">Create Account</Link>
        </div>
      </footer>
    </div>
  );
};
