// /api/issues/[id]/status/route.js
import { NextResponse } from 'next/server';
import { db } from '@/utils';
import { USER_POST_ISSUE_DETAILS } from '@/utils/schema/centers_schema';
import { eq } from 'drizzle-orm';

export async function PATCH(request, { params }) {
  try {
    const { id } = params;
    const { status } = await request.json();

    // Validate status
    const validStatuses = ['pending', 'in_progress', 'completed'];
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status' },
        { status: 400 }
      );
    }

    // Update issue status
    await db
      .update(USER_POST_ISSUE_DETAILS)
      .set({ 
        status,
        updated_at: new Date()
      })
      .where(eq(USER_POST_ISSUE_DETAILS.post_id, parseInt(id)));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating issue status:', error);
    return NextResponse.json(
      { error: 'Failed to update status' },
      { status: 500 }
    );
  }
}