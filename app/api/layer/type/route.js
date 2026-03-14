// app/api/layer/type/route.js or route.ts

import { db } from '@/utils';
import { LAYERS } from '@/utils/schema/schema';
import { eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const layerId = searchParams.get("layerId");

    if (!layerId) {
      return NextResponse.json({ error: "Missing layerId" }, { status: 400 });
    }

    const layer = await db
      .select()
      .from(LAYERS)
      .where(eq(LAYERS.id, Number(layerId)))
      .then(rows => rows[0]);

    if (!layer) {
      return NextResponse.json({ error: "Layer not found" }, { status: 404 });
    }

    const name = layer.name?.toLowerCase() || '';
    let type = 'general';
    if (name.includes('job')) type = 'job';
    else if (name.includes('news')) type = 'news';
    else if (name.includes('event')) type = 'event';
    else if (name.includes('friend')) type = 'myfriends';
    else if (name.includes('classifieds')) type = 'classifieds';

    return NextResponse.json({ type });
  } catch (error) {
    console.error("Error fetching layer type:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
