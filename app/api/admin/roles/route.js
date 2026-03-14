import { NextResponse } from "next/server";
import { db } from "@/utils";
import { USER_ROLES } from "@/utils/schema/schema";

export async function GET() {
  try {
    const roles = await db
      .select({
        id: USER_ROLES.id,
        role_name: USER_ROLES.role_name,
      })
      .from(USER_ROLES)
      .execute();

    return NextResponse.json(roles);
  } catch (error) {
    console.error("Error fetching roles:", error);
    return NextResponse.json(
      { message: "Failed to fetch roles" },
      { status: 500 }
    );
  }
}