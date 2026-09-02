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

  const challenge = await prisma.challenge.findUnique({
    where: { id: challengeId },
  });

  if (!challenge) {
    return NextResponse.json(
      { detail: 'Challenge not found' },
      { status: 404, headers: { 'Cache-Control': 'private, no-cache, no-store, max-age=0, must-revalidate' } }
    );
  }

  // Upsert user challenge participation in Neon Postgres
  await prisma.userChallenge.upsert({
    where: {
      user_id_challenge_id: {
        user_id: userId,
        challenge_id: challengeId,
      },
    },
    update: {
      status: 'active',
      completed_days: 0,
    },
    create: {
      user_id: userId,
      challenge_id: challengeId,
      status: 'active',
      completed_days: 0,
    },
  });

  // Increment participants count
  await prisma.challenge.update({
    where: { id: challengeId },
    data: { participants_count: { increment: 1 } },
  }).catch(() => null);

  db.joinChallenge(userId, challengeId);

  const res = NextResponse.json({
    success: true,
    message: `Successfully joined ${challenge.title}!`,
  });
  res.headers.set('Cache-Control', 'private, no-cache, no-store, max-age=0, must-revalidate');
  return res;
}
