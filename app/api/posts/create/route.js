// app\api\posts\create
import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { db } from '@/utils';
import { USER_POSTS, POST_IMAGES } from '@/utils/schema/schema';
import { USER_POST_ISSUE_DETAILS } from '@/utils/schema/centers_schema';

export async function POST(req) {
  try {
    const token = req.cookies.get("user_token")?.value;
    
    if (!token) {
      return NextResponse.json({ success: false, message: "Authentication required" }, { status: 401 });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded?.id;

    if (!userId) {
      return NextResponse.json({ success: false, message: "Invalid token" }, { status: 401 });
    }

    const data = await req.json();
    
    const {
      title,
      description,
      latitude,
      longitude,
      images = [],
      categoryId,
      pageId,
      postType,
      issueDetails
    } = data;

    // Validate required fields
    if (!title || !description || !latitude || !longitude || !categoryId || !pageId) {
      return NextResponse.json({ 
        success: false, 
        message: "Missing required fields" 
      }, { status: 400 });
    }

    // Create main post entry
    const [postResult] = await db
      .insert(USER_POSTS)
      .values({
        creator_type: 'user',
        creator_id: userId,
        page_id: parseInt(pageId),
        title: title,
        description: description,
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude),
        category_id: parseInt(categoryId),
        post_type: postType || 'general',
        is_permanent: true
      });

    const postId = postResult.insertId;

    // Create issue details entry if post type is 'issue'
    if (postType === 'issue' && issueDetails) {
      await db
        .insert(USER_POST_ISSUE_DETAILS)
        .values({
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

    // Insert images
    if (images && images.length > 0) {
      const imageValues = images.map((imagePath, index) => ({
        post_id: postId,
        image_url: imagePath,
        display_order: index + 1,
        is_primary: index === 0
      }));

      await db.insert(POST_IMAGES).values(imageValues);
    }
    
    return NextResponse.json({ 
      success: true, 
      message: postType === 'issue' ? "Issue reported successfully" : "Post created successfully",
      postId
    });

  } catch (error) {
    console.error("Error creating post:", error);
    return NextResponse.json({ 
      success: false, 
      message: "Failed to create post" 
    }, { status: 500 });
  }
}