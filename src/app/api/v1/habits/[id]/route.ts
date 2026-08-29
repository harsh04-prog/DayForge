import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getUserIdFromRequest } from '@/lib/auth';

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const userId = getUserIdFromRequest(request);
  if (!userId) return NextResponse.json({ detail: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const habitId = parseInt(id, 10);
  const habit = db.getHabitById(habitId);

  if (!habit || habit.user_id !== userId) {
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

  if (!habit || habit.user_id !== userId) {
    return NextResponse.json({ detail: 'Habit not found' }, { status: 404 });
  }

  try {
    const body = await request.json();
    const updated = db.updateHabit(habitId, body);
    return NextResponse.json(updated);
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

  if (!habit || habit.user_id !== userId) {
    return NextResponse.json({ detail: 'Habit not found' }, { status: 404 });
  }

  db.deleteHabit(habitId);
  db.recalculateUserStats(userId);

  return NextResponse.json({ success: true, message: 'Habit deleted successfully' });
}
