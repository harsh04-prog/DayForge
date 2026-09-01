import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getUserIdFromRequest, getUserVaultDataFromRequest, createUserDataVaultToken } from '@/lib/auth';

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const userId = getUserIdFromRequest(request);
  if (!userId) return NextResponse.json({ detail: 'Unauthorized' }, { status: 401 });

  const resolvedParams = await params;
  const todoId = parseInt(resolvedParams.id, 10);
  if (isNaN(todoId)) {
    return NextResponse.json({ detail: 'Invalid task ID.' }, { status: 400 });
  }

  // Reconcile client vault if cold container
  const userVault = getUserVaultDataFromRequest(request);
  if (userVault && Number(userVault.userId) === Number(userId)) {
    db.syncUserDataFromVault(userId, userVault);
  }

  const existingTodo = db.getTodoById(todoId);
  if (!existingTodo || Number(existingTodo.user_id) !== Number(userId)) {
    return NextResponse.json({ detail: 'Task not found.' }, { status: 404 });
  }

  const toggled = db.toggleTodo(todoId);
  if (!toggled) {
    return NextResponse.json({ detail: 'Task not found.' }, { status: 404 });
  }

  // Award minor XP on task completion (+5 XP)
  if (toggled.completed) {
    db.addXP(userId, 5, 'todo_completion', todoId, `Completed Task: ${toggled.title}`);
  }

  const latestVaultData = db.getUserVaultData(userId);
  const vaultToken = createUserDataVaultToken(latestVaultData);

  const res = NextResponse.json({
    ...toggled,
    vault_token: vaultToken,
  });
  res.headers.set('x-dayforge-vault-token', vaultToken);
  return res;
}
