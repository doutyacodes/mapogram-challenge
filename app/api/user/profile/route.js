import { NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
import { db } from '@/utils';
import { PAGES, PAGE_PROFILES, USERS, USER_PROFILES, ROLES } from '@/utils/schema/schema';
import { eq } from 'drizzle-orm';
import { createGuestIdentity } from '@/utils/guests/guestUser';

export async function GET(req) {
    const token = req.cookies.get('user_token')?.value;
    if (!token) {
      // ✅ Return a fresh guest session if no token
      const sessionId = Math.random().toString(36).substring(7);
      return NextResponse.json({
        isGuest: true,
        sessionId: sessionId,
        identity: {
          ...createGuestIdentity(sessionId),
          role: 'guest',
          role_display_name: 'Guest User',
        },
        loggedInUserId: null,
      });
    }

  try {
    const secret = new TextEncoder().encode(process.env.JWT_SECRET);
    const decoded = await jwtVerify(token, secret);
    const payload = decoded.payload;

    // ✅ Guest user case
    if (payload.isGuest) {
      return NextResponse.json({
        isGuest: true,
        sessionId: payload.sessionId,
        identity: {
          ...createGuestIdentity(payload.sessionId),
          role: 'guest',
          role_display_name: 'Guest User',
        },
        loggedInUserId: null,
      });
    }

    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type');
    const id = searchParams.get('id') ? parseInt(searchParams.get('id')) : null;
    const loggedInUserId = payload.id;

    // ✅ Case 1: Logged-in user (no params)
    if (!type && !id) {
      const userProfile = await db
        .select({
          id: USERS.id,
          name: USERS.name,
          username: USERS.username,
          profile_pic_url: USER_PROFILES.profile_pic_url,
          bio: USER_PROFILES.bio,
          role: ROLES.name,
          role_display_name: ROLES.display_name,
        })
        .from(USERS)
        .leftJoin(USER_PROFILES, eq(USERS.id, USER_PROFILES.user_id))
        .leftJoin(ROLES, eq(USERS.role_id, ROLES.id))
        .where(eq(USERS.id, loggedInUserId))
        .execute();

      if (userProfile.length === 0) {
        return NextResponse.json({ message: 'User not found' }, { status: 404 });
      }

      return NextResponse.json({
        loggedInUserId,
        identity: { type: 'user', ...userProfile[0] },
      });
    }

    // ❌ Invalid query params
    if (!id || (type !== 'user' && type !== 'page')) {
      return NextResponse.json({ message: 'Invalid request' }, { status: 400 });
    }

    // ✅ Case 2: Fetch a user by ID
    if (type === 'user') {
      const userProfile = await db
        .select({
          id: USERS.id,
          name: USERS.name,
          username: USERS.username,
          profile_pic_url: USER_PROFILES.profile_pic_url,
          bio: USER_PROFILES.bio,
          role: ROLES.name,
          role_display_name: ROLES.display_name,
        })
        .from(USERS)
        .leftJoin(USER_PROFILES, eq(USERS.id, USER_PROFILES.user_id))
        .leftJoin(ROLES, eq(USERS.role_id, ROLES.id))
        .where(eq(USERS.id, id))
        .execute();

      if (userProfile.length === 0) {
        return NextResponse.json({ message: 'User not found' }, { status: 404 });
      }

      return NextResponse.json({
        loggedInUserId,
        identity: { type: 'user', ...userProfile[0] },
      });
    }

    // ✅ Case 3: Fetch a page by ID
    if (type === 'page') {
      const pageProfile = await db
        .select({
          id: PAGES.id,
          name: PAGES.name,
          username: PAGES.username,
          profile_pic_url: PAGE_PROFILES.profile_pic_url,
          bio: PAGE_PROFILES.bio,
        })
        .from(PAGES)
        .leftJoin(PAGE_PROFILES, eq(PAGES.id, PAGE_PROFILES.page_id))
        .where(eq(PAGES.id, id))
        .execute();

      if (pageProfile.length === 0) {
        return NextResponse.json({ message: 'Page not found' }, { status: 404 });
      }

      // ✅ Fetch the logged-in user's role (to attach same role structure)
      const [loggedInUser] = await db
        .select({
          role: ROLES.name,
          role_display_name: ROLES.display_name,
        })
        .from(USERS)
        .leftJoin(ROLES, eq(USERS.role_id, ROLES.id))
        .where(eq(USERS.id, loggedInUserId))
        .execute();

      return NextResponse.json({
        loggedInUserId,
        identity: {
          type: 'page',
          ...pageProfile[0],
          role: loggedInUser?.role || null,
          role_display_name: loggedInUser?.role_display_name || null,
        },
      });
    }

    return NextResponse.json({ message: 'Unknown error' }, { status: 500 });

  } catch (error) {
    console.error('JWT verification failed:', error);
    return NextResponse.json({ message: 'Invalid token' }, { status: 401 });
  }
}
