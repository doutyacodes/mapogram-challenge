// /api/layer/[id]/route.js - Get layer data
import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { db } from '@/utils';
import { LAYERS } from '@/utils/schema/schema';
import { eq } from 'drizzle-orm';

export async function GET(req, { params }) {
  try {
    // const token = req.cookies.get("user_token")?.value;
    // if (!token) {
    //   return NextResponse.json({ message: "Authentication required" }, { status: 401 });
    // }

    // const decoded = jwt.verify(token, process.env.JWT_SECRET);
    // if (!decoded?.id) {
    //   return NextResponse.json({ message: "Invalid user token" }, { status: 400 });
    // }

    const layerId = parseInt(params.id);

    const layerData = await db
      .select({
        id: LAYERS.id,
        name: LAYERS.name,
        isPermanent: LAYERS.is_permanent,
      })
      .from(LAYERS)
      .where(eq(LAYERS.id, layerId));

    if (layerData.length === 0) {
      return NextResponse.json({ message: "Layer not found" }, { status: 404 });
    }

    return NextResponse.json(layerData[0]);
  } catch (error) {
    console.error("Error fetching layer data:", error);
    return NextResponse.json({ message: "Failed to fetch layer data" }, { status: 500 });
  }
}