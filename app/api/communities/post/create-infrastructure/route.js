import { NextResponse } from 'next/server';
import { db } from '@/utils';
import {
  COMMUNITY_POSTS,
  COMMUNITY_POST_IMAGES,
  COMMUNITY_POST_ISSUE_DETAILS
} from '@/utils/schema/community_schema';
import { jwtVerify } from 'jose';

export async function POST(request) {
  try {
    // 🔐 Auth: get token from cookies
    const token = request.cookies.get('user_token')?.value;
    if (!token) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const secret = new TextEncoder().encode(process.env.JWT_SECRET);
    const decoded = await jwtVerify(token, secret);
    const userId = decoded.payload.id;

    // 📦 Read body
    const body = await request.json();
    const {
      communityId,
      title,
      description,
      latitude,
      longitude,
      categoryId,
      postType,
      issueDetails
    } = body;

    // Validate required fields
    if (!communityId || !title || !description || !categoryId) {
      return NextResponse.json({ 
        success: false, 
        message: 'Missing required fields' 
      }, { status: 400 });
    }

    // 📝 Create community post
    const [post] = await db.insert(COMMUNITY_POSTS).values({
      title,
      description,
      latitude: latitude ? String(latitude) : null,
      longitude: longitude ? String(longitude) : null,
      category_id: parseInt(categoryId),
      community_id: parseInt(communityId),
      created_by: userId,
      is_permanent: true,
    });

    const postId = post.insertId;

    // Create issue details entry if post type is 'issue'
    if (postType === 'issue' && issueDetails) {
      await db.insert(COMMUNITY_POST_ISSUE_DETAILS).values({
        post_id: postId,
        status: 'pending',
        priority: issueDetails.priority,
        building_name: issueDetails.buildingName,
        block_name: issueDetails.blockName,
        floor_number: issueDetails.floorNumber,
        additional_info: issueDetails.additionalInfo || null,
        user_confirmation_status: 'pending'
      });
    }

    // ✅ Return success
    return NextResponse.json({ 
      success: true, 
      message: postType === 'issue' ? 'Issue reported successfully' : 'Post created successfully',
      postId 
    }, { status: 200 });

  } catch (error) {
    console.error('Error creating community post:', error);
    return NextResponse.json({ 
      success: false, 
      message: 'Failed to create post' 
    }, { status: 500 });
  }
}