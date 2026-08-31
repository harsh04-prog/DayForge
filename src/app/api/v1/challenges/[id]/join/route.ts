import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getUserIdFromRequest } from '@/lib/auth';

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const userId = getUserIdFromRequest(request);
  if (!userId) return NextResponse.json({ detail: 'Unauthorized' }, { status: 401 });

  const resolvedParams = await params;
  const challengeId = parseInt(resolvedParams.id, 10);
  const result = db.joinChallenge(userId, challengeId);
  if (!result) return NextResponse.json({ detail: 'Challenge not found' }, { status: 404 });

  return NextResponse.json(result);
}
