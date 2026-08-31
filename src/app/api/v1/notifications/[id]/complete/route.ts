import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getUserIdFromRequest } from '@/lib/auth';
import { formatDate } from '@/lib/streakEngine';

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const userId = getUserIdFromRequest(request);
  if (!userId) return NextResponse.json({ detail: 'Unauthorized' }, { status: 401 });

  const resolvedParams = await params;
  const notifId = parseInt(resolvedParams.id, 10);
  const notif = db.getNotificationById(notifId);
  if (!notif) return NextResponse.json({ detail: 'Notification not found' }, { status: 404 });

  // Mark notification dismissed/read
  db.updateNotification(notifId, { status: 'read' });

  // If there's a habit associated, log completion
  if (notif.habit_id) {
    const habit = db.getHabitById(notif.habit_id);
    if (habit && habit.user_id === userId) {
      const today = formatDate(new Date());
      db.createHabitLog({
        habit_id: habit.id,
        user_id: userId,
        date: today,
        value: habit.target_value,
        completed: true,
        xp_earned: habit.xp_per_completion || 15,
        note: 'Completed from companion notification',
      });
      db.addXp(userId, habit.xp_per_completion || 15, 'habit_completion', habit.id, `Completed ${habit.title}`);
    }
  }

  return NextResponse.json({ success: true, message: 'Action completed and logged!' });
}
