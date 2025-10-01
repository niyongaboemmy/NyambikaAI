import { NextResponse } from "next/server";

// Simple presence mock: online if current minute is even
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const now = new Date();
  const isOnline = now.getMinutes() % 2 === 0;
  return NextResponse.json({
    producerId: id,
    isOnline,
    lastSeen: isOnline ? null : new Date(now.getTime() - 5 * 60 * 1000).toISOString(),
  });
}
