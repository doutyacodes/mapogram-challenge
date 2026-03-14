// /api/hyperlocal/obituary/[id]/route.js
import { NextResponse } from 'next/server';
import { db } from '@/utils/index';
import { OBITUARIES } from '@/utils/schema/schema';
import { eq } from 'drizzle-orm';
import { authenticate } from '@/lib/jwtMiddleware';
import calculateDistance from '@/lib/utils';

// Function to delete image from cPanel
async function deleteImageFromCPanel(filename) {
  const Client = require('ssh2-sftp-client');
  const sftp = new Client();
  try {
    await sftp.connect({
      host: '68.178.163.247',
      port: 22,
      username: 'devusr',
      password: 'Wowfyuser#123',
    });
    
    const remotePath = `/home/devusr/public_html/testusr/images/${filename}`;
    
    const exists = await sftp.exists(remotePath);
    if (exists) {
      await sftp.delete(remotePath);
      console.log(`Deleted image: ${remotePath}`);
    }
  } catch (sftpError) {
    console.error('SFTP Error:', sftpError);
    throw sftpError;
  } finally {
    await sftp.end();
  }
}

export async function PUT(req, { params }) {
  // Authenticate user
  const authResult = await authenticate(req);
  if (!authResult.authenticated) {
    return authResult.response;
  }
  const userData = authResult.decoded_Data;
  const userId = userData.id;

  try {
    const { id } = params;
    const {
      person_name,
      age,
      date_of_death,
      image_url,
      images_to_delete = [],
      latitude,
      longitude,
      delete_after_hours,
    } = await req.json();

    if (!id) {
      return NextResponse.json(
        { message: "ID is required" },
        { status: 400 }
      );
    }

    // Check if the obituary exists and user owns it
    const existingObituary = await db
      .select()
      .from(OBITUARIES)
      .where(eq(OBITUARIES.id, parseInt(id)))
      .limit(1);

    if (existingObituary.length === 0) {
      return NextResponse.json(
        { message: "Obituary not found" },
        { status: 404 }
      );
    }

    if (existingObituary[0].created_by !== userId) {
      return NextResponse.json(
        { message: "Unauthorized to edit this obituary" },
        { status: 403 }
      );
    }

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
    today.setHours(23, 59, 59, 999);

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

    // Delete old image from cPanel if a new one is being uploaded or image is being removed
    if (images_to_delete.length > 0) {
      for (const filename of images_to_delete) {
        try {
          await deleteImageFromCPanel(filename);
        } catch (error) {
          console.error(`Failed to delete image ${filename}:`, error);
          // Continue with update even if image deletion fails
        }
      }
    }

    // Update obituary
    await db
      .update(OBITUARIES)
      .set({
        person_name,
        age: age ? parseInt(age) : null,
        date_of_death: deathDate.toISOString().split('T')[0],
        image_url: image_url || null,
        latitude: latitude,
        longitude: longitude,
        delete_after_hours: delete_after_hours || 48,
        updated_at: new Date(),
      })
      .where(eq(OBITUARIES.id, parseInt(id)));

    return NextResponse.json(
      { message: "Obituary updated successfully" },
      { status: 200 }
    );

  } catch (error) {
    console.error("Error updating obituary:", error);
    return NextResponse.json(
      { message: "Error updating obituary", details: error.message },
      { status: 500 }
    );
  }
}