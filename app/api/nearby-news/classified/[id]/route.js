import { db } from "@/utils";
import { CLASSIFIED_ADS, HYPERLOCAL_CATEGORIES, USER_DETAILS } from "@/utils/schema/schema";
import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { authenticate } from "@/lib/jwtMiddleware";

export async function GET(req, { params }) {
  try {
    const { id } = params;
    
    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json(
        { message: "Invalid classified ad ID" },
        { status: 400 }
      );
    }

    // Join query to get classified ad with category name and author name
    const classifiedAds = await db
      .select({
        id: CLASSIFIED_ADS.id,
        title: CLASSIFIED_ADS.title,
        description: CLASSIFIED_ADS.description,
        ad_type: CLASSIFIED_ADS.ad_type,
        price: CLASSIFIED_ADS.price,
        type: CLASSIFIED_ADS.type,
        images: CLASSIFIED_ADS.images,
        contact_info: CLASSIFIED_ADS.contact_info,
        latitude: CLASSIFIED_ADS.latitude,
        longitude: CLASSIFIED_ADS.longitude,
        delete_after_hours: CLASSIFIED_ADS.delete_after_hours,
        created_at: CLASSIFIED_ADS.created_at,
        category_name: HYPERLOCAL_CATEGORIES.name,
        author_name: USER_DETAILS.name,
      })
      .from(CLASSIFIED_ADS)
      .leftJoin(
        HYPERLOCAL_CATEGORIES,
        eq(CLASSIFIED_ADS.category_id, HYPERLOCAL_CATEGORIES.id)
      )
      .leftJoin(
        USER_DETAILS,
        eq(CLASSIFIED_ADS.created_by, USER_DETAILS.id)
      )
      .where(eq(CLASSIFIED_ADS.id, parseInt(id)));

    if (!classifiedAds.length) {
      return NextResponse.json(
        { message: "Classified ad not found" },
        { status: 404 }
      );
    }

    // Since we're fetching by PK, there should be only one result
    const classifiedAd = classifiedAds[0];

    // Check if the ad should be auto-deleted based on delete_after_hours
    // const createdAt = new Date(classifiedAd.created_at);
    // const now = new Date();
    // const hoursElapsed = (now - createdAt) / (1000 * 60 * 60);
    
    // if (hoursElapsed > classifiedAd.delete_after_hours) {
    //   return NextResponse.json(
    //     { message: "This classified ad has expired" },
    //     { status: 410 } // Gone status code
    //   );
    // }

    return NextResponse.json(
      { classifiedAd },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error fetching classified ad:", error);
    return NextResponse.json(
      { message: "Error fetching classified ad", details: error.message },
      { status: 500 }
    );
  }
}

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
        title,
        description,
        ad_type,
        price,
        category,
        images,
        images_to_delete = [],
        contact_info,
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

      // Check if the classified ad exists and user owns it
      const existingAd = await db
        .select()
        .from(CLASSIFIED_ADS)
        .where(eq(CLASSIFIED_ADS.id, parseInt(id)))
        .limit(1);

      if (existingAd.length === 0) {
        return NextResponse.json(
          { message: "Classified ad not found" },
          { status: 404 }
        );
      }

      if (existingAd[0].created_by !== userId) {
        return NextResponse.json(
          { message: "Unauthorized to edit this classified ad" },
          { status: 403 }
        );
      }

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

      // Validate images array
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

      // Delete images from cPanel if any are marked for deletion
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

      // Update classified ad
      await db
        .update(CLASSIFIED_ADS)
        .set({
          title,
          description,
          ad_type,
          price: price ? parseFloat(price) : null,
          type: category.toLowerCase(),
          images: JSON.stringify(images),
          contact_info,
          latitude: latitude,
          longitude: longitude,
          delete_after_hours: delete_after_hours || 24,
          updated_at: new Date(),
        })
        .where(eq(CLASSIFIED_ADS.id, parseInt(id)));

      return NextResponse.json(
        { message: "Classified ad updated successfully" },
        { status: 200 }
      );

    } catch (error) {
      console.error("Error updating classified ad:", error);
      return NextResponse.json(
        { message: "Error updating classified ad", details: error.message },
        { status: 500 }
      );
    }
  }