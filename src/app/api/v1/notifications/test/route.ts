import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getUserIdFromRequest } from '@/lib/auth';
import { getSmartHabitNotification } from '@/lib/smartNotifications';

export async function POST(request: Request) {
  const userId = getUserIdFromRequest(request);
  if (!userId) return NextResponse.json({ detail: 'Unauthorized' }, { status: 401 });

  const user = db.getUserById(userId);
  const firstName = user?.full_name?.split(' ')[0] || user?.username || 'Hero';
  const userHabits = db.getHabitsByUserId(userId);
  const randomHabit = userHabits.length > 0 ? userHabits[Math.floor(Math.random() * userHabits.length)] : undefined;

  let title = '';
  let message = '';
  let icon = 'zap';

  try {
    const body = await request.json();
    if (body.title) title = body.title;
    if (body.message) message = body.message;
    if (body.icon) icon = body.icon;
  } catch {}

  if (!title || !message) {
    const smart = getSmartHabitNotification(randomHabit?.name || randomHabit?.title, randomHabit?.category, firstName);
    title = smart.title;
    message = smart.message;
    icon = smart.icon;
  }

  const notif = db.createNotification({
    user_id: userId,
    habit_id: randomHabit?.id || null,
    title,
    message,
    category: 'routine',
    priority: 'high',
    icon,
    action_url: '/',
    action_type: 'navigate',
  });

  return NextResponse.json(notif);
}
