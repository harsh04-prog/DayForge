import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getUserIdFromRequest } from '@/lib/auth';

export async function GET(request: Request) {
  const userId = getUserIdFromRequest(request);
  if (!userId) return NextResponse.json({ detail: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const now = new Date();
  const year = parseInt(searchParams.get('year') || String(now.getFullYear()), 10);
  const month = parseInt(searchParams.get('month') || String(now.getMonth() + 1), 10);
  const dateStr = searchParams.get('date');

  if (dateStr) {
    const dayDetail = db.getDateActivity(userId, dateStr);
    return NextResponse.json(dayDetail);
  }

  const activity = db.getMonthActivity(userId, year, month);
  return NextResponse.json(activity);
}
