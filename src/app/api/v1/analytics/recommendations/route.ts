import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getUserIdFromRequest } from '@/lib/auth';

export async function GET(request: Request) {
  const userId = getUserIdFromRequest(request);
  if (!userId) return NextResponse.json({ detail: 'Unauthorized' }, { status: 401 });

  const habits = db.getHabitsByUserId(userId, false);
  const stats = db.recalculateUserStats(userId);

  const recommendations = [];

  if (habits.length > 5) {
    recommendations.push({
      type: 'overload',
      priority: 'high',
      message: 'You have more than 5 active habits. Focus on 3 core keystones to increase your long-term consistency by 3x.',
      action_label: 'Review Habits',
      action_url: '/habits',
    });
  }

  if (stats.currentStreak >= 3) {
    recommendations.push({
      type: 'streak',
      priority: 'medium',
      message: `You're on an active ${stats.currentStreak}-day streak! Keep checking in before midnight to protect your momentum.`,
      action_label: 'View Dashboard',
      action_url: '/',
    });
  } else {
    recommendations.push({
      type: 'optimization',
      priority: 'medium',
      message: 'Stack your new habit onto an established routine (e.g., After I brush my teeth, I will drink 1 glass of water).',
      action_label: 'Explore Habit Stacks',
      action_url: '/habits',
    });
  }

  return NextResponse.json(recommendations);
}
