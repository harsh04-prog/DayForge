import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getWittyNotification } from '@/lib/smartNotifications';
import { sendOneSignalPush } from '@/lib/oneSignalServer';
import { formatDate } from '@/lib/streakEngine';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request: Request) {
  return handleScheduledReminders(request);
}

export async function POST(request: Request) {
  return handleScheduledReminders(request);
}

async function handleScheduledReminders(request: Request) {
  const now = new Date();

  // Calculate IST (UTC + 5:30)
  const istDate = new Date(now.getTime() + 5.5 * 60 * 60 * 1000);
  const istHours = String(istDate.getUTCHours()).padStart(2, '0');
  const istMinutes = String(istDate.getUTCMinutes()).padStart(2, '0');
  const currentIstHHMM = `${istHours}:${istMinutes}`;
  const currentHour = istDate.getUTCHours();
  const todayStr = formatDate(now);

  // Check URL params for manual test/force trigger
  const { searchParams } = new URL(request.url);
  const forceUserId = searchParams.get('userId') ? parseInt(searchParams.get('userId')!, 10) : null;
  const isForce = searchParams.get('force') === 'true';

  const triggeredList: Array<{
    userId: number;
    type: 'habit' | 'todo';
    title: string;
    message: string;
    oneSignalId?: string;
  }> = [];

  try {
    // 1. Fetch users from Neon Postgres
    const users = await prisma.user.findMany({
      where: forceUserId ? { id: forceUserId } : { is_active: true },
      include: {
        habits: {
          where: { is_active: true, is_archived: false },
          include: {
            logs: {
              where: { date: todayStr },
            },
          },
        },
        todos: {
          where: { completed: false },
        },
      },
    });

    for (const user of users) {
      const firstName = user.full_name?.split(' ')[0] || user.username || 'Friend';

      // 2. Evaluate Habits for this user
      for (const habit of user.habits) {
        // Skip if already completed today
        const isCompletedToday = habit.logs.some((l) => l.completed);
        if (isCompletedToday && !isForce) continue;

        let shouldTrigger = false;

        if (isForce) {
          shouldTrigger = true;
        } else if (habit.reminder_enabled && habit.reminder_time) {
          // Compare reminder_time (e.g. "09:00" or "09:15") within 30 min window
          const [hHours, hMins] = habit.reminder_time.split(':').map(Number);
          if (!isNaN(hHours) && Math.abs(hHours - currentHour) <= 1) {
            shouldTrigger = true;
          }
        } else {
          // Time of day matching
          const timeSlot = (habit.preferred_time || habit.time_of_day || 'anytime').toLowerCase();
          if (timeSlot === 'morning' && currentHour >= 7 && currentHour <= 11) {
            shouldTrigger = true;
          } else if (timeSlot === 'afternoon' && currentHour >= 12 && currentHour <= 16) {
            shouldTrigger = true;
          } else if (timeSlot === 'evening' && currentHour >= 18 && currentHour <= 22) {
            shouldTrigger = true;
          } else if (timeSlot === 'anytime' && (currentHour === 9 || currentHour === 15 || currentHour === 20)) {
            shouldTrigger = true;
          }
        }

        if (shouldTrigger) {
          // Check if user was already notified for this habit today
          const existingNotif = await prisma.notification.findFirst({
            where: {
              user_id: user.id,
              habit_id: habit.id,
              created_at: {
                gte: new Date(new Date().setHours(0, 0, 0, 0)),
              },
            },
          });

          if (!existingNotif || isForce) {
            // Pick a witty Hinglish notification from content bank
            const witty = getWittyNotification(
              habit.title || habit.name || 'Habit',
              habit.category,
              firstName
            );

            // Send Push via OneSignal REST API
            const pushResult = await sendOneSignalPush({
              userId: user.id,
              title: witty.title,
              message: witty.message,
              url: '/habits',
              data: { habitId: habit.id, type: 'habit_reminder' },
            });

            // Save in database
            await prisma.notification.create({
              data: {
                user_id: user.id,
                habit_id: habit.id,
                title: witty.title,
                message: witty.message,
                type: 'habit_reminder',
                action_url: '/habits',
                sent_at: new Date(),
                is_read: false,
              },
            });

            triggeredList.push({
              userId: user.id,
              type: 'habit',
              title: witty.title,
              message: witty.message,
              oneSignalId: pushResult.id,
            });

            // Limit to 1 push per user per cron run to avoid bunching
            break;
          }
        }
      }

      // 3. Evaluate To-Dos if no habit was triggered
      const habitTriggeredForUser = triggeredList.some((t) => t.userId === user.id);
      if (!habitTriggeredForUser) {
        for (const todo of user.todos) {
          let shouldTriggerTodo = false;
          if (isForce) {
            shouldTriggerTodo = true;
          } else if (todo.reminder_enabled && todo.reminder_time) {
            const [tHours] = todo.reminder_time.split(':').map(Number);
            if (!isNaN(tHours) && Math.abs(tHours - currentHour) <= 1) {
              shouldTriggerTodo = true;
            }
          }

          if (shouldTriggerTodo) {
            const existingTodoNotif = await prisma.notification.findFirst({
              where: {
                user_id: user.id,
                todo_id: todo.id,
                created_at: {
                  gte: new Date(new Date().setHours(0, 0, 0, 0)),
                },
              },
            });

            if (!existingTodoNotif || isForce) {
              const witty = getWittyNotification(
                todo.title,
                todo.category || 'productivity',
                firstName
              );

              const pushResult = await sendOneSignalPush({
                userId: user.id,
                title: `Task Reminder: ${todo.title}`,
                message: witty.message,
                url: '/todos',
                data: { todoId: todo.id, type: 'todo_reminder' },
              });

              await prisma.notification.create({
                data: {
                  user_id: user.id,
                  todo_id: todo.id,
                  title: `Task: ${todo.title}`,
                  message: witty.message,
                  type: 'todo_reminder',
                  action_url: '/todos',
                  sent_at: new Date(),
                  is_read: false,
                },
              });

              triggeredList.push({
                userId: user.id,
                type: 'todo',
                title: todo.title,
                message: witty.message,
                oneSignalId: pushResult.id,
              });

              break;
            }
          }
        }
      }
    }

    const res = NextResponse.json({
      success: true,
      timestamp: now.toISOString(),
      ist_time: currentIstHHMM,
      triggered_count: triggeredList.length,
      notifications: triggeredList,
    });
    res.headers.set('Cache-Control', 'private, no-cache, no-store, max-age=0, must-revalidate');
    return res;
  } catch (error: any) {
    console.error('Error executing reminders cron job:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
