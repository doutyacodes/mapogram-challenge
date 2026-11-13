// GET /api/challenge-pages/:id/items?district_id=N - map items of one district, by category
import { NextResponse } from "next/server";
import { getDistrictItems, toId } from "@/utils/challengePages";

export async function GET(req, { params }) {
  const pageId = toId((await params).id);
  const districtId = toId(new URL(req.url).searchParams.get("district_id"));
  if (!pageId || !districtId) {
    return NextResponse.json({ message: "page id and district_id are required" }, { status: 400 });
  }

  try {
    const items = await getDistrictItems(pageId, districtId);
    return NextResponse.json({ items });
  } catch (error) {
    console.error("GET /api/challenge-pages/:id/items failed:", error);
    return NextResponse.json({ message: "Failed to load items" }, { status: 500 });
  }
}
