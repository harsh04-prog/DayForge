import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { db } from '@/lib/db';
import { getUserIdFromRequest } from '@/lib/auth';
import { formatDate } from '@/lib/streakEngine';

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

  const reqUrl = new URL(request.url);
  const clientDate = reqUrl.searchParams.get('date') || request.headers.get('x-client-date');
  const today = clientDate && /^\d{4}-\d{2}-\d{2}$/.test(clientDate) ? clientDate : formatDate(new Date());

  const challenge = await prisma.challenge.findUnique({
    where: { id: challengeId },
  });

  if (!challenge) {
    return NextResponse.json(
      { detail: 'Challenge not found.' },
      {
        status: 404,
        headers: { 'Cache-Control': 'private, no-cache, no-store, max-age=0, must-revalidate' },
      }
    );
  }

  const userCh = await prisma.userChallenge.findUnique({
    where: {
      user_id_challenge_id: {
        user_id: userId,
        challenge_id: challengeId,
      },
    },
  });

  if (!userCh || userCh.status !== 'active') {
    return NextResponse.json(
      { detail: 'Active challenge not found for user.' },
      {
        status: 404,
        headers: { 'Cache-Control': 'private, no-cache, no-store, max-age=0, must-revalidate' },
      }
    );
  }

  const dailyTarget = challenge.daily_target || 1;
  const initialProgress = isAbsolute ? (progressValue ?? dailyTarget) : (progressValue ?? 1);
  const isDone = initialProgress >= dailyTarget;
  const dailyXpReward = challenge.daily_xp_reward || 15;
  const xpAwarded = isDone ? dailyXpReward : 0;

  // 1. Log in Neon Postgres via Prisma
  await prisma.userChallengeLog.upsert({
    where: {
      user_id_challenge_id_date: {
        user_id: userId,
        challenge_id: challengeId,
        date: today,
      },
    },
    update: {
      progress_value: initialProgress,
      completed: isDone,
      xp_awarded: xpAwarded,
      logged_at: new Date(),
    },
    create: {
      user_id: userId,
      challenge_id: challengeId,
      date: today,
      progress_value: initialProgress,
      target_value: dailyTarget,
      completed: isDone,
      xp_awarded: xpAwarded,
      logged_at: new Date(),
    },
  });

  // Award XP if completed
  if (isDone) {
    await prisma.profile.updateMany({
      where: { user_id: userId },
      data: { xp: { increment: dailyXpReward } },
    }).catch(() => null);

    await prisma.xPTransaction.create({
      data: {
        user_id: userId,
        amount: dailyXpReward,
        source_type: 'challenge_daily_checkin',
        source_id: challengeId,
        description: `Completed Daily Goal: ${challenge.title}`,
      },
    }).catch(() => null);

    await prisma.userChallenge.update({
      where: { id: userCh.id },
      data: {
        completed_days: { increment: 1 },
      },
    }).catch(() => null);
  }

  // Also sync memory DB
  const result = db.checkinChallenge(userId, challengeId, progressValue, isAbsolute);
  db.recalculateUserStats(userId);

  const res = NextResponse.json(result || {
    success: true,
    today_completed: isDone,
    today_progress: initialProgress,
    today_target: dailyTarget,
    xp_awarded: xpAwarded,
    message: isDone ? `Daily goal completed! +${xpAwarded} XP` : 'Progress updated.',
  });
  res.headers.set('Cache-Control', 'private, no-cache, no-store, max-age=0, must-revalidate');
  return res;
}
