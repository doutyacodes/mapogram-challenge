import { NextResponse } from "next/server";
import { db } from "@/utils";
import { USER_COMPLAINT_DETAILS, COMPLAINT_STATUS_LOGS } from "@/utils/schema/community_schema";
import { eq } from "drizzle-orm";
import { jwtVerify } from "jose";

export async function POST(req) {
  try {
    // ✅ Get user from token
    const token = req.cookies.get("user_token")?.value;
    if (!token) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const secret = new TextEncoder().encode(process.env.JWT_SECRET);
    const decoded = await jwtVerify(token, secret);
    const userId = decoded.payload.id;

    // ✅ Parse request body
    const body = await req.json();
    const { complaint_id, post_id, new_status, remarks } = body;

    // ✅ Validate inputs
    if (!complaint_id || !new_status) {
      return NextResponse.json(
        { message: "Missing required fields: complaint_id or new_status" },
        { status: 400 }
      );
    }

    // ✅ Perform transaction
    await db.transaction(async (tx) => {
      // 1️⃣ Update complaint status
      await tx
        .update(USER_COMPLAINT_DETAILS)
        .set({
          status: new_status,
          updated_at: new Date(),
        })
        .where(eq(USER_COMPLAINT_DETAILS.id, complaint_id));

      // 2️⃣ Insert into status logs
      await tx.insert(COMPLAINT_STATUS_LOGS).values({
        complaint_id,
        post_id: post_id || null, // optional if you want to log which post
        updated_by: userId,
        new_status,
        remarks: remarks || null,
        updated_at: new Date(),
      });
    });

    return NextResponse.json(
      {
        success: true,
        message: "Complaint status updated successfully",
        data: {
          complaint_id,
          new_status,
          updated_by: userId,
          updated_at: new Date(),
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("❌ Error updating complaint status:", error);
    return NextResponse.json(
      { message: "Internal server error", error: error.message },
      { status: 500 }
    );
  }
}
