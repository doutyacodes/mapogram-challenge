
// 2. /api/posts/languages/route.js - Get all languages
import { NextResponse } from 'next/server';
import { db } from '@/utils';
import { LANGUAGES } from '@/utils/schema/schema';

export async function GET() {
  try {
    const languages = await db
      .select({
        id: LANGUAGES.id,
        name: LANGUAGES.name,
        code: LANGUAGES.code,
      })
      .from(LANGUAGES)
      .orderBy(LANGUAGES.name);

    return NextResponse.json({ languages });
  } catch (error) {
    console.error('Error fetching languages:', error);
    return NextResponse.json(
      { message: 'Failed to fetch languages' },
      { status: 500 }
    );
  }
}