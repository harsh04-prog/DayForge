import React from 'react';
import {
  Sparkles,
  Flame,
  Dumbbell,
  BookOpen,
  Droplet,
  Droplets,
  Brain,
  Moon,
  Sunrise,
  Sun,
  PenTool,
  Award,
  Zap,
  Shield,
  Layers,
  Heart,
  CheckCircle2,
  Coffee,
  Target,
  Trophy,
  Activity,
  Smile,
  Compass,
  Footprints,
  Briefcase,
  LucideIcon
} from 'lucide-react';

const ICON_MAP: Record<string, LucideIcon> = {
  sparkles: Sparkles,
  flame: Flame,
  dumbbell: Dumbbell,
  'book-open': BookOpen,
  reading: BookOpen,
  droplet: Droplet,
  droplets: Droplets,
  water: Droplet,
  brain: Brain,
  study: Brain,
  moon: Moon,
  sleep: Moon,
  sunrise: Sunrise,
  morning: Sunrise,
  sun: Sun,
  'pen-tool': PenTool,
  journal: PenTool,
  award: Award,
  zap: Zap,
  shield: Shield,
  layers: Layers,
  heart: Heart,
  fitness: Dumbbell,
  health: Heart,
  target: Target,
  trophy: Trophy,
  activity: Activity,
  coffee: Coffee,
  smile: Smile,
  compass: Compass,
  footprints: Footprints,
  briefcase: Briefcase,
  career: Briefcase,
};

interface IconProps {
  name: string;
  className?: string;
  size?: number;
}

export const HabitIcon: React.FC<IconProps> = ({ name, className = 'w-5 h-5', size }) => {
  const normalized = (name || 'sparkles').toLowerCase().trim();
  const IconComponent = ICON_MAP[normalized] || Sparkles;
  return <IconComponent className={className} size={size} />;
};

export const AVAILABLE_ICONS = [
  'sparkles', 'flame', 'dumbbell', 'book-open', 'droplet', 'brain',
  'moon', 'sunrise', 'pen-tool', 'heart', 'coffee', 'target', 'trophy',
  'activity', 'footprints', 'briefcase', 'layers', 'shield'
];
