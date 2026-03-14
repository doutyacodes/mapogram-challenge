// /api/issues/[id]/assign/route.js
import { NextResponse } from 'next/server';
import { db } from '@/utils';
import { USER_POST_ISSUE_DETAILS } from '@/utils/schema/centers_schema';
import { eq } from 'drizzle-orm';
import jwt from 'jsonwebtoken';

export async function PATCH(request, { params }) {
  try {
    const { id } = params;
    const { assigned_to_user_id } = await request.json();

    const token = request.cookies.get("user_token")?.value;
    
    if (!token) {
      return NextResponse.json({ success: false, message: "Authentication required" }, { status: 401 });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded?.id;

    if (!userId) {
      return NextResponse.json({ success: false, message: "Invalid token" }, { status: 401 });
    }

    // Assign user to issue
    await db
      .update(USER_POST_ISSUE_DETAILS)
      .set({ 
        assigned_to_user_id: parseInt(assigned_to_user_id),
        assigned_by_user_id: userId,
        self_assigned: false,
        updated_at: new Date()
      })
      .where(eq(USER_POST_ISSUE_DETAILS.post_id, parseInt(id)));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error assigning user:', error);
    return NextResponse.json(
      { error: 'Failed to assign user' },
      { status: 500 }
    );
  }
}