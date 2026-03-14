// app/api/page/create/route.js
import { NextResponse } from 'next/server';
import { db } from '@/utils';
import { PAGES, PAGE_PROFILES, PAGE_ADMINS, USERNAMES,  } from '@/utils/schema/schema';
import { SERVICE_CENTER_BRANDS, SERVICE_CENTER_PRODUCTS } from '@/utils/schema/complaints_schema';
import { eq } from 'drizzle-orm';
import jwt from 'jsonwebtoken';
import { BASE_IMG_URL } from '@/lib/map/constants';

export async function POST(req) {
  try {
    const token = req.cookies.get('user_token')?.value;

    if (!token) {
      return NextResponse.json(
        { message: 'Authentication required' },
        { status: 401 }
      );
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.id;

    const body = await req.json();
    
    const { 
      name, 
      username, 
      bio, 
      websiteUrl, 
      profileImageUrl, 
      page_type_id,
      selectedBrands,
      selectedProducts
    } = body;

    // Validation
    if (!name || !name.trim()) {
      return NextResponse.json({ message: "Page name is required" }, { status: 400 });
    }

    if (!username || !username.trim()) {
      return NextResponse.json({ message: "Username is required" }, { status: 400 });
    }

    if (username.length < 3) {
      return NextResponse.json({ message: "Username must be at least 3 characters" }, { status: 400 });
    }

    if (!profileImageUrl || !profileImageUrl.trim()) {
      return NextResponse.json({ message: "Profile image is required" }, { status: 400 });
    }
    
    if (!page_type_id) {
      return NextResponse.json(
        { message: "Page type is required for page accounts" },
        { status: 400 }
      );
    }

    // Check if username is available
    const existingUsername = await db
      .select()
      .from(USERNAMES)
      .where(eq(USERNAMES.username, username.trim().toLowerCase()));

    if (existingUsername.length > 0) {
      return NextResponse.json({ message: "Username is already taken" }, { status: 409 });
    }

    // Start transaction
    const result = await db.transaction(async (tx) => {
      // 1. Create the page
      const [newPage] = await tx
        .insert(PAGES)
        .values({
          user_id: userId,
          name: name.trim(),
          username: username.trim().toLowerCase(),
          page_type_id: page_type_id,
        })
        .execute();

      const pageId = newPage.insertId;

      // 2. Create page profile
      await tx
        .insert(PAGE_PROFILES)
        .values({
          page_id: pageId,
          bio: bio && bio.trim() ? bio.trim() : null,
          profile_pic_url: BASE_IMG_URL + profileImageUrl.trim(),
          website_url: websiteUrl && websiteUrl.trim() ? websiteUrl.trim() : null,
          latitude: body.latitude || null,      // Add this
          longitude: body.longitude || null, 
        });

      // 3. Add creator as page admin (owner)
      await tx
        .insert(PAGE_ADMINS)
        .values({
          page_id: pageId,
          user_id: userId,
          is_owner: true,
        });

      // 4. Register username
      await tx
        .insert(USERNAMES)
        .values({
          username: username.trim().toLowerCase(),
          entity_type: 'page',
          entity_id: pageId,
        });

      // 5. Add service center brands if provided
      if (selectedBrands && selectedBrands.length > 0) {
        const brandValues = selectedBrands.map(brandId => ({
          page_id: pageId,
          brand_id: brandId,
        }));
        
        await tx.insert(SERVICE_CENTER_BRANDS).values(brandValues);
      }

      // 6. Add service center products if provided
      if (selectedProducts && selectedProducts.length > 0) {
        const productValues = selectedProducts.map(productId => ({
          page_id: pageId,
          product_id: productId,
        }));
        
        await tx.insert(SERVICE_CENTER_PRODUCTS).values(productValues);
      }

      return newPage;
    });

    // Fetch complete page data to return
    const [completePageData] = await db
      .select({
        id: PAGES.id,
        name: PAGES.name,
        username: PAGES.username,
        user_id: PAGES.user_id,
        page_type_id: PAGES.page_type_id,
        created_at: PAGES.created_at,
        bio: PAGE_PROFILES.bio,
        profile_pic_url: PAGE_PROFILES.profile_pic_url,
        website_url: PAGE_PROFILES.website_url,
      })
      .from(PAGES)
      .leftJoin(PAGE_PROFILES, eq(PAGES.id, PAGE_PROFILES.page_id))
      .where(eq(PAGES.id, result.insertId));

    return NextResponse.json({
      message: "Page created successfully",
      page: completePageData,
    }, { status: 201 });

  } catch (error) {
    console.error("Error creating page:", error);
    
    // Handle specific database errors
    if (error.code === 'ER_DUP_ENTRY' || error.message.includes('duplicate')) {
      return NextResponse.json({ message: "Username is already taken" }, { status: 409 });
    }
    
    return NextResponse.json({ message: "Failed to create page" }, { status: 500 });
  }
}