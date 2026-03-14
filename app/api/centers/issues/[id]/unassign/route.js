// /api/issues/[id]/unassign/route.js
import { NextResponse } from 'next/server';
import { db } from '@/utils';
import { USER_POST_ISSUE_DETAILS } from '@/utils/schema/centers_schema';
import { eq } from 'drizzle-orm';

export async function PATCH(request, { params }) {
  try {
    const { id } = params;

    // Unassign user from issue
    await db
      .update(USER_POST_ISSUE_DETAILS)
      .set({ 
        assigned_to_user_id: null,
        assigned_by_user_id: null,
        self_assigned: false,
        updated_at: new Date()
      })
      .where(eq(USER_POST_ISSUE_DETAILS.post_id, parseInt(id)));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error unassigning user:', error);
    return NextResponse.json(
      { error: 'Failed to unassign user' },
      { status: 500 }
    );
  }
}