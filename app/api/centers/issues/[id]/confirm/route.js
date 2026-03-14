// /api/issues/[id]/confirm/route.js
import { NextResponse } from 'next/server';
import { db } from '@/utils';
import { USER_POST_ISSUE_DETAILS } from '@/utils/schema/centers_schema';
import { eq } from 'drizzle-orm';

export async function PATCH(request, { params }) {
  try {
    const { id } = params;
    const { confirmed } = await request.json();

    let updateData = {
      user_confirmed_at: new Date(),
      updated_at: new Date()
    };

    if (confirmed) {
      updateData.user_confirmation_status = 'confirmed';
    } else {
      // If user rejects completion, set status back to in_progress
      updateData.user_confirmation_status = 'rejected';
      updateData.status = 'in_progress';
    }

    await db
      .update(USER_POST_ISSUE_DETAILS)
      .set(updateData)
      .where(eq(USER_POST_ISSUE_DETAILS.post_id, parseInt(id)));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error confirming issue:', error);
    return NextResponse.json(
      { error: 'Failed to confirm issue' },
      { status: 500 }
    );
  }
}