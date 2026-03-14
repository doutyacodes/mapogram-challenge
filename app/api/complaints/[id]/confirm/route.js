// app/api/complaints/[id]/confirm/route.js
import { NextResponse } from 'next/server';
import { db } from '@/utils';
import { USER_COMPLAINT_POSTS, USER_POSTS } from '@/utils/schema/complaints_schema';
import { eq } from 'drizzle-orm';

export async function PATCH(request, { params }) {
  try {
    const { id } = params;
    const { confirmed } = await request.json();

    // ✅ Validate ID
    if (!id) {
      return NextResponse.json({ error: 'Complaint ID is required' }, { status: 400 });
    }

    // ✅ Validate confirmed parameter
    if (typeof confirmed !== 'boolean') {
      return NextResponse.json({ error: 'Invalid confirmation value' }, { status: 400 });
    }

    // ✅ Get the current complaint to verify it's in completed status
    const complaint = await db
      .select()
      .from(USER_COMPLAINT_POSTS)
      .where(eq(USER_COMPLAINT_POSTS.post_id, parseInt(id)))
      .limit(1);

    if (!complaint || complaint.length === 0) {
      return NextResponse.json({ error: 'Complaint not found' }, { status: 404 });
    }

    const currentComplaint = complaint[0];

    // ✅ Verify the complaint is in completed status
    if (currentComplaint.status !== 'completed') {
      return NextResponse.json({ 
        error: 'Complaint must be in completed status to confirm' 
      }, { status: 400 });
    }

    // ✅ Build update data based on confirmation
    const updateData = {
      user_confirmation_status: confirmed ? 'confirmed' : 'rejected',
      user_confirmed_at: new Date(),
    };

    // ✅ If user rejects the completion, set status back to pending
    if (!confirmed) {
      updateData.status = 'pending';
      updateData.completed_at = null;
    }

    // ✅ Update database
    const result = await db
      .update(USER_COMPLAINT_POSTS)
      .set(updateData)
      .where(eq(USER_COMPLAINT_POSTS.post_id, parseInt(id)))
      .execute();

    if (result.affectedRows === 0) {
      return NextResponse.json({ error: 'Failed to update complaint' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: confirmed 
        ? 'Complaint completion confirmed successfully' 
        : 'Complaint reopened for further work',
      confirmed,
    });
  } catch (error) {
    console.error('Error confirming complaint status:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}