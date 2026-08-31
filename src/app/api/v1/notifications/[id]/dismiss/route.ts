import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getUserIdFromRequest } from '@/lib/auth';

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const userId = getUserIdFromRequest(request);
  if (!userId) return NextResponse.json({ detail: 'Unauthorized' }, { status: 401 });

  const resolvedParams = await params;
  const notifId = parseInt(resolvedParams.id, 10);
  const updated = db.updateNotification(notifId, { status: 'dismissed' });
  if (!updated) return NextResponse.json({ detail: 'Notification not found' }, { status: 404 });

  return NextResponse.json({ success: true, notification: updated });
}
