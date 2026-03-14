// /api/user/accounts/route.js - Get all accounts (user + pages) for the current user
import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { db } from '@/utils';
import { 
  USERS, 
  USER_PROFILES, 
  PAGES, 
  PAGE_PROFILES, 
  PAGE_ADMINS 
} from '@/utils/schema/schema';
import { eq } from 'drizzle-orm';

export async function GET(req) {
  try {
    const token = req.cookies.get("user_token")?.value;

    if (!token) {
      return NextResponse.json({ message: "Authentication required" }, { status: 401 });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (!decoded?.id) {
      return NextResponse.json({ message: "Invalid user token" }, { status: 400 });
    }

    const userId = decoded.id;
    const accounts = [];

    // 1. Get user account with profile
    const userAccount = await db
      .select({
        id: USERS.id,
        name: USERS.name,
        username: USERS.username,
        bio: USER_PROFILES.bio,
        profile_pic_url: USER_PROFILES.profile_pic_url,
      })
      .from(USERS)
      .leftJoin(USER_PROFILES, eq(USER_PROFILES.user_id, USERS.id))
      .where(eq(USERS.id, userId));

    if (userAccount.length > 0) {
      accounts.push({
        type: 'user',
        id: userAccount[0].id,
        name: userAccount[0].name,
        username: userAccount[0].username,
        bio: userAccount[0].bio,
        profile_pic_url: userAccount[0].profile_pic_url,
      });
    }

    // 2. Get all pages where user is admin/owner
    const pageAccounts = await db
      .select({
        id: PAGES.id,
        name: PAGES.name,
        username: PAGES.username,
        bio: PAGE_PROFILES.bio,
        profile_pic_url: PAGE_PROFILES.profile_pic_url,
        is_owner: PAGE_ADMINS.is_owner,
      })
      .from(PAGES)
      .innerJoin(PAGE_ADMINS, eq(PAGE_ADMINS.page_id, PAGES.id))
      .leftJoin(PAGE_PROFILES, eq(PAGE_PROFILES.page_id, PAGES.id))
      .where(eq(PAGE_ADMINS.user_id, userId));

    // Add page accounts
    pageAccounts.forEach(page => {
      accounts.push({
        type: 'page',
        id: page.id,
        name: page.name,
        username: page.username,
        bio: page.bio,
        profile_pic_url: page.profile_pic_url,
        is_owner: page.is_owner,
      });
    });

    return NextResponse.json({ accounts });
  } catch (error) {
    console.error("Error fetching user accounts:", error);
    return NextResponse.json({ message: "Failed to fetch accounts" }, { status: 500 });
  }
}