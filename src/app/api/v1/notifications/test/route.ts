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

  let body: any = {};
  try {
    body = await request.json();
  } catch {}

  let selectedHabit: any = undefined;

  if (body.habit_id) {
    selectedHabit = userHabits.find((h) => Number(h.id) === Number(body.habit_id));
  }

  if (!selectedHabit && userHabits.length > 0) {
    selectedHabit = userHabits[Math.floor(Math.random() * userHabits.length)];
  }

  let title = body.title;
  let message = body.message;
  let icon = body.icon || 'zap';

  if (!title || !message) {
    const habitName = selectedHabit?.name || selectedHabit?.title || (body.category ? `${body.category} Routine` : 'Daily Discipline');
    const habitCategory = selectedHabit?.category || body.category || 'General';
    const smart = getSmartHabitNotification(habitName, habitCategory, firstName);
    title = smart.title;
    message = smart.message;
    icon = smart.icon;
  }

  const notif = db.createNotification({
    user_id: userId,
    habit_id: selectedHabit?.id || null,
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
