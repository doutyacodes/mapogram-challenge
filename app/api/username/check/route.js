// app\api\username\check\route.js
import { db } from '@/utils';
import { USERNAMES } from '@/utils/schema/schema';
import { eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const username = searchParams.get('username');

  if (!username || username.trim().length < 2) {
    return NextResponse.json({ valid: false, reason: 'Username too short' });
  }

  const [existing] = await db
    .select()
    .from(USERNAMES)
    .where(eq(USERNAMES.username, username.trim().toLowerCase()));

  if (existing) {
    return NextResponse.json({ available: false });
  }

  return NextResponse.json({ available: true });
}
