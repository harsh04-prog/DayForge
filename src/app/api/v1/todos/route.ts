import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { db } from '@/lib/db';
import { getUserIdFromRequest, getUserVaultDataFromRequest, createUserDataVaultToken } from '@/lib/auth';
import { formatDate } from '@/lib/streakEngine';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request: Request) {
  const userId = getUserIdFromRequest(request);
  if (!userId) {
    return NextResponse.json(
      { detail: 'Unauthorized' },
      {
        status: 401,
        headers: { 'Cache-Control': 'private, no-cache, no-store, max-age=0, must-revalidate' },
      }
    );
  }

  const { searchParams } = new URL(request.url);
  const includeCompleted = searchParams.get('include_completed') !== 'false';
  const clientDate = searchParams.get('date') || request.headers.get('x-client-date');
  const today = clientDate && /^\d{4}-\d{2}-\d{2}$/.test(clientDate) ? clientDate : formatDate(new Date());

  // 1. Fetch todos from Postgres via Prisma
  let todos = await prisma.todo.findMany({
    where: {
      user_id: userId,
      ...(includeCompleted ? {} : { completed: false }),
    },
    orderBy: { id: 'desc' },
  });

  // Fallback to in-memory store if DB is empty
  if (todos.length === 0) {
    const localTodos = db.getTodosByUserId(userId, includeCompleted);
    if (localTodos.length > 0) {
      todos = localTodos.map((t: any) => ({
        id: t.id,
        user_id: t.user_id,
        title: t.title,
        completed: t.completed,
        priority: t.priority || 'medium',
        category: t.category || 'General',
        due_date: t.due_date || null,
        reminder_time: t.reminder_time || null,
        reminder_enabled: Boolean(t.reminder_enabled),
        completed_at: t.completed_at ? new Date(t.completed_at) : null,
        created_at: new Date(t.created_at || Date.now()),
        updated_at: new Date(),
      }));
    }
  }

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
  res.headers.set('Cache-Control', 'private, no-cache, no-store, max-age=0, must-revalidate');
  return res;
}

export async function POST(request: Request) {
  const userId = getUserIdFromRequest(request);
  if (!userId) {
    return NextResponse.json(
      { detail: 'Unauthorized' },
      {
        status: 401,
        headers: { 'Cache-Control': 'private, no-cache, no-store, max-age=0, must-revalidate' },
      }
    );
  }

  try {
    const body = await request.json();
    const title = (body.title || '').trim();
    if (!title) {
      return NextResponse.json(
        { detail: 'Task title is required.' },
        {
          status: 400,
          headers: { 'Cache-Control': 'private, no-cache, no-store, max-age=0, must-revalidate' },
        }
      );
    }

    // 1. Create todo in Postgres via Prisma
    const newTodo = await prisma.todo.create({
      data: {
        user_id: userId,
        title,
        priority: body.priority || 'medium',
        category: body.category || 'General',
        due_date: body.due_date || null,
        reminder_time: body.reminder_time || null,
        reminder_enabled: Boolean(body.reminder_enabled || body.reminder_time),
        completed: false,
      },
    });

    // Mirror to local store
    db.createTodo({
      id: newTodo.id,
      user_id: userId,
      title: newTodo.title,
      priority: newTodo.priority,
      category: newTodo.category,
      due_date: newTodo.due_date,
      reminder_time: newTodo.reminder_time,
      reminder_enabled: newTodo.reminder_enabled,
      completed: newTodo.completed,
    });

    const latestVaultData = db.getUserVaultData(userId);
    const vaultToken = createUserDataVaultToken(latestVaultData);

    const res = NextResponse.json(newTodo, { status: 201 });
    res.headers.set('x-dayforge-vault-token', vaultToken);
    res.headers.set('Cache-Control', 'private, no-cache, no-store, max-age=0, must-revalidate');
    return res;
  } catch (error: any) {
    console.error('Create todo error:', error);
    return NextResponse.json(
      { detail: 'Failed to create task.' },
      {
        status: 500,
        headers: { 'Cache-Control': 'private, no-cache, no-store, max-age=0, must-revalidate' },
      }
    );
  }
}
