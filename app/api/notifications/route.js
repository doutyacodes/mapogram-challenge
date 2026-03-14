// /api/notifications/route.js - Get notifications based on current identity
import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { db } from '@/utils';
import { 
  USERS, 
  USER_PROFILES, 
  PAGES, 
  PAGE_PROFILES 
} from '@/utils/schema/schema';

import { 
  USER_NOTIFICATIONS, 
} from '@/utils/schema/friendsLayer_schema';

import { eq, desc, and, inArray } from 'drizzle-orm';

export async function GET(req) {
  try {
    const token = req.cookies.get("user_token")?.value;
    const { searchParams } = new URL(req.url);
    const currentIdentityType = searchParams.get('identity_type'); // 'user' or 'page'
    const currentIdentityId = searchParams.get('identity_id');

    if (!token) {
      return NextResponse.json({ message: "Authentication required" }, { status: 401 });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (!decoded?.id) {
      return NextResponse.json({ message: "Invalid user token" }, { status: 400 });
    }

    const loggedInUserId = decoded.id;

    let notifications = [];

    if (currentIdentityType === 'user') {
      // User view - show all notifications for this user
      notifications = await db
        .select({
          id: USER_NOTIFICATIONS.id,
          type: USER_NOTIFICATIONS.type,
          message: USER_NOTIFICATIONS.message,
          metadata: USER_NOTIFICATIONS.metadata,
          is_read: USER_NOTIFICATIONS.is_read,
          created_at: USER_NOTIFICATIONS.created_at,
        })
        .from(USER_NOTIFICATIONS)
        .where(eq(USER_NOTIFICATIONS.user_id, loggedInUserId))
        .orderBy(desc(USER_NOTIFICATIONS.created_at));
    } else if (currentIdentityType === 'page') {
      // Page view - show only page-related notifications
      const allowedTypes = ['follow_page', 'tagged_in_post'];
      
      notifications = await db
        .select({
          id: USER_NOTIFICATIONS.id,
          type: USER_NOTIFICATIONS.type,
          message: USER_NOTIFICATIONS.message,
          metadata: USER_NOTIFICATIONS.metadata,
          is_read: USER_NOTIFICATIONS.is_read,
          created_at: USER_NOTIFICATIONS.created_at,
        })
        .from(USER_NOTIFICATIONS)
        .where(
          and(
            eq(USER_NOTIFICATIONS.user_id, loggedInUserId),
            inArray(USER_NOTIFICATIONS.type, allowedTypes)
          )
        )
        .orderBy(desc(USER_NOTIFICATIONS.created_at));
    } else {
      return NextResponse.json({ message: "Invalid identity type" }, { status: 400 });
    }

    // Enrich notifications with additional data
    const enrichedNotifications = await Promise.all(
      notifications.map(async (notification) => {
        const metadata = notification.metadata;
        let additionalData = {};

        try {
          switch (notification.type) {
            case 'follow_page':
              if (metadata?.follower_id) {
                const follower = await db
                  .select({
                    id: USERS.id,
                    name: USERS.name,
                    username: USERS.username,
                    profile_pic_url: USER_PROFILES.profile_pic_url,
                  })
                  .from(USERS)
                  .leftJoin(USER_PROFILES, eq(USER_PROFILES.user_id, USERS.id))
                  .where(eq(USERS.id, metadata.follower_id))
                  .limit(1);

                if (follower[0]) {
                  additionalData.follower = follower[0];
                }
              }
              break;

            case 'friend_request':
              if (metadata?.sender_id) {
                const sender = await db
                  .select({
                    id: USERS.id,
                    name: USERS.name,
                    username: USERS.username,
                    profile_pic_url: USER_PROFILES.profile_pic_url,
                  })
                  .from(USERS)
                  .leftJoin(USER_PROFILES, eq(USER_PROFILES.user_id, USERS.id))
                  .where(eq(USERS.id, metadata.sender_id))
                  .limit(1);

                if (sender[0]) {
                  additionalData.sender = sender[0];
                }
              }
              break;

            case 'friend_accept':
              if (metadata?.accepter_id) {
                const accepter = await db
                  .select({
                    id: USERS.id,
                    name: USERS.name,
                    username: USERS.username,
                    profile_pic_url: USER_PROFILES.profile_pic_url,
                  })
                  .from(USERS)
                  .leftJoin(USER_PROFILES, eq(USER_PROFILES.user_id, USERS.id))
                  .where(eq(USERS.id, metadata.accepter_id))
                  .limit(1);

                if (accepter[0]) {
                  additionalData.accepter = accepter[0];
                }
              }
              break;

            case 'tagged_in_post':
              if (metadata?.tagger_id) {
                const tagger = await db
                  .select({
                    id: USERS.id,
                    name: USERS.name,
                    username: USERS.username,
                    profile_pic_url: USER_PROFILES.profile_pic_url,
                  })
                  .from(USERS)
                  .leftJoin(USER_PROFILES, eq(USER_PROFILES.user_id, USERS.id))
                  .where(eq(USERS.id, metadata.tagger_id))
                  .limit(1);

                if (tagger[0]) {
                  additionalData.tagger = tagger[0];
                }
              }
              break;
          }
        } catch (err) {
          console.error(`Error enriching notification ${notification.id}:`, err);
        }

        return {
          ...notification,
          ...additionalData,
        };
      })
    );

    return NextResponse.json({ 
      notifications: enrichedNotifications,
      unread_count: enrichedNotifications.filter(n => !n.is_read).length
    });

  } catch (error) {
    console.error("Error fetching notifications:", error);
    return NextResponse.json({ message: "Failed to fetch notifications" }, { status: 500 });
  }
}