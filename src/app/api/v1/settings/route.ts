import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getUserIdFromRequest } from '@/lib/auth';

export async function GET(request: Request) {
  const userId = getUserIdFromRequest(request);
  if (!userId) return NextResponse.json({ detail: 'Unauthorized' }, { status: 401 });

  const settings = db.getSettingsByUserId(userId);
  return NextResponse.json(settings);
}

export async function PUT(request: Request) {
  const userId = getUserIdFromRequest(request);
  if (!userId) return NextResponse.json({ detail: 'Unauthorized' }, { status: 401 });

  try {
    const body = await request.json();
    const updated = db.updateSettings(userId, body);
    return NextResponse.json(updated);
  } catch (error: any) {
    return NextResponse.json({ detail: 'Failed to update settings.' }, { status: 500 });
  }
}
