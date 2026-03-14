import { NextResponse } from 'next/server';
import { db } from '@/utils';
import { USERS, PAGES } from '@/utils/schema/schema';
import { like, or } from 'drizzle-orm';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');

    if (!query) {
      return NextResponse.json(
        { message: 'Search query required' },
        { status: 400 }
      );
    }

    // Search Users
    const userResults = await db
      .select({
        id: USERS.id,
        username: USERS.username,
        name: USERS.name,
      })
      .from(USERS)
      .where(
        or(
          like(USERS.username, `%${query}%`),
          like(USERS.name, `%${query}%`)
        )
      )
      .limit(10)
      .execute();

    // Add type field
    const typedUserResults = userResults.map((user) => ({
      ...user,
      type: 'user',
    }));

    // Search Pages
    const pageResults = await db
      .select({
        id: PAGES.id,
        username: PAGES.username,
        name: PAGES.name,
      })
      .from(PAGES)
      .where(
        or(
          like(PAGES.username, `%${query}%`),
          like(PAGES.name, `%${query}%`)
        )
      )
      .limit(10)
      .execute();

    const typedPageResults = pageResults.map((page) => ({
      ...page,
      type: 'page',
    }));

    // Combine both results
    const combinedResults = [...typedUserResults, ...typedPageResults];

    return NextResponse.json({
      results: combinedResults,
    });

  } catch (error) {
    console.error('Error searching users and pages:', error);
    return NextResponse.json(
      { message: 'Failed to search', error: error.message },
      { status: 500 }
    );
  }
}
