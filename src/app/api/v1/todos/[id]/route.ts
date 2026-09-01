import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getUserIdFromRequest, createUserDataVaultToken } from '@/lib/auth';

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const userId = getUserIdFromRequest(request);
  if (!userId) return NextResponse.json({ detail: 'Unauthorized' }, { status: 401 });

  const resolvedParams = await params;
  const todoId = parseInt(resolvedParams.id, 10);
  if (isNaN(todoId)) {
    return NextResponse.json({ detail: 'Invalid task ID.' }, { status: 400 });
  }

  const existingTodo = db.getTodoById(todoId);
  if (!existingTodo || Number(existingTodo.user_id) !== Number(userId)) {
    return NextResponse.json({ detail: 'Task not found.' }, { status: 404 });
  }

  try {
    const body = await request.json();
    const updated = db.updateTodo(todoId, body);
    if (!updated) {
      return NextResponse.json({ detail: 'Task not found.' }, { status: 404 });
    }

    const latestVaultData = db.getUserVaultData(userId);
    const vaultToken = createUserDataVaultToken(latestVaultData);

    const res = NextResponse.json(updated);
    res.headers.set('x-dayforge-vault-token', vaultToken);
    return res;
  } catch (error: any) {
    console.error('Update todo error:', error);
    return NextResponse.json({ detail: 'Failed to update task.' }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const userId = getUserIdFromRequest(request);
  if (!userId) return NextResponse.json({ detail: 'Unauthorized' }, { status: 401 });

  const resolvedParams = await params;
  const todoId = parseInt(resolvedParams.id, 10);
  if (isNaN(todoId)) {
    return NextResponse.json({ detail: 'Invalid task ID.' }, { status: 400 });
  }

  const existingTodo = db.getTodoById(todoId);
  if (!existingTodo || Number(existingTodo.user_id) !== Number(userId)) {
    return NextResponse.json({ detail: 'Task not found.' }, { status: 404 });
  }

  const deleted = db.deleteTodo(todoId);
  if (!deleted) {
    return NextResponse.json({ detail: 'Task not found.' }, { status: 404 });
  }

  const latestVaultData = db.getUserVaultData(userId);
  const vaultToken = createUserDataVaultToken(latestVaultData);

  const res = NextResponse.json({
    success: true,
    message: 'Task deleted successfully.',
    vault_token: vaultToken,
  });
  res.headers.set('x-dayforge-vault-token', vaultToken);
  return res;
}
