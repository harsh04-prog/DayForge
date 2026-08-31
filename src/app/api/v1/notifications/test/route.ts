import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getUserIdFromRequest } from '@/lib/auth';

export async function POST(request: Request) {
  const userId = getUserIdFromRequest(request);
  if (!userId) return NextResponse.json({ detail: 'Unauthorized' }, { status: 401 });

  const notif = db.createNotification({
    user_id: userId,
    title: '⚡ Daily Momentum Check-In',
    message: 'Consistency is compounding! Take 2 minutes to complete your scheduled habits.',
    category: 'routine',
    priority: 'high',
    icon: 'zap',
    action_url: '/',
    action_type: 'navigate',
  });

  return NextResponse.json(notif);
}
