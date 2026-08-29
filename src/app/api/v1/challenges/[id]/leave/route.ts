import { NextResponse } from 'next/server';
import { getUserIdFromRequest } from '@/lib/auth';

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const userId = getUserIdFromRequest(request);
  if (!userId) return NextResponse.json({ detail: 'Unauthorized' }, { status: 401 });

  return NextResponse.json({ success: true, message: 'You have left the challenge.' });
}
