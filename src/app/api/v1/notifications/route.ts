import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getUserIdFromRequest } from '@/lib/auth';

export async function GET(request: Request) {
  const userId = getUserIdFromRequest(request);
  if (!userId) return NextResponse.json({ detail: 'Unauthorized' }, { status: 401 });

  const notifications = db.getNotificationsByUserId(userId);
  return NextResponse.json(notifications);
}

export async function POST(request: Request) {
  const userId = getUserIdFromRequest(request);
  if (!userId) return NextResponse.json({ detail: 'Unauthorized' }, { status: 401 });

  try {
    const body = await request.json();
    const notification = db.createNotification({
      user_id: userId,
      title: body.title || 'DayForge Reminder',
      message: body.message || 'Time to check in on your habits!',
      category: body.category || 'motivation',
      priority: body.priority || 'medium',
      icon: body.icon || 'bell',
      action_url: body.action_url || '/',
      action_type: body.action_type || 'navigate',
    });
    return NextResponse.json(notification);
  } catch (err: any) {
    return NextResponse.json({ detail: err.message || 'Invalid request' }, { status: 400 });
  }
}
