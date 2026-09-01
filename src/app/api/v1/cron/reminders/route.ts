import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSmartHabitNotification } from '@/lib/smartNotifications';
import { formatDate } from '@/lib/streakEngine';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  return handleReminderCron(request);
}

export async function POST(request: Request) {
  return handleReminderCron(request);
}

async function handleReminderCron(request: Request) {
  const now = new Date();
  
  // Format current UTC and IST time as HH:MM
  const utcHours = String(now.getUTCHours()).padStart(2, '0');
  const utcMins = String(now.getUTCMinutes()).padStart(2, '0');
  const utcHHMM = `${utcHours}:${utcMins}`;

  // IST (UTC + 5:30)
  const istDate = new Date(now.getTime() + (5.5 * 60 * 60 * 1000));
  const istHours = String(istDate.getUTCHours()).padStart(2, '0');
  const istMins = String(istDate.getUTCMinutes()).padStart(2, '0');
  const istHHMM = `${istHours}:${istMins}`;

  const todayStr = formatDate(now);
  const activeTimes = [utcHHMM, istHHMM];

  const triggeredTodos: any[] = [];
  const triggeredHabits: any[] = [];

  const allUsers = db.getAllUsers ? db.getAllUsers() : [];

  for (const user of allUsers) {
    const userId = user.id;
    const firstName = user.full_name?.split(' ')[0] || user.username || 'Friend';

    // 1. Process To-Do Reminders
    const userTodos = db.getTodosByUserId(userId, false); // pending only
    for (const todo of userTodos) {
      if (todo.reminder_enabled && todo.reminder_time && !todo.completed) {
        const tTime = todo.reminder_time.trim();
        // Check if reminder time matches UTC or IST or exact
        if (activeTimes.includes(tTime) || tTime === istHHMM) {
          // Check if notification already sent in last 30 minutes
          const recentNotifs = db.getNotificationsByUserId(userId);
          const alreadyNotified = recentNotifs.some(
            (n) => n.todo_id === todo.id && n.created_at.startsWith(todayStr)
          );

          if (!alreadyNotified) {
            const smart = getSmartHabitNotification(todo.title, todo.category, firstName, true);
            const notif = db.createNotification({
              user_id: userId,
              todo_id: todo.id,
              title: `Task Reminder: ${todo.title}`,
              message: smart.message,
              category: 'todo',
              priority: todo.priority === 'high' ? 'high' : 'medium',
              icon: 'check-square',
              action_url: '/todos',
              action_type: 'navigate',
            });
            triggeredTodos.push({ todo_id: todo.id, title: todo.title, notification_id: notif.id });
          }
        }
      }
    }

    // 2. Process Habit Reminders
    const userHabits = db.getHabitsByUserId(userId, false); // active only
    for (const habit of userHabits) {
      if (habit.reminder_enabled && habit.reminder_time && habit.is_active && !habit.is_archived) {
        const hTime = habit.reminder_time.trim();
        if (activeTimes.includes(hTime) || hTime === istHHMM) {
          // Check if already completed today or already notified
          const todayLog = db.getLogByHabitAndDate(habit.id, todayStr);
          if (!todayLog || !todayLog.completed) {
            const recentNotifs = db.getNotificationsByUserId(userId);
            const alreadyNotified = recentNotifs.some(
              (n) => n.habit_id === habit.id && n.created_at.startsWith(todayStr)
            );

            if (!alreadyNotified) {
              const smart = getSmartHabitNotification(habit.name || habit.title, habit.category, firstName, false);
              const notif = db.createNotification({
                user_id: userId,
                habit_id: habit.id,
                title: smart.title,
                message: smart.message,
                category: 'routine',
                priority: 'high',
                icon: smart.icon || 'zap',
                action_url: '/habits',
                action_type: 'navigate',
              });
              triggeredHabits.push({ habit_id: habit.id, name: habit.name || habit.title, notification_id: notif.id });
            }
          }
        }
      }
    }
  }

  return NextResponse.json({
    success: true,
    checked_at: now.toISOString(),
    ist_time: istHHMM,
    utc_time: utcHHMM,
    triggered_todos_count: triggeredTodos.length,
    triggered_habits_count: triggeredHabits.length,
    triggered_todos: triggeredTodos,
    triggered_habits: triggeredHabits,
  });
}
