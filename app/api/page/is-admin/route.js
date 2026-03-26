import { isUserPageAdmin } from '@/lib/permissions/page-permissions';
import { jwtVerify } from 'jose';
import { NextResponse } from 'next/server';

export async function GET(req) {
  const token = req.cookies.get('user_token')?.value;
  if (!token) {
    return NextResponse.json({ isAdmin: false });
  }
  const decoded = await jwtVerify(token, new TextEncoder().encode(process.env.JWT_SECRET));
  const userId = decoded.payload.id;

  const { searchParams } = new URL(req.url);
  const pageId = parseInt(searchParams.get("pageId"));

  const isAdmin = await isUserPageAdmin(userId, pageId);

  return NextResponse.json({ isAdmin });
}
