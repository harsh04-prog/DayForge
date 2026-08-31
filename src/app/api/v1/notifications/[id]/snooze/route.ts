import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getUserIdFromRequest } from '@/lib/auth';

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const userId = getUserIdFromRequest(request);
  if (!userId) return NextResponse.json({ detail: 'Unauthorized' }, { status: 401 });

  const resolvedParams = await params;
  const notifId = parseInt(resolvedParams.id, 10);
  const body = await request.json().catch(() => ({ minutes: 15 }));
  const minutes = body.minutes || 15;
  const snoozedUntil = new Date(Date.now() + minutes * 60000).toISOString();

  const updated = db.updateNotification(notifId, {
    status: 'snoozed',
    snoozed_until: snoozedUntil,
  });
  if (!updated) return NextResponse.json({ detail: 'Notification not found' }, { status: 404 });

  return NextResponse.json({ success: true, notification: updated });
}
