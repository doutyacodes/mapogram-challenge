// app/api/complaints/[id]/status/route.js
import { NextResponse } from 'next/server';
import { db } from '@/utils';
import { USER_COMPLAINT_POSTS } from '@/utils/schema/complaints_schema';
import { eq } from 'drizzle-orm';

export async function PATCH(request, { params }) {
  try {
    const { id } = params;
    const { status } = await request.json();

    // ✅ Validate ID
    if (!id) {
      return NextResponse.json({ error: 'Complaint ID is required' }, { status: 400 });
    }

    // ✅ Validate status
    const validStatuses = ['pending', 'in_progress', 'completed', 'rejected'];
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    }

    // ✅ Build update data
    const updateData = {
      status,
      completed_at: status === 'completed' ? new Date() : null,
    };

    // ✅ When status is set to completed, reset user confirmation to pending
    if (status === 'completed') {
      updateData.user_confirmation_status = 'pending';
      updateData.user_confirmed_at = null;
    }

    // ✅ If changing from completed to any other status, reset user confirmation
    if (status !== 'completed') {
      updateData.user_confirmation_status = 'pending';
      updateData.user_confirmed_at = null;
    }

    // ✅ Update database
    const result = await db
      .update(USER_COMPLAINT_POSTS)
      .set(updateData)
      .where(eq(USER_COMPLAINT_POSTS.post_id, parseInt(id)))
      .execute();

    if (result.affectedRows === 0) {
      return NextResponse.json({ error: 'Complaint not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: `Complaint status updated to '${status}'${status === 'completed' ? ' - awaiting user confirmation' : ''}`,
    });
  } catch (error) {
    console.error('Error updating complaint status:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}