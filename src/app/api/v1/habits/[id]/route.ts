import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { db } from '@/lib/db';
import { getUserIdFromRequest, createUserDataVaultToken } from '@/lib/auth';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
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

  const { id } = await params;
  const habitId = parseInt(id, 10);
  if (isNaN(habitId)) {
    return NextResponse.json(
      { detail: 'Invalid habit ID' },
      {
        status: 400,
        headers: { 'Cache-Control': 'private, no-cache, no-store, max-age=0, must-revalidate' },
      }
    );
  }

  const habit = await prisma.habit.findUnique({
    where: { id: habitId },
    include: { logs: true },
  });

  if (!habit || Number(habit.user_id) !== Number(userId)) {
    return NextResponse.json(
      { detail: 'Habit not found' },
      {
        status: 404,
        headers: { 'Cache-Control': 'private, no-cache, no-store, max-age=0, must-revalidate' },
      }
    );
  }

  const res = NextResponse.json(habit);
  res.headers.set('Cache-Control', 'private, no-cache, no-store, max-age=0, must-revalidate');
  return res;
}

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

  const { id } = await params;
  const habitId = parseInt(id, 10);
  if (isNaN(habitId)) {
    return NextResponse.json(
      { detail: 'Invalid habit ID' },
      {
        status: 400,
        headers: { 'Cache-Control': 'private, no-cache, no-store, max-age=0, must-revalidate' },
      }
    );
  }

  try {
    const body = await request.json();
    const habitName = body.name || body.title;

    // 1. Update habit directly in Neon Postgres via Prisma
    const updated = await prisma.habit.update({
      where: { id: habitId },
      data: {
        title: habitName ? habitName.trim() : undefined,
        name: habitName ? habitName.trim() : undefined,
        description: body.description !== undefined ? body.description : undefined,
        category: body.category !== undefined ? body.category : undefined,
        color: body.color !== undefined ? body.color : undefined,
        icon: body.icon !== undefined ? body.icon : undefined,
        frequency_type: body.frequency_type !== undefined ? body.frequency_type : undefined,
        frequency_days: body.frequency_days !== undefined ? body.frequency_days : undefined,
        target_value: body.target_value !== undefined ? Number(body.target_value) : undefined,
        target_unit: body.target_unit || body.unit || undefined,
        unit: body.target_unit || body.unit || undefined,
        difficulty: body.difficulty !== undefined ? body.difficulty : undefined,
        xp_per_completion: body.xp_per_completion !== undefined ? Number(body.xp_per_completion) : undefined,
        time_of_day: body.preferred_time || body.time_of_day || undefined,
        preferred_time: body.preferred_time || body.time_of_day || undefined,
        reminder_time: body.reminder_time !== undefined ? body.reminder_time : undefined,
        reminder_enabled: body.reminder_enabled !== undefined ? Boolean(body.reminder_enabled) : undefined,
      },
    });

    db.updateHabit(habitId, body);

    const latestVaultData = db.getUserVaultData(userId);
    const vaultToken = createUserDataVaultToken(latestVaultData);

    const res = NextResponse.json(updated);
    res.headers.set('x-dayforge-vault-token', vaultToken);
    res.headers.set('Cache-Control', 'private, no-cache, no-store, max-age=0, must-revalidate');
    return res;
  } catch (error: any) {
    console.error('Update habit error:', error);
    return NextResponse.json(
      { detail: 'Failed to update habit' },
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

  const { id } = await params;
  const habitId = parseInt(id, 10);
  if (isNaN(habitId)) {
    return NextResponse.json(
      { detail: 'Invalid habit ID' },
      {
        status: 400,
        headers: { 'Cache-Control': 'private, no-cache, no-store, max-age=0, must-revalidate' },
      }
    );
  }

  try {
    // 1. Delete habit directly from Neon Postgres via Prisma
    await prisma.habit.delete({
      where: { id: habitId },
    }).catch((e) => {
      console.warn('Prisma habit delete warning:', e.message);
    });

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
    res.headers.set('Cache-Control', 'private, no-cache, no-store, max-age=0, must-revalidate');
    return res;
  } catch (error: any) {
    console.error('Delete habit error:', error);
    return NextResponse.json(
      { detail: 'Failed to delete habit' },
      {
        status: 500,
        headers: { 'Cache-Control': 'private, no-cache, no-store, max-age=0, must-revalidate' },
      }
    );
  }
}
