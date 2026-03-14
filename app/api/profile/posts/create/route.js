// /api/profile/posts/create/route.js
import { NextResponse } from 'next/server';
import { db } from '@/utils';
import { 
  USER_POSTS,
  POST_LAYER_MAP,
  POST_TAGS
} from '@/utils/schema/schema';
import jwt from 'jsonwebtoken';
import { USER_NOTIFICATIONS, USER_PERSONAL_EVENT_DETAILS } from '@/utils/schema/friendsLayer_schema';

export async function POST(request) {
  try {
    const token = request.cookies.get('user_token')?.value;
    if (!token) {
      return NextResponse.json(
        { message: 'Authentication required' },
        { status: 401 }
      );
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.id;

    const body = await request.json();
    const {
      caption,
      imageFileName,
      latitude,
      longitude,
      categoryId,
      categoryName,
      deleteAfterHours,
      isPermanent,
      isStory,
      selectedLayers,
      taggedUsers,
      eventData,
    } = body;

    // Validate required fields
    if (!caption || !categoryName || !latitude || !longitude || !imageFileName) {
      return NextResponse.json(
        { message: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate event-specific requirements
    if (categoryName === 'Event' && (!eventData || !eventData.event_date || !eventData.contact_info)) {
      return NextResponse.json(
        { message: 'Event date and contact info are required for events' },
        { status: 400 }
      );
    }

    // Determine post type
    // let postType;
    // if (categoryName === 'Posts') {
    //   postType = isStory ? 'story' : 'post';
    // } else if (categoryName === 'Event') {
    //   postType = 'event';
    // }

  // Determine post type and deletion settings
    let postType;
    let finalDeleteAfterHours = null;
    let finalIsPermanent = false;

    if (categoryName === 'Posts') {
      postType = 'general';
      if (isStory) {
        // This is a story
        finalDeleteAfterHours = 24;
      } else {
        finalDeleteAfterHours = null;
        // This is a regular post
        finalIsPermanent = isPermanent || false;
      }
    } else if (categoryName === 'Event') {
      postType = 'event';
      // Events don't auto-delete by default, but could be made configurable
      finalIsPermanent = false;
    }

    // Create the main post
    const [newPost] = await db
      .insert(USER_POSTS)
      .values({
        creator_type: 'user',
        creator_id: userId,
        description: caption, // Using caption as description
        image_url: imageFileName,
        latitude: latitude.toString(),
        longitude: longitude.toString(),
        category_id: categoryId,
        post_type: postType,
        delete_after_hours: finalDeleteAfterHours,
        is_story: isStory || false,
        is_permanent: finalIsPermanent || false,
        created_at: new Date(),
      })
      .execute();

    const postId = newPost.insertId;

    // Handle event-specific data
    if (categoryName === 'Event' && eventData) {
      await db.insert(USER_PERSONAL_EVENT_DETAILS).values({
        post_id: postId,
        event_date: eventData.event_date,
        contact_info: eventData.contact_info,
        additional_info: eventData.additional_info || null,
      });
    }

    // Handle layer mappings
    if (selectedLayers && selectedLayers.length > 0) {
      const layerMappings = selectedLayers.map(layerId => ({
        post_id: postId,
        layer_id: layerId,
      }));

      await db.insert(POST_LAYER_MAP).values(layerMappings);
    }

    // Handle tagged users
    if (taggedUsers && taggedUsers.length > 0) {
      const tagMappings = taggedUsers.map(user => ({
        post_id: postId,
        tagged_type: user.type,
        tagged_id: user.id,
      }));

      await db.insert(POST_TAGS).values(tagMappings);
    }

    // Send notifications to tagged users
    if (taggedUsers && taggedUsers.length > 0) {
      const notifications = taggedUsers.map(user => ({
        user_id: user.id, // the user being notified
        type: 'tagged_in_post',
        message: `You were tagged in a post by ${decoded.name || 'someone'}`,
        metadata: JSON.stringify({
          post_id: postId,
          tagger_id: userId,
          tagged_type: user.type,
        }),
        created_at: new Date(),
      }));

    await db.insert(USER_NOTIFICATIONS).values(notifications);
  }


    return NextResponse.json({
      message: 'Post created successfully',
      postId: postId,
      postType: postType,
      category: categoryName,
    });

  } catch (error) {
    console.error('Error creating user post:', error);
    
    if (error.code === 'ER_NO_REFERENCED_ROW_2') {
      return NextResponse.json(
        { message: 'Invalid reference data provided' },
        { status: 400 }
      );
    }
    
    if (error.code === 'ER_DUP_ENTRY') {
      return NextResponse.json(
        { message: 'Duplicate entry detected' },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { message: 'Failed to create post', error: error.message },
      { status: 500 }
    );
  }
}