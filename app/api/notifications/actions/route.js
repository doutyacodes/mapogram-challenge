// /api/notifications/actions/route.js - Handle notification actions
import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { db } from '@/utils';
import { 
  USER_NOTIFICATIONS, 
  FRIEND_REQUESTS,
  FRIENDS,
} from '@/utils/schema/friendsLayer_schema';
import { 
  POST_TAGS
} from '@/utils/schema/schema';
import { eq, and } from 'drizzle-orm';


export async function PATCH(req) {
  try {
    const token = req.cookies.get("user_token")?.value;

    if (!token) {
      return NextResponse.json({ message: "Authentication required" }, { status: 401 });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (!decoded?.id) {
      return NextResponse.json({ message: "Invalid user token" }, { status: 400 });
    }

    const loggedInUserId = decoded.id;
    const { action, notification_id, notification_type, metadata } = await req.json();

    // Verify notification belongs to user
    const notification = await db
      .select()
      .from(USER_NOTIFICATIONS)
      .where(
        and(
          eq(USER_NOTIFICATIONS.id, notification_id),
          eq(USER_NOTIFICATIONS.user_id, loggedInUserId)
        )
      )
      .limit(1);

    if (!notification[0]) {
      return NextResponse.json({ message: "Notification not found" }, { status: 404 });
    }

    const notif = notification[0];
    
    // Parse metadata if it's a string
    let parsedMetadata = notif.metadata;
    if (typeof notif.metadata === 'string') {
      try {
        parsedMetadata = JSON.parse(notif.metadata);
      } catch (err) {
        console.error('Failed to parse notification metadata:', err);
        parsedMetadata = {};
      }
    }
    
    console.log('Notification found:', notif);
    console.log('Parsed metadata:', parsedMetadata);
    console.log('Request metadata:', metadata);

    switch (action) {
      case 'mark_read':
        await db
          .update(USER_NOTIFICATIONS)
          .set({ is_read: true })
          .where(eq(USER_NOTIFICATIONS.id, notification_id));
        
        return NextResponse.json({ message: "Notification marked as read" });

      case 'accept_friend_request':
        if (notif.type !== 'friend_request') {
          return NextResponse.json({ message: "Invalid action for notification type" }, { status: 400 });
        }

        // Get sender_id from the notification's stored metadata or from the request metadata
        const senderUserId = parsedMetadata?.sender_id || metadata?.sender_id;
        if (!senderUserId) {
          console.error('Missing sender_id. Parsed metadata:', parsedMetadata, 'Request metadata:', metadata);
          return NextResponse.json({ message: "Invalid notification metadata" }, { status: 400 });
        }

        // Update friend request status
        await db
          .update(FRIEND_REQUESTS)
          .set({ 
            status: 'accepted',
            responded_at: new Date()
          })
          .where(
            and(
              eq(FRIEND_REQUESTS.sender_id, senderUserId),
              eq(FRIEND_REQUESTS.receiver_id, loggedInUserId),
              eq(FRIEND_REQUESTS.status, 'pending')
            )
          );

        // Add to friends table (ensure lower ID is user1_id)
        const user1Id = Math.min(senderUserId, loggedInUserId);
        const user2Id = Math.max(senderUserId, loggedInUserId);

        await db.insert(FRIENDS).values({
          user1_id: user1Id,
          user2_id: user2Id,
          became_friends_at: new Date()
        });

        // Mark notification as read
        await db
          .update(USER_NOTIFICATIONS)
          .set({ is_read: true })
          .where(eq(USER_NOTIFICATIONS.id, notification_id));

        // Create acceptance notification for sender
        await db.insert(USER_NOTIFICATIONS).values({
          user_id: senderUserId,
          type: 'friend_accept',
          message: `${decoded.name || 'Someone'} accepted your friend request`,
          metadata: { accepter_id: loggedInUserId },
          is_read: false
        });

        return NextResponse.json({ message: "Friend request accepted" });

      case 'reject_friend_request':
        if (notif.type !== 'friend_request') {
          return NextResponse.json({ message: "Invalid action for notification type" }, { status: 400 });
        }

        // Get sender_id from the notification's stored metadata or from the request metadata
        const rejectSenderId = parsedMetadata?.sender_id || metadata?.sender_id;
        if (!rejectSenderId) {
          console.error('Missing sender_id. Parsed metadata:', parsedMetadata, 'Request metadata:', metadata);
          return NextResponse.json({ message: "Invalid notification metadata" }, { status: 400 });
        }

        // Update friend request status
        await db
          .update(FRIEND_REQUESTS)
          .set({ 
            status: 'rejected',
            responded_at: new Date()
          })
          .where(
            and(
              eq(FRIEND_REQUESTS.sender_id, rejectSenderId),
              eq(FRIEND_REQUESTS.receiver_id, loggedInUserId),
              eq(FRIEND_REQUESTS.status, 'pending')
            )
          );

        // Mark notification as read
        await db
          .update(USER_NOTIFICATIONS)
          .set({ is_read: true })
          .where(eq(USER_NOTIFICATIONS.id, notification_id));

        return NextResponse.json({ message: "Friend request rejected" });

      case 'accept_tag':
        if (notif.type !== 'tagged_in_post') {
          return NextResponse.json({ message: "Invalid action for notification type" }, { status: 400 });
        }

        const postId = parsedMetadata?.post_id;
        const taggedType = parsedMetadata?.tagged_type;
        const taggedId = parseInt(metadata?.tagged_id) || loggedInUserId;

        if (!postId || !taggedType) {
          return NextResponse.json({ message: "Invalid notification metadata" }, { status: 400 });
        }

        // Update post tag to accepted
        await db
          .update(POST_TAGS)
          .set({ is_accepted: true })
          .where(
            and(
              eq(POST_TAGS.post_id, postId),
              eq(POST_TAGS.tagged_type, taggedType),
              eq(POST_TAGS.tagged_id, taggedId)
            )
          );

        // Mark notification as read
        await db
          .update(USER_NOTIFICATIONS)
          .set({ is_read: true })
          .where(eq(USER_NOTIFICATIONS.id, notification_id));

        return NextResponse.json({ message: "Tag accepted" });

      case 'reject_tag':
        if (notif.type !== 'tagged_in_post') {
          return NextResponse.json({ message: "Invalid action for notification type" }, { status: 400 });
        }

        const rejectPostId = parsedMetadata?.post_id;
        const rejectTaggedType = parsedMetadata?.tagged_type;
        const rejectTaggedId = parseInt(metadata?.tagged_id) || loggedInUserId;

        if (!rejectPostId || !rejectTaggedType) {
          return NextResponse.json({ message: "Invalid notification metadata" }, { status: 400 });
        }

        // Delete the post tag
        await db
          .delete(POST_TAGS)
          .where(
            and(
              eq(POST_TAGS.post_id, rejectPostId),
              eq(POST_TAGS.tagged_type, rejectTaggedType),
              eq(POST_TAGS.tagged_id, rejectTaggedId)
            )
          );

        // Mark notification as read
        await db
          .update(USER_NOTIFICATIONS)
          .set({ is_read: true })
          .where(eq(USER_NOTIFICATIONS.id, notification_id));

        return NextResponse.json({ message: "Tag rejected" });

      default:
        return NextResponse.json({ message: "Invalid action" }, { status: 400 });
    }

  } catch (error) {
    console.error("Error handling notification action:", error);
    return NextResponse.json({ message: "Failed to process action" }, { status: 500 });
  }
}