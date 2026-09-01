import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getUserIdFromRequest, getUserVaultDataFromRequest, createUserDataVaultToken } from '@/lib/auth';
import { formatDate } from '@/lib/streakEngine';

export async function GET(request: Request) {
  const userId = getUserIdFromRequest(request);
  if (!userId) return NextResponse.json({ detail: 'Unauthorized' }, { status: 401 });

  // Reconcile client vault if container has missing data
  const userVault = getUserVaultDataFromRequest(request);
  if (userVault && Number(userVault.userId) === Number(userId)) {
    db.syncUserDataFromVault(userId, userVault);
  }

  const { searchParams } = new URL(request.url);
  const includeCompleted = searchParams.get('include_completed') !== 'false';

  const todos = db.getTodosByUserId(userId, includeCompleted);
  const today = formatDate(new Date());

  const todayCount = todos.filter((t) => !t.completed && t.due_date === today).length;
  const overdueCount = todos.filter((t) => !t.completed && t.due_date && t.due_date < today).length;
  const pendingCount = todos.filter((t) => !t.completed).length;

  const latestVaultData = db.getUserVaultData(userId);
  const vaultToken = createUserDataVaultToken(latestVaultData);

  const res = NextResponse.json({
    todos,
    stats: {
      total: todos.length,
      pending: pendingCount,
      today: todayCount,
      overdue: overdueCount,
      completed: todos.filter((t) => t.completed).length,
    },
    vault_token: vaultToken,
  });

  res.headers.set('x-dayforge-vault-token', vaultToken);
  return res;
}

export async function POST(request: Request) {
  const userId = getUserIdFromRequest(request);
  if (!userId) return NextResponse.json({ detail: 'Unauthorized' }, { status: 401 });

  // Reconcile client vault if container has missing data
  const userVault = getUserVaultDataFromRequest(request);
  if (userVault && Number(userVault.userId) === Number(userId)) {
    db.syncUserDataFromVault(userId, userVault);
  }

  try {
    const body = await request.json();
    const title = (body.title || '').trim();
    if (!title) {
      return NextResponse.json({ detail: 'Task title is required.' }, { status: 400 });
    }

    const newTodo = db.createTodo({
      user_id: userId,
      title,
      description: body.description || null,
      due_date: body.due_date || null,
      reminder_time: body.reminder_time || null,
      reminder_enabled: Boolean(body.reminder_enabled || body.reminder_time),
      priority: body.priority || 'medium',
      category: body.category || 'General',
    });

    const latestVaultData = db.getUserVaultData(userId);
    const vaultToken = createUserDataVaultToken(latestVaultData);

    const res = NextResponse.json(newTodo, { status: 201 });
    res.headers.set('x-dayforge-vault-token', vaultToken);
    return res;
  } catch (error: any) {
    console.error('Create todo error:', error);
    return NextResponse.json({ detail: 'Failed to create task.' }, { status: 500 });
  }
}
