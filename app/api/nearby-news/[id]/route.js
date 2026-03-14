import { db } from "@/utils";
import { HYPERLOCAL_NEWS } from "@/utils/schema/schema";
import { NextResponse } from "next/server";
import { authenticate } from "@/lib/jwtMiddleware";
import { eq } from "drizzle-orm";
import Client from 'ssh2-sftp-client';


// GET handler to fetch news item by ID
export async function GET(req, { params }) {
  const { id } = params;
  
  // Authenticate user
  const authResult = await authenticate(req);
  if (!authResult.authenticated) {
    return authResult.response;
  }
  
  try {
    // Fetch the news item
    const newsItem = await db
      .select()
      .from(HYPERLOCAL_NEWS)
      .where(eq(HYPERLOCAL_NEWS.id, parseInt(id)))
      .limit(1);
    
    if (!newsItem || newsItem.length === 0) {
      return NextResponse.json(
        { message: "News item not found" },
        { status: 404 }
      );
    }
    
    // Check if user is the creator of this news item
    if (newsItem[0].created_by !== authResult.decoded_Data.id) {
      return NextResponse.json(
        { message: "You are not authorized to edit this news item" },
        { status: 403 }
      );
    }
    
    return NextResponse.json(
      { news: newsItem[0] },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error fetching hyperlocal news:", error);
    return NextResponse.json(
      { message: "Error fetching hyperlocal news", details: error.message },
      { status: 500 }
    );
  }
}

// PUT handler to update news item
export async function PUT(req, { params }) {
  const { id } = params;
  
  // Authenticate user
  const authResult = await authenticate(req);
  if (!authResult.authenticated) {
    return authResult.response;
  }
  const userData = authResult.decoded_Data;
  const userId = userData.id;
  
  try {
    // Fetch the news item to make sure it exists and user is authorized
    const existingNews = await db
      .select()
      .from(HYPERLOCAL_NEWS)
      .where(eq(HYPERLOCAL_NEWS.id, parseInt(id)))
      .limit(1);
    
    if (!existingNews || existingNews.length === 0) {
      return NextResponse.json(
        { message: "News item not found" },
        { status: 404 }
      );
    }
    
    // Check if user is the creator of this news item
    if (existingNews[0].created_by !== userId) {
      return NextResponse.json(
        { message: "You are not authorized to edit this news item" },
        { status: 403 }
      );
    }
    
    const {
      title,
      image_url,
      content,
      latitude,
      longitude,
      category_id,
      delete_after_hours,
      old_image_url, // Track the old image URL for deletion if needed
    } = await req.json();
    
    // Validate required fields
    if (!title || !image_url || !content) {
      return NextResponse.json(
        { message: "Title, image URL, and content are required" },
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
          { message: "News location must be within 10km of your current location" },
          { status: 400 }
        );
      }
    }
    
    // Check if the image has been changed
    const imageChanged = image_url !== old_image_url;
    
    // Update the news item
    await db
      .update(HYPERLOCAL_NEWS)
      .set({
        title,
        image_url,
        content,
        latitude,
        longitude,
        category_id: category_id || null,
        delete_after_hours: delete_after_hours || 24,
        updated_at: new Date(),
      })
      .where(eq(HYPERLOCAL_NEWS.id, parseInt(id)));
    
    // If the image has been changed and the old one was an uploaded file, delete it from cPanel
    if (imageChanged && old_image_url && old_image_url.includes('wowfy.in/testusr/images/')) {
      try {
        // Extract filename from the URL
        const oldImageFilename = old_image_url.split('/').pop();
        await deleteImageFromCPanel(oldImageFilename);
      } catch (deleteError) {
        console.error("Error deleting old image:", deleteError);
        // Continue with the update even if image deletion fails
      }
    }
    
    return NextResponse.json(
      { message: "Hyperlocal news updated successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error updating hyperlocal news:", error);
    return NextResponse.json(
      { message: "Error updating hyperlocal news", details: error.message },
      { status: 500 }
    );
  }
}

// Function to delete image from cPanel
async function deleteImageFromCPanel(filename) {
  const sftp = new Client();
  try {
    await sftp.connect({
      host: '68.178.163.247',
      port: 22,
      username: 'devusr',
      password: 'Wowfyuser#123',
    });
    
    // Path to delete the file
    const remotePath = `/home/devusr/public_html/testusr/images/${filename}`;
    
    // Check if file exists before attempting to delete
    const exists = await sftp.exists(remotePath);
    if (exists) {
      await sftp.delete(remotePath);
      console.log(`Deleted image: ${remotePath}`);
    }
  } catch (sftpError) {
    console.error('SFTP Error:', sftpError);
    // Continue with the deletion even if file deletion fails
    throw sftpError;
  } finally {
    // Always close the connection
    await sftp.end();
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

function deg2rad(deg) {
  return deg * (Math.PI/180);
}

// DELETE handler to delete news item
export async function DELETE(req, { params }) {
  const { id } = params;
  
  // Authenticate user
  const authResult = await authenticate(req);
  if (!authResult.authenticated) {
    return authResult.response;
  }
  const userData = authResult.decoded_Data;
  const userId = userData.id;
  
  try {
    // Fetch the news item to make sure it exists and user is authorized
    const existingNews = await db
      .select()
      .from(HYPERLOCAL_NEWS)
      .where(eq(HYPERLOCAL_NEWS.id, parseInt(id)))
      .limit(1);
    
    if (!existingNews || existingNews.length === 0) {
      return NextResponse.json(
        { message: "News item not found" },
        { status: 404 }
      );
    }
    
    // Check if user is the creator of this news item
    if (existingNews[0].created_by !== userId) {
      return NextResponse.json(
        { message: "You are not authorized to delete this news item" },
        { status: 403 }
      );
    }
    

    // If the news item has an image that was uploaded, delete it from cPanel
    const imageUrl = existingNews[0].image_url;
    if (imageUrl && imageUrl.includes('wowfy.in/testusr/images/')) {
      // Extract filename from the URL
      const imageFilename = imageUrl.split('/').pop();
      try {
        await deleteImageFromCPanel(imageFilename);
      } catch (deleteError) {
        console.error("Error deleting image:", deleteError);
        // Continue with the deletion even if image deletion fails
      }
    }

    // Delete the news item
    await db
      .delete(HYPERLOCAL_NEWS)
      .where(eq(HYPERLOCAL_NEWS.id, parseInt(id)));
    
    return NextResponse.json(
      { message: "Hyperlocal news deleted successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error deleting hyperlocal news:", error);
    return NextResponse.json(
      { message: "Error deleting hyperlocal news", details: error.message },
      { status: 500 }
    );
  }
}