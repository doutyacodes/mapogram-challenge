// /api/hyperlocal/obituary/route.js

import { authenticate } from '@/lib/jwtMiddleware';
import { db } from '@/utils';
import { OBITUARIES } from '@/utils/schema/schema';
import { NextResponse } from 'next/server';
// ADD YOUR EXISTING IMPORTS HERE:
// import { authenticate } from 'your-auth-module';
// import { db } from 'your-db-module';
// import { OBITUARIES, USER_DETAILS } from 'your-schema';
// import { calculateDistance } from 'your-utils';

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
      person_name,
      age,
      date_of_death,
      image_url,
      latitude,
      longitude,
      delete_after_hours,
    } = await req.json();

    // Validate required fields
    if (!person_name || !date_of_death) {
      return NextResponse.json(
        { message: "Person's name and date of death are required" },
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

    // Validate date format and ensure it's not in the future
    const deathDate = new Date(date_of_death);
    const today = new Date();
    today.setHours(23, 59, 59, 999); // End of today
    
    if (deathDate > today) {
      return NextResponse.json(
        { message: "Date of death cannot be in the future" },
        { status: 400 }
      );
    }

    // Validate age if provided
    if (age && (age < 0 || age > 150)) {
      return NextResponse.json(
        { message: "Please enter a valid age" },
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
          { message: "Obituary location must be within 10km of your current location" },
          { status: 400 }
        );
      }
    }

    // Create new obituary
    const newObituary = await db.insert(OBITUARIES).values({
      person_name,
      age: age ? parseInt(age) : null,
      date_of_death: deathDate.toISOString().split('T')[0], // Format as YYYY-MM-DD
      image_url: image_url || null,
      latitude: latitude,
      longitude: longitude,
      created_by: userId,
      category_id: 11,
      delete_after_hours: delete_after_hours || 48, // Default 48 hours for obituaries
    });

    return NextResponse.json(
      { message: "Obituary created successfully", id: newObituary.insertId },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating obituary:', error);
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
