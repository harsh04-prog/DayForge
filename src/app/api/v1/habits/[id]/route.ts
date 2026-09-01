import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getUserIdFromRequest, createUserDataVaultToken } from '@/lib/auth';

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const userId = getUserIdFromRequest(request);
  if (!userId) return NextResponse.json({ detail: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const habitId = parseInt(id, 10);
  const habit = db.getHabitById(habitId);

  if (!habit || Number(habit.user_id) !== Number(userId)) {
    return NextResponse.json({ detail: 'Habit not found' }, { status: 404 });
  }

  const logs = db.getLogsByHabitId(habitId);
  return NextResponse.json({ ...habit, logs });
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const userId = getUserIdFromRequest(request);
  if (!userId) return NextResponse.json({ detail: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const habitId = parseInt(id, 10);
  const habit = db.getHabitById(habitId);

  if (!habit || Number(habit.user_id) !== Number(userId)) {
    return NextResponse.json({ detail: 'Habit not found' }, { status: 404 });
  }

  try {
    const body = await request.json();
    const updated = db.updateHabit(habitId, body);

    const latestVaultData = db.getUserVaultData(userId);
    const vaultToken = createUserDataVaultToken(latestVaultData);

    const res = NextResponse.json(updated);
    res.headers.set('x-dayforge-vault-token', vaultToken);
    return res;
  } catch (error: any) {
    return NextResponse.json({ detail: 'Failed to update habit' }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const userId = getUserIdFromRequest(request);
  if (!userId) return NextResponse.json({ detail: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const habitId = parseInt(id, 10);
  const habit = db.getHabitById(habitId);

  if (!habit || Number(habit.user_id) !== Number(userId)) {
    return NextResponse.json({ detail: 'Habit not found' }, { status: 404 });
  }

  db.deleteHabit(habitId);
  db.recalculateUserStats(userId);

  const latestVaultData = db.getUserVaultData(userId);
  const vaultToken = createUserDataVaultToken(latestVaultData);

  const res = NextResponse.json({
    success: true,
    message: 'Habit deleted successfully',
    vault_token: vaultToken,
  });
  res.headers.set('x-dayforge-vault-token', vaultToken);
  return res;
}
