// /api/complaints/create/route.js

import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { db } from '@/utils';
import { USER_POSTS, POST_IMAGES } from '@/utils/schema/schema';
import { USER_COMPLAINT_POSTS } from '@/utils/schema/complaints_schema';

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
      issueTitle,
      issueDescription,
      latitude,
      longitude,
      images = [],
      brandId,
      productId,
      categoryId,
      specificProductName,
      serviceCenterPageId,
      additionalInfo
    } = data;

    // Validate required fields
    if (!issueTitle || !issueDescription || !latitude || !longitude || !brandId || !productId || !serviceCenterPageId || !categoryId) {
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
        title: issueTitle,
        description: issueDescription,
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude),
        category_id: parseInt(categoryId),
        post_type: 'complaints',
        delete_after_hours: null, // No auto-delete for complaints
        is_permanent: true,
        is_story: false
      });

    const postId = postResult.insertId;

    // Create complaint details entry
    const [complaintResult] = await db
      .insert(USER_COMPLAINT_POSTS)
      .values({
        post_id: postId,
        brand_id: parseInt(brandId),
        product_id: parseInt(productId),
        specific_product_name: specificProductName || null,
        service_center_page_id: parseInt(serviceCenterPageId),
        additional_info: additionalInfo || null,
        status: 'pending',
        reported_at: new Date()
      });

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
      message: "Complaint submitted successfully",
      postId,
      complaintId: complaintResult.insertId
    });

  } catch (error) {
    console.error("Error creating complaint:", error);
    return NextResponse.json({ 
      success: false, 
      message: "Failed to submit complaint" 
    }, { status: 500 });
  }
}
