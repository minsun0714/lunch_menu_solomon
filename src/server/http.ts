import { NextResponse } from 'next/server';
import { ApiError } from '@/server/errors';

export function ok<T>(data: T, init?: ResponseInit) {
  return NextResponse.json({ success: true, data }, init);
}

export function created<T>(data: T) {
  return NextResponse.json({ success: true, data }, { status: 201 });
}

export function okMessage(message: string) {
  return NextResponse.json({ success: true, message });
}

export function fail(status: number, error: string) {
  return NextResponse.json({ success: false, error }, { status });
}

// Route handlers only translate HTTP <-> services; unexpected failures become a logged generic error.
export async function handleRoute(
  fallback: { status?: number; error: string; log?: string },
  run: () => Promise<NextResponse>,
): Promise<NextResponse> {
  try {
    return await run();
  } catch (error) {
    if (error instanceof ApiError) return fail(error.status, error.message);
    if (fallback.log) console.error(fallback.log, error);
    return fail(fallback.status ?? 500, fallback.error);
  }
}
