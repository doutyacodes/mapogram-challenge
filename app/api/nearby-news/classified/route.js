// /api/hyperlocal/classified/route.js

import { authenticate } from '@/lib/jwtMiddleware';
import { db } from '@/utils';
import { CLASSIFIED_ADS, USER_DETAILS } from '@/utils/schema/schema';
import { NextResponse } from 'next/server';

export async function POST(req) {
  // Authenticate user
  const authResult = await authenticate(req);
  if (!authResult.authenticated) {
    return authResult.response;
  }
  const userData = authResult.decoded_Data;
  const userId = userData.id;

  try {
    const {
      title,
      description,
      ad_type,
      price,
      category,
      images, // Array of image URLs
      contact_info,
      latitude,
      longitude,
      delete_after_hours,
    } = await req.json();

    // Validate required fields
    if (!title || !description || !ad_type || !category || !contact_info) {
      return NextResponse.json(
        { message: "Title, description, ad type, category, and contact info are required" },
        { status: 400 }
      );
    }

    // Validate ad_type
    if (!['sell', 'rent'].includes(ad_type)) {
      return NextResponse.json(
        { message: "Ad type must be either 'sell' or 'rent'" },
        { status: 400 }
      );
    }

    // Validate location data
    if (!latitude || !longitude) {
      return NextResponse.json(
        { message: "Location coordinates are required" },
        { status: 400 }
      );
    }

    // Validate images array (should have at least 1 image, max 10)
    if (!images || !Array.isArray(images) || images.length === 0) {
      return NextResponse.json(
        { message: "At least one image is required" },
        { status: 400 }
      );
    }

    if (images.length > 10) {
      return NextResponse.json(
        { message: "Maximum 10 images allowed" },
        { status: 400 }
      );
    }

    // Validate user's current location with provided coordinates
    const userLat = req.headers.get('user-latitude');
    const userLng = req.headers.get('user-longitude');

    if (userLat && userLng) {
      const distance = calculateDistance(
        parseFloat(userLat),
        parseFloat(userLng),
        parseFloat(latitude),
        parseFloat(longitude)
      );

      if (distance > 10) {
        return NextResponse.json(
          { message: "Ad location must be within 10km of your current location" },
          { status: 400 }
        );
      }
    }

    // Create new classified ad
    const newAd = await db.insert(CLASSIFIED_ADS).values({
      title,
      description,
      ad_type,
      price: price ? parseFloat(price) : null,
      type: category.toLowerCase(),
      images: JSON.stringify(images), // Store as JSON string
      contact_info,
      latitude: latitude,
      longitude: longitude,
      created_by: userId,
      category_id: 17,
      delete_after_hours: delete_after_hours || 24,
    });

    return NextResponse.json(
      { message: "Classified ad created successfully", id: newAd.insertId },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating classified ad:', error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}

// Function to calculate distance between two points in kilometers
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Radius of the earth in km
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * 
    Math.sin(dLon/2) * Math.sin(dLon/2); 
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
  const d = R * c; // Distance in km
  return d;
}
