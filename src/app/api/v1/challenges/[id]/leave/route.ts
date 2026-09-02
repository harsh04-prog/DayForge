import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { db } from '@/lib/db';
import { getUserIdFromRequest } from '@/lib/auth';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const userId = getUserIdFromRequest(request);
  if (!userId) {
    return NextResponse.json(
      { detail: 'Unauthorized' },
      { status: 401, headers: { 'Cache-Control': 'private, no-cache, no-store, max-age=0, must-revalidate' } }
    );
  }

  const resolvedParams = await params;
  const challengeId = parseInt(resolvedParams.id, 10);

  // Update user challenge status in Neon Postgres
  await prisma.userChallenge.updateMany({
    where: {
      user_id: userId,
      challenge_id: challengeId,
    },
    data: {
      status: 'abandoned',
    },
  });

  db.leaveChallenge(userId, challengeId);

  const res = NextResponse.json({
    success: true,
    message: 'You have left the sprint.',
  });
  res.headers.set('Cache-Control', 'private, no-cache, no-store, max-age=0, must-revalidate');
  return res;
}
