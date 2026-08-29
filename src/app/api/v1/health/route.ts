import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    status: 'healthy',
    app: 'DayForge Next.js',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
  });
}
