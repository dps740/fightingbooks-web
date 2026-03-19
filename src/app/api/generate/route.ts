import { NextResponse } from 'next/server';

// This endpoint has been disabled. Book generation is handled by /api/book/start.
export async function POST() {
  return NextResponse.json({ error: 'Not found' }, { status: 404 });
}

export async function GET() {
  return NextResponse.json({ error: 'Not found' }, { status: 404 });
}
