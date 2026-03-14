import { db } from "@/utils";
import jwt from 'jsonwebtoken';
import {
  USER_POSTS,
  POST_CATEGORY_TEMPLATES,
  USERS,
  USER_PROFILES,
  PAGES,
  PAGE_PROFILES,
  PAGE_TYPES,
  POST_LAYER_MAP,
  LAYERS
} from "@/utils/schema/schema";

import {
  USER_CLASSIFIED_DETAILS,
  CLASSIFIED_SUB_CATEGORIES,
  CLASSIFIED_VEHICLE_DETAILS,
  CLASSIFIED_ELECTRONICS_DETAILS,
  CLASSIFIED_FURNITURE_DETAILS,
  CLASSIFIED_REAL_ESTATE_DETAILS,
  VEHICLE_BRANDS,
  VEHICLE_MODELS,
  ELECTRONICS_BRANDS,
  CLASSIFIED_IMAGES,
} from "@/utils/schema/classifieds_schema";

import { NextResponse } from "next/server";
import { eq, and, gte, lte, or, sql, inArray, desc, asc } from "drizzle-orm";

export async function GET(req) {
  try {
    const url = new URL(req.url);
    const token = req.cookies.get("user_token")?.value;

    if (!token) return NextResponse.json({ message: "Authentication required" }, { status: 401 });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Handle guest users
    const isGuest = decoded.isGuest || false;
    const viewerId = isGuest ? null : decoded.id;
    const sessionId = isGuest ? decoded.sessionId : null;


    const layerId = url.searchParams.get("layerId");
    if (!layerId) return NextResponse.json({ posts: [], categories: [] });

    console.log("Classifieds layerId:", layerId, "viewerId:", viewerId);
    console.log("Classifieds layerId:", layerId, "viewerId:", viewerId, "isGuest:", isGuest);

    // Get post IDs that belong to this layer and are classifieds
    const layerPosts = await db
      .select({ post_id: POST_LAYER_MAP.post_id })
      .from(POST_LAYER_MAP)
      .innerJoin(USER_POSTS, eq(POST_LAYER_MAP.post_id, USER_POSTS.id))
      .where(
        and(
          eq(POST_LAYER_MAP.layer_id, parseInt(layerId)),
          eq(USER_POSTS.post_type, 'classifieds')
        )
      );

    const postIds = layerPosts.map(lp => lp.post_id);
    
    if (postIds.length === 0) {
      return NextResponse.json({ posts: [], categories: [] });
    }

    // Filter parameters
    const listingType = url.searchParams.get("listingType");
    const categoryId = url.searchParams.get("categoryId");
    const subCategoryId = url.searchParams.get("subCategoryId");
    const minPrice = url.searchParams.get("minPrice");
    const maxPrice = url.searchParams.get("maxPrice");
    const condition = url.searchParams.get("condition");
    
    // Vehicle specific filters
    const vehicleBrandId = url.searchParams.get("vehicleBrandId");
    const fuelType = url.searchParams.get("fuelType");
    const yearFrom = url.searchParams.get("yearFrom");
    const yearTo = url.searchParams.get("yearTo");
    
    // Electronics specific filters
    const electronicsBrandId = url.searchParams.get("electronicsBrandId");
    const warrantyAvailable = url.searchParams.get("warrantyAvailable");
    
    // Common filters
    const sortBy = url.searchParams.get("sortBy") || "created_at";
    const sortOrder = url.searchParams.get("sortOrder") || "desc";
    const limit = url.searchParams.get("limit");

    const whereConditions = [inArray(USER_POSTS.id, postIds)];

    // Apply classified-specific filters
    if (listingType && listingType !== '') {
      whereConditions.push(eq(USER_CLASSIFIED_DETAILS.listing_type, listingType));
    }

    if (subCategoryId && subCategoryId !== '') {
      whereConditions.push(eq(USER_CLASSIFIED_DETAILS.sub_category_id, parseInt(subCategoryId)));
    } else if (categoryId && categoryId !== '') {
      // If only category is selected, filter by all sub-categories under that category
      const subCategoriesInCategory = await db
        .select({ id: CLASSIFIED_SUB_CATEGORIES.id })
        .from(CLASSIFIED_SUB_CATEGORIES)
        .where(eq(CLASSIFIED_SUB_CATEGORIES.main_category_id, parseInt(categoryId)));
      
      const subCategoryIds = subCategoriesInCategory.map(sc => sc.id);
      if (subCategoryIds.length > 0) {
        whereConditions.push(inArray(USER_CLASSIFIED_DETAILS.sub_category_id, subCategoryIds));
      }
    }

    // Price filters
    if (minPrice && minPrice !== '') {
      whereConditions.push(gte(USER_CLASSIFIED_DETAILS.price, parseFloat(minPrice)));
    }
    if (maxPrice && maxPrice !== '') {
      whereConditions.push(lte(USER_CLASSIFIED_DETAILS.price, parseFloat(maxPrice)));
    }

    // Condition filter
    if (condition && condition !== '') {
      const conditionArray = condition.split(',');
      whereConditions.push(inArray(USER_CLASSIFIED_DETAILS.condition, conditionArray));
    }

    let query = db
      .select({
        // Base post details
        id: USER_POSTS.id,
        title: USER_POSTS.title,
        description: USER_POSTS.description,
        image_url: USER_POSTS.image_url,
        latitude: USER_POSTS.latitude,
        longitude: USER_POSTS.longitude,
        created_at: USER_POSTS.created_at,
        delete_after_hours: USER_POSTS.delete_after_hours,
        is_story: USER_POSTS.is_story,
        is_permanent: USER_POSTS.is_permanent,
        post_type: USER_POSTS.post_type,
        creator_type: USER_POSTS.creator_type,
        creator_id: USER_POSTS.creator_id,

        // Category details
        category_id: USER_POSTS.category_id,
        category_name: POST_CATEGORY_TEMPLATES.name,
        category_icon: POST_CATEGORY_TEMPLATES.icon_name,
        category_color: POST_CATEGORY_TEMPLATES.color,

        // Classified details
        classified_id: USER_CLASSIFIED_DETAILS.id,
        sub_category_id: USER_CLASSIFIED_DETAILS.sub_category_id,
        sub_category_name: CLASSIFIED_SUB_CATEGORIES.name,
        sub_category_slug: CLASSIFIED_SUB_CATEGORIES.slug,
        listing_type: USER_CLASSIFIED_DETAILS.listing_type,
        price: USER_CLASSIFIED_DETAILS.price,
        price_type: USER_CLASSIFIED_DETAILS.price_type,
        condition: USER_CLASSIFIED_DETAILS.condition,
        contact_phone: USER_CLASSIFIED_DETAILS.contact_phone,
        contact_email: USER_CLASSIFIED_DETAILS.contact_email,
        preferred_contact: USER_CLASSIFIED_DETAILS.preferred_contact,
        available_until: USER_CLASSIFIED_DETAILS.available_until,

        // Vehicle details
        vehicle_brand_id: CLASSIFIED_VEHICLE_DETAILS.brand_id,
        vehicle_brand_name: VEHICLE_BRANDS.name,
        vehicle_model_id: CLASSIFIED_VEHICLE_DETAILS.model_id,
        vehicle_model_name: VEHICLE_MODELS.name,
        vehicle_year: CLASSIFIED_VEHICLE_DETAILS.year,
        mileage_km: CLASSIFIED_VEHICLE_DETAILS.mileage_km,
        fuel_type: CLASSIFIED_VEHICLE_DETAILS.fuel_type,
        transmission: CLASSIFIED_VEHICLE_DETAILS.transmission,
        engine_capacity: CLASSIFIED_VEHICLE_DETAILS.engine_capacity,
        registration_year: CLASSIFIED_VEHICLE_DETAILS.registration_year,
        vehicle_color: CLASSIFIED_VEHICLE_DETAILS.color,
        number_of_owners: CLASSIFIED_VEHICLE_DETAILS.number_of_owners,

        // Electronics details
        electronics_brand_id: CLASSIFIED_ELECTRONICS_DETAILS.brand_id,
        electronics_brand_name: ELECTRONICS_BRANDS.name,
        electronics_model: CLASSIFIED_ELECTRONICS_DETAILS.model,
        warranty_months_left: CLASSIFIED_ELECTRONICS_DETAILS.warranty_months_left,
        bill_available: CLASSIFIED_ELECTRONICS_DETAILS.bill_available,
        box_available: CLASSIFIED_ELECTRONICS_DETAILS.box_available,
        storage_capacity: CLASSIFIED_ELECTRONICS_DETAILS.storage_capacity,
        ram: CLASSIFIED_ELECTRONICS_DETAILS.ram,
        processor: CLASSIFIED_ELECTRONICS_DETAILS.processor,
        screen_size: CLASSIFIED_ELECTRONICS_DETAILS.screen_size,

        // Furniture details
        furniture_material: CLASSIFIED_FURNITURE_DETAILS.material,
        furniture_color: CLASSIFIED_FURNITURE_DETAILS.color,
        furniture_dimensions: CLASSIFIED_FURNITURE_DETAILS.dimensions,
        furniture_weight_kg: CLASSIFIED_FURNITURE_DETAILS.weight_kg,
        seating_capacity: CLASSIFIED_FURNITURE_DETAILS.seating_capacity,
        number_of_pieces: CLASSIFIED_FURNITURE_DETAILS.number_of_pieces,
        assembly_required: CLASSIFIED_FURNITURE_DETAILS.assembly_required,
        furniture_brand: CLASSIFIED_FURNITURE_DETAILS.brand,

        // Real Estate details
        property_type: CLASSIFIED_REAL_ESTATE_DETAILS.property_type,
        area_sqft: CLASSIFIED_REAL_ESTATE_DETAILS.area_sqft,
        area_unit: CLASSIFIED_REAL_ESTATE_DETAILS.area_unit,
        bedrooms: CLASSIFIED_REAL_ESTATE_DETAILS.bedrooms,
        bathrooms: CLASSIFIED_REAL_ESTATE_DETAILS.bathrooms,
        floor_number: CLASSIFIED_REAL_ESTATE_DETAILS.floor_number,
        total_floors: CLASSIFIED_REAL_ESTATE_DETAILS.total_floors,
        parking: CLASSIFIED_REAL_ESTATE_DETAILS.parking,
        furnished: CLASSIFIED_REAL_ESTATE_DETAILS.furnished,
        monthly_rent: CLASSIFIED_REAL_ESTATE_DETAILS.monthly_rent,
        security_deposit: CLASSIFIED_REAL_ESTATE_DETAILS.security_deposit,
        construction_year: CLASSIFIED_REAL_ESTATE_DETAILS.construction_year,
        ready_to_move: CLASSIFIED_REAL_ESTATE_DETAILS.ready_to_move,

        // User details (when creator_type = 'user')
        user_name: USERS.name,
        user_username: USERS.username,
        user_profile_image: USER_PROFILES.profile_pic_url,
        user_joined_at: USERS.created_at,

        // Page details (when creator_type = 'page')
        page_name: PAGES.name,
        page_username: PAGES.username,
        page_profile_image: PAGE_PROFILES.profile_pic_url,
        page_joined_at: PAGES.created_at,
        page_type_name: PAGE_TYPES.name,

        // Engagement metrics
        like_count: sql`(
          SELECT COUNT(*) FROM user_post_likes
          WHERE user_post_likes.post_id = ${USER_POSTS.id}
        )`.as("like_count"),

        is_liked_by_user: isGuest ? sql`FALSE`.as("is_liked_by_user") : sql`EXISTS (
          SELECT 1 FROM user_post_likes
          WHERE user_post_likes.post_id = ${USER_POSTS.id}
          AND user_post_likes.user_id = ${viewerId}
        )`.as("is_liked_by_user"),
      })
      .from(USER_POSTS)
      .innerJoin(USER_CLASSIFIED_DETAILS, eq(USER_POSTS.id, USER_CLASSIFIED_DETAILS.post_id))
      .innerJoin(CLASSIFIED_SUB_CATEGORIES, eq(USER_CLASSIFIED_DETAILS.sub_category_id, CLASSIFIED_SUB_CATEGORIES.id))
      .leftJoin(POST_CATEGORY_TEMPLATES, eq(USER_POSTS.category_id, POST_CATEGORY_TEMPLATES.id))
      
      // Vehicle joins
      .leftJoin(CLASSIFIED_VEHICLE_DETAILS, eq(USER_CLASSIFIED_DETAILS.id, CLASSIFIED_VEHICLE_DETAILS.classified_id))
      .leftJoin(VEHICLE_BRANDS, eq(CLASSIFIED_VEHICLE_DETAILS.brand_id, VEHICLE_BRANDS.id))
      .leftJoin(VEHICLE_MODELS, eq(CLASSIFIED_VEHICLE_DETAILS.model_id, VEHICLE_MODELS.id))
      
      // Electronics joins
      .leftJoin(CLASSIFIED_ELECTRONICS_DETAILS, eq(USER_CLASSIFIED_DETAILS.id, CLASSIFIED_ELECTRONICS_DETAILS.classified_id))
      .leftJoin(ELECTRONICS_BRANDS, eq(CLASSIFIED_ELECTRONICS_DETAILS.brand_id, ELECTRONICS_BRANDS.id))
      
      // Furniture joins
      .leftJoin(CLASSIFIED_FURNITURE_DETAILS, eq(USER_CLASSIFIED_DETAILS.id, CLASSIFIED_FURNITURE_DETAILS.classified_id))
      
      // Real Estate joins
      .leftJoin(CLASSIFIED_REAL_ESTATE_DETAILS, eq(USER_CLASSIFIED_DETAILS.id, CLASSIFIED_REAL_ESTATE_DETAILS.classified_id))
      
      // Creator joins
      .leftJoin(USERS, and(
        eq(USER_POSTS.creator_type, 'user'),
        eq(USER_POSTS.creator_id, USERS.id)
      ))
      .leftJoin(USER_PROFILES, eq(USER_PROFILES.user_id, USERS.id))
      .leftJoin(PAGES, and(
        eq(USER_POSTS.creator_type, 'page'),
        eq(USER_POSTS.creator_id, PAGES.id)
      ))
      .leftJoin(PAGE_PROFILES, eq(PAGE_PROFILES.page_id, PAGES.id))
      .leftJoin(PAGE_TYPES, eq(PAGES.page_type_id, PAGE_TYPES.id));

    // Apply vehicle-specific filters
    if (vehicleBrandId && vehicleBrandId !== '') {
      whereConditions.push(eq(CLASSIFIED_VEHICLE_DETAILS.brand_id, parseInt(vehicleBrandId)));
    }
    if (fuelType && fuelType !== '') {
      whereConditions.push(eq(CLASSIFIED_VEHICLE_DETAILS.fuel_type, fuelType));
    }
    if (yearFrom && yearFrom !== '') {
      whereConditions.push(gte(CLASSIFIED_VEHICLE_DETAILS.year, parseInt(yearFrom)));
    }
    if (yearTo && yearTo !== '') {
      whereConditions.push(lte(CLASSIFIED_VEHICLE_DETAILS.year, parseInt(yearTo)));
    }

    // Apply electronics-specific filters
    if (electronicsBrandId && electronicsBrandId !== '') {
      whereConditions.push(eq(CLASSIFIED_ELECTRONICS_DETAILS.brand_id, parseInt(electronicsBrandId)));
    }
    if (warrantyAvailable === 'true') {
      whereConditions.push(sql`${CLASSIFIED_ELECTRONICS_DETAILS.warranty_months_left} > 0`);
    }

    query = query.where(and(...whereConditions));

    // Apply sorting
    if (sortBy === 'price') {
      query = query.orderBy(sortOrder === 'asc' ? asc(USER_CLASSIFIED_DETAILS.price) : desc(USER_CLASSIFIED_DETAILS.price));
    } else if (sortBy === 'title') {
      query = query.orderBy(sortOrder === 'asc' ? asc(USER_POSTS.title) : desc(USER_POSTS.title));
    } else {
      query = query.orderBy(sortOrder === 'asc' ? asc(USER_POSTS.created_at) : desc(USER_POSTS.created_at));
    }

    // Apply limit
    if (limit && limit !== '') {
      query = query.limit(parseInt(limit));
    }

    const rawPosts = await query;

    // Fetch classified images for all posts
    const classifiedIds = rawPosts
      .filter(post => post.classified_id)
      .map(post => post.classified_id);

    let classifiedImages = [];
    if (classifiedIds.length > 0) {
      classifiedImages = await db
        .select({
          classified_id: CLASSIFIED_IMAGES.classified_id,
          image_url: CLASSIFIED_IMAGES.image_url,
          is_primary: CLASSIFIED_IMAGES.is_primary,
          display_order: CLASSIFIED_IMAGES.display_order,
        })
        .from(CLASSIFIED_IMAGES)
        .where(inArray(CLASSIFIED_IMAGES.classified_id, classifiedIds))
        .orderBy(CLASSIFIED_IMAGES.display_order, CLASSIFIED_IMAGES.is_primary);
    }

    // Group images by classified_id
    const imagesByClassifiedId = classifiedImages.reduce((acc, img) => {
      if (!acc[img.classified_id]) acc[img.classified_id] = [];
      acc[img.classified_id].push(img);
      return acc;
    }, {});

    // Transform raw posts into structured response
    const posts = rawPosts.map(post => {
      // Determine creator info based on creator_type
      let sourceName, userProfileImage, joinedAt, pageTypeName;
      
      if (post.creator_type === 'user') {
        sourceName = post.user_name;
        userProfileImage = post.user_profile_image;
        joinedAt = post.user_joined_at;
        pageTypeName = null;
      } else if (post.creator_type === 'page') {
        sourceName = post.page_name;
        userProfileImage = post.page_profile_image;
        joinedAt = post.page_joined_at;
        pageTypeName = post.page_type_name;
      }

      const basePost = {
        id: post.id,
        title: post.title,
        description: post.description,
        image_url: post.image_url,
        latitude: post.latitude,
        longitude: post.longitude,
        created_at: post.created_at,
        delete_after_hours: post.delete_after_hours,
        is_permanent: post.is_permanent,
        post_type: post.post_type,
        category_id: post.category_id,
        category_name: post.category_name,
        category_icon: post.category_icon,
        category_color: post.category_color,
        like_count: post.like_count || 0,
        is_liked_by_user: !!post.is_liked_by_user,
        user_profile_image: userProfileImage,
        user_name: sourceName,
        joined_at: joinedAt,
        created_by: post.creator_id,
        creator_type: post.creator_type,
        page_type_name: pageTypeName,
      };

      // Add classified details
      if (post.classified_id) {
        basePost.classified_details = {
          id: post.classified_id,
          sub_category_id: post.sub_category_id,
          sub_category_name: post.sub_category_name,
          sub_category_slug: post.sub_category_slug,
          listing_type: post.listing_type,
          price: post.price ? parseFloat(post.price) : null,
          price_type: post.price_type,
          condition: post.condition,
          contact_phone: post.contact_phone,
          contact_email: post.contact_email,
          preferred_contact: post.preferred_contact,
          available_until: post.available_until,
          images: imagesByClassifiedId[post.classified_id] || [],
        };

        // Add category-specific details based on sub-category
        const subCategoryName = post.sub_category_name.toLowerCase();

        // Vehicle details
        if (subCategoryName.includes('car') || subCategoryName.includes('bike') || subCategoryName.includes('vehicle')) {
          if (post.vehicle_brand_id) {
            basePost.classified_details.vehicle_details = {
              brand_id: post.vehicle_brand_id,
              brand_name: post.vehicle_brand_name,
              model_id: post.vehicle_model_id,
              model_name: post.vehicle_model_name,
              year: post.vehicle_year,
              mileage_km: post.mileage_km,
              fuel_type: post.fuel_type,
              transmission: post.transmission,
              engine_capacity: post.engine_capacity,
              registration_year: post.registration_year,
              color: post.vehicle_color,
              number_of_owners: post.number_of_owners,
            };
          }
        }

        // Electronics details
        if (subCategoryName.includes('mobile') || subCategoryName.includes('laptop') || 
            subCategoryName.includes('tv') || subCategoryName.includes('camera') || 
            subCategoryName.includes('electronic')) {
          if (post.electronics_brand_id || post.electronics_model) {
            basePost.classified_details.electronics_details = {
              brand_id: post.electronics_brand_id,
              brand_name: post.electronics_brand_name,
              model: post.electronics_model,
              warranty_months_left: post.warranty_months_left,
              bill_available: post.bill_available,
              box_available: post.box_available,
              storage_capacity: post.storage_capacity,
              ram: post.ram,
              processor: post.processor,
              screen_size: post.screen_size,
            };
          }
        }

        // Furniture details
        if (subCategoryName.includes('furniture')) {
          if (post.furniture_material || post.furniture_brand) {
            basePost.classified_details.furniture_details = {
              material: post.furniture_material,
              color: post.furniture_color,
              dimensions: post.furniture_dimensions,
              weight_kg: post.furniture_weight_kg ? parseFloat(post.furniture_weight_kg) : null,
              seating_capacity: post.seating_capacity,
              number_of_pieces: post.number_of_pieces,
              assembly_required: post.assembly_required,
              brand: post.furniture_brand,
            };
          }
        }

        // Real Estate details
        if (subCategoryName.includes('property') || subCategoryName.includes('land') || 
            subCategoryName.includes('plot') || post.property_type) {
          if (post.property_type || post.area_sqft) {
            basePost.classified_details.real_estate_details = {
              property_type: post.property_type,
              area_sqft: post.area_sqft,
              area_unit: post.area_unit,
              bedrooms: post.bedrooms,
              bathrooms: post.bathrooms,
              floor_number: post.floor_number,
              total_floors: post.total_floors,
              parking: post.parking,
              furnished: post.furnished,
              monthly_rent: post.monthly_rent ? parseFloat(post.monthly_rent) : null,
              security_deposit: post.security_deposit ? parseFloat(post.security_deposit) : null,
              construction_year: post.construction_year,
              ready_to_move: post.ready_to_move,
            };
          }
        }
      }

      return basePost;
    });

    // Fetch categories for this layer (classified categories only)
    const categories = await db
      .select({
        id: POST_CATEGORY_TEMPLATES.id,
        name: POST_CATEGORY_TEMPLATES.name,
        shape: POST_CATEGORY_TEMPLATES.shape,
        icon_name: POST_CATEGORY_TEMPLATES.icon_name,
        color: POST_CATEGORY_TEMPLATES.color,
        class_name: POST_CATEGORY_TEMPLATES.class_name
      })
      .from(POST_CATEGORY_TEMPLATES)
      .innerJoin(
        CLASSIFIED_SUB_CATEGORIES,
        eq(POST_CATEGORY_TEMPLATES.id, CLASSIFIED_SUB_CATEGORIES.main_category_id)
      )
      .groupBy(POST_CATEGORY_TEMPLATES.id);

      return NextResponse.json({
        posts,
        categories,
        user: isGuest ? {
          isGuest: true,
          sessionId: sessionId,
          role: 'guest',
        } : {
          id: viewerId,
          role: decoded.role,
        }
      });

  } catch (err) {
    console.error("Classifieds API Error", err);
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}