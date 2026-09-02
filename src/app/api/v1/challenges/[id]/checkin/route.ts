import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getUserIdFromRequest } from '@/lib/auth';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
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
  const challengeId = parseInt(resolvedParams.id, 10);

  let progressValue: number | undefined;
  let isAbsolute = false;

  try {
    const body = await request.json();
    if (body.progress !== undefined) {
      progressValue = Number(body.progress);
    } else if (body.delta !== undefined) {
      progressValue = Number(body.delta);
    }
    if (body.is_absolute !== undefined) {
      isAbsolute = Boolean(body.is_absolute);
    }
  } catch {}

  const result = db.checkinChallenge(userId, challengeId, progressValue, isAbsolute);
  if (!result) {
    return NextResponse.json(
      { detail: 'Active challenge not found for user.' },
      {
        status: 404,
        headers: { 'Cache-Control': 'private, no-cache, no-store, max-age=0, must-revalidate' },
      }
    );
  }

  // Recalculate stats
  db.recalculateUserStats(userId);

  const res = NextResponse.json(result);
  res.headers.set('Cache-Control', 'private, no-cache, no-store, max-age=0, must-revalidate');
  return res;
}
