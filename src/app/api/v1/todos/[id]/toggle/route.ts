import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { db } from '@/lib/db';
import { getUserIdFromRequest, getUserVaultDataFromRequest, createUserDataVaultToken } from '@/lib/auth';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
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

  const resolvedParams = await params;
  const todoId = parseInt(resolvedParams.id, 10);
  if (isNaN(todoId)) {
    return NextResponse.json(
      { detail: 'Invalid task ID.' },
      {
        status: 400,
        headers: { 'Cache-Control': 'private, no-cache, no-store, max-age=0, must-revalidate' },
      }
    );
  }

  try {
    // 1. Fetch todo from Postgres
    let todo = await prisma.todo.findUnique({
      where: { id: todoId },
    });

    if (!todo || Number(todo.user_id) !== Number(userId)) {
      // Check local store
      const localTodo = db.getTodoById(todoId);
      if (!localTodo || Number(localTodo.user_id) !== Number(userId)) {
        return NextResponse.json(
          { detail: 'Task not found.' },
          {
            status: 404,
            headers: { 'Cache-Control': 'private, no-cache, no-store, max-age=0, must-revalidate' },
          }
        );
      }
    }

    const nextCompleted = !todo?.completed;
    const updatedTodo = await prisma.todo.update({
      where: { id: todoId },
      data: {
        completed: nextCompleted,
        completed_at: nextCompleted ? new Date() : null,
      },
    });

    // Update in-memory
    db.toggleTodo(todoId);

    // Award minor XP on task completion (+5 XP)
    if (updatedTodo.completed) {
      db.addXp(userId, 5, 'todo_completion', todoId, `Completed Task: ${updatedTodo.title}`);
    }

    const latestVaultData = db.getUserVaultData(userId);
    const vaultToken = createUserDataVaultToken(latestVaultData);

    const res = NextResponse.json({
      ...updatedTodo,
      vault_token: vaultToken,
    });

    res.headers.set('x-dayforge-vault-token', vaultToken);
    res.headers.set('Cache-Control', 'private, no-cache, no-store, max-age=0, must-revalidate');
    return res;
  } catch (err: any) {
    console.error('Toggle todo error:', err);
    return NextResponse.json(
      { detail: 'Failed to toggle task.' },
      {
        status: 500,
        headers: { 'Cache-Control': 'private, no-cache, no-store, max-age=0, must-revalidate' },
      }
    );
  }
}
