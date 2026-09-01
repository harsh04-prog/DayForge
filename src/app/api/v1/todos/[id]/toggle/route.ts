import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getUserIdFromRequest } from '@/lib/auth';

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const userId = getUserIdFromRequest(request);
  if (!userId) return NextResponse.json({ detail: 'Unauthorized' }, { status: 401 });

  const resolvedParams = await params;
  const todoId = parseInt(resolvedParams.id, 10);

  const toggled = db.toggleTodo(todoId);
  if (!toggled) {
    return NextResponse.json({ detail: 'Task not found.' }, { status: 404 });
  }

  // Award minor XP on task completion (+5 XP)
  if (toggled.completed) {
    db.addXP(userId, 5, 'todo_completion', todoId, `Completed Task: ${toggled.title}`);
  }

  return NextResponse.json(toggled);
}
