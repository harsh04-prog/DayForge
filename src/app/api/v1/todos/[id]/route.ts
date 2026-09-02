import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { db } from '@/lib/db';
import { getUserIdFromRequest, createUserDataVaultToken } from '@/lib/auth';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
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
    const body = await request.json();
    const updated = await prisma.todo.update({
      where: { id: todoId },
      data: {
        title: body.title !== undefined ? body.title : undefined,
        priority: body.priority !== undefined ? body.priority : undefined,
        category: body.category !== undefined ? body.category : undefined,
        due_date: body.due_date !== undefined ? body.due_date : undefined,
        reminder_time: body.reminder_time !== undefined ? body.reminder_time : undefined,
        reminder_enabled: body.reminder_enabled !== undefined ? Boolean(body.reminder_enabled) : undefined,
      },
    });

    db.updateTodo(todoId, body);

    const latestVaultData = db.getUserVaultData(userId);
    const vaultToken = createUserDataVaultToken(latestVaultData);

    const res = NextResponse.json(updated);
    res.headers.set('x-dayforge-vault-token', vaultToken);
    res.headers.set('Cache-Control', 'private, no-cache, no-store, max-age=0, must-revalidate');
    return res;
  } catch (error: any) {
    console.error('Update todo error:', error);
    return NextResponse.json(
      { detail: 'Failed to update task.' },
      {
        status: 500,
        headers: { 'Cache-Control': 'private, no-cache, no-store, max-age=0, must-revalidate' },
      }
    );
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
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
    await prisma.todo.delete({
      where: { id: todoId },
    }).catch(() => null);

    db.deleteTodo(todoId);

    const latestVaultData = db.getUserVaultData(userId);
    const vaultToken = createUserDataVaultToken(latestVaultData);

    const res = NextResponse.json({
      success: true,
      message: 'Task deleted successfully.',
      vault_token: vaultToken,
    });
    res.headers.set('x-dayforge-vault-token', vaultToken);
    res.headers.set('Cache-Control', 'private, no-cache, no-store, max-age=0, must-revalidate');
    return res;
  } catch (error: any) {
    console.error('Delete todo error:', error);
    return NextResponse.json(
      { detail: 'Failed to delete task.' },
      {
        status: 500,
        headers: { 'Cache-Control': 'private, no-cache, no-store, max-age=0, must-revalidate' },
      }
    );
  }
}
