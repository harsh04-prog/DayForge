import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getUserIdFromRequest } from '@/lib/auth';

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const userId = getUserIdFromRequest(request);
  if (!userId) return NextResponse.json({ detail: 'Unauthorized' }, { status: 401 });

  const resolvedParams = await params;
  const todoId = parseInt(resolvedParams.id, 10);

  try {
    const body = await request.json();
    const updated = db.updateTodo(todoId, body);
    if (!updated) {
      return NextResponse.json({ detail: 'Task not found.' }, { status: 404 });
    }
    return NextResponse.json(updated);
  } catch (error: any) {
    console.error('Update todo error:', error);
    return NextResponse.json({ detail: 'Failed to update task.' }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const userId = getUserIdFromRequest(request);
  if (!userId) return NextResponse.json({ detail: 'Unauthorized' }, { status: 401 });

  const resolvedParams = await params;
  const todoId = parseInt(resolvedParams.id, 10);

  const deleted = db.deleteTodo(todoId);
  if (!deleted) {
    return NextResponse.json({ detail: 'Task not found.' }, { status: 404 });
  }
  return NextResponse.json({ success: true, message: 'Task deleted successfully.' });
}
