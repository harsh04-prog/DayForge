import { NextResponse } from 'next/server';
import { getUserIdFromRequest } from '@/lib/auth';

const SAMPLE_CHALLENGES = [
  {
    id: 1,
    title: '7-Day Morning Discipline Sprint',
    description: 'Complete your morning habit before 9 AM for 7 consecutive days.',
    category: 'Productivity',
    color: '#6C5CE7',
    icon: 'zap',
    duration_days: 7,
    xp_reward: 150,
    badge_name: 'Early Riser Vanguard',
    is_joined: true,
    progress_days: 3,
    participants_count: 1420,
    status: 'active',
  },
  {
    id: 2,
    title: 'Hydration 2L Odyssey',
    description: 'Drink at least 2 liters of water daily for 14 straight days.',
    category: 'Health',
    color: '#06B6D4',
    icon: 'droplet',
    duration_days: 14,
    xp_reward: 300,
    badge_name: 'Hydro Master',
    is_joined: false,
    progress_days: 0,
    participants_count: 2890,
    status: 'upcoming',
  },
  {
    id: 3,
    title: 'Iron Consistency: 30 Days of Movement',
    description: 'Log any workout, walk, or active movement every day for a full month.',
    category: 'Fitness',
    color: '#F97316',
    icon: 'flame',
    duration_days: 30,
    xp_reward: 750,
    badge_name: 'Iron Forger',
    is_joined: false,
    progress_days: 0,
    participants_count: 5120,
    status: 'upcoming',
  },
];

export async function GET(request: Request) {
  const userId = getUserIdFromRequest(request);
  if (!userId) return NextResponse.json({ detail: 'Unauthorized' }, { status: 401 });

  return NextResponse.json(SAMPLE_CHALLENGES);
}
