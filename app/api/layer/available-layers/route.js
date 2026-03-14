
// /api/posts/layers/route.js - Get layers for a category
import { NextResponse } from 'next/server';
import { db } from '@/utils';
import { LAYERS, CATEGORY_LAYER_MAP } from '@/utils/schema/schema';
import { eq } from 'drizzle-orm';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const categoryId = searchParams.get('categoryId');

    if (!categoryId) {
      return NextResponse.json(
        { message: 'Category ID is required' },
        { status: 400 }
      );
    }

    const layers = await db
      .select({
        id: LAYERS.id,
        name: LAYERS.name,
      })
      .from(LAYERS)
      .innerJoin(CATEGORY_LAYER_MAP, eq(CATEGORY_LAYER_MAP.layer_id, LAYERS.id))
      .where(eq(CATEGORY_LAYER_MAP.category_id, categoryId));

    return NextResponse.json({ layers });
  } catch (error) {
    console.error('Error fetching layers:', error);
    return NextResponse.json(
      { message: 'Failed to fetch layers' },
      { status: 500 }
    );
  }
}
