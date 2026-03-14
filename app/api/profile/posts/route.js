import { db } from "@/utils";
import jwt from "jsonwebtoken";
import {
  USER_POSTS,
  POST_CATEGORY_TEMPLATES,
  USER_PROFILES,
  USERS,
  USER_CATEGORY_PERMISSIONS,
  POST_TAGS,
  POST_IMAGES,
  PAGES,
  PAGE_PROFILES,
} from "@/utils/schema/schema";
import { NextResponse } from "next/server";
import { eq, and, gte, lte, isNull, sql, or, inArray } from "drizzle-orm";
import { USER_PERSONAL_EVENT_DETAILS } from "@/utils/schema/friendsLayer_schema";
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

import {
  USER_COMPLAINT_POSTS,
  BRANDS,
  PRODUCTS,
} from "@/utils/schema/complaints_schema";

export async function GET(req) {
  try {
    const url = new URL(req.url);
    const token = req.cookies.get("user_token")?.value;
    if (!token) return NextResponse.json({ message: "Authentication required" }, { status: 401 });

    const userId = url.searchParams.get("userId");
    if (!userId) return NextResponse.json({ posts: [], categories: [] });
    console.log("userId", userId);
    const viewerRole = "user";

    const now = new Date();
    const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    // Fetch user's own posts
    const rawPosts = await db
      .select({
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
        category_id: USER_POSTS.category_id,
        creator_type: USER_POSTS.creator_type,
        creator_id: USER_POSTS.creator_id,
        category_name: POST_CATEGORY_TEMPLATES.name,
        category_icon: POST_CATEGORY_TEMPLATES.icon_name,
        category_color: POST_CATEGORY_TEMPLATES.color,
        user_profile_image: USER_PROFILES.profile_pic_url,
        user_name: USERS.name,

        // Personal event details
        event_id: USER_PERSONAL_EVENT_DETAILS.id,
        event_date: USER_PERSONAL_EVENT_DETAILS.event_date,
        contact_info: USER_PERSONAL_EVENT_DETAILS.contact_info,
        additional_info: USER_PERSONAL_EVENT_DETAILS.additional_info,

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

        // Complaint details
        complaint_id: USER_COMPLAINT_POSTS.id,
        complaint_brand_id: USER_COMPLAINT_POSTS.brand_id,
        complaint_brand_name: BRANDS.name,
        complaint_product_id: USER_COMPLAINT_POSTS.product_id,
        complaint_product_name: PRODUCTS.name,
        complaint_specific_product_name: USER_COMPLAINT_POSTS.specific_product_name,
        complaint_service_center_page_id: USER_COMPLAINT_POSTS.service_center_page_id,
        complaint_service_center_name: PAGES.name,
        complaint_service_center_profile: PAGE_PROFILES.profile_pic_url,
        complaint_status: USER_COMPLAINT_POSTS.status,
        complaint_user_status: USER_COMPLAINT_POSTS.user_confirmation_status,
        complaint_reported_at: USER_COMPLAINT_POSTS.reported_at,
        complaint_completed_at: USER_COMPLAINT_POSTS.completed_at,
        complaint_additional_info: USER_COMPLAINT_POSTS.additional_info,


        unread_messages_count: sql`(
          SELECT COUNT(*) FROM post_chat_messages
          WHERE post_chat_messages.post_id = ${USER_POSTS.id}
          AND (
            (${viewerRole} = 'admin' AND post_chat_messages.is_read_by_admin = false)
            OR
            (${viewerRole} != 'admin' AND post_chat_messages.sender_type != 'user' AND post_chat_messages.sender_id != ${userId} AND post_chat_messages.is_read_by_user = false)
          )
        )`.as("unread_messages_count"),
      })
      .from(USER_POSTS)
      .leftJoin(POST_CATEGORY_TEMPLATES, eq(USER_POSTS.category_id, POST_CATEGORY_TEMPLATES.id))
      .leftJoin(USER_PERSONAL_EVENT_DETAILS, eq(USER_PERSONAL_EVENT_DETAILS.post_id, USER_POSTS.id))
      .leftJoin(USER_PROFILES, eq(USER_PROFILES.user_id, USER_POSTS.creator_id))
      .leftJoin(USERS, eq(USERS.id, USER_POSTS.creator_id))
      
      // Classified joins
      .leftJoin(USER_CLASSIFIED_DETAILS, eq(USER_POSTS.id, USER_CLASSIFIED_DETAILS.post_id))
      .leftJoin(CLASSIFIED_SUB_CATEGORIES, eq(USER_CLASSIFIED_DETAILS.sub_category_id, CLASSIFIED_SUB_CATEGORIES.id))
      
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

      /* Complaints */
      .leftJoin(USER_COMPLAINT_POSTS, eq(USER_POSTS.id, USER_COMPLAINT_POSTS.post_id))
      .leftJoin(BRANDS, eq(USER_COMPLAINT_POSTS.brand_id, BRANDS.id))
      .leftJoin(PRODUCTS, eq(USER_COMPLAINT_POSTS.product_id, PRODUCTS.id))
      .leftJoin(PAGES, eq(USER_COMPLAINT_POSTS.service_center_page_id, PAGES.id))
      .leftJoin(PAGE_PROFILES, eq(PAGE_PROFILES.page_id, PAGES.id))
      
      .where(
        and(
          eq(USER_POSTS.creator_type, "user"),
          eq(USER_POSTS.creator_id, userId)
        )
      )
      .orderBy(sql`${USER_POSTS.created_at} DESC`);

    // Fetch posts where user is tagged and accepted
    const taggedPosts = await db
      .select({
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
        category_id: USER_POSTS.category_id,
        creator_type: USER_POSTS.creator_type,
        creator_id: USER_POSTS.creator_id,
        category_name: POST_CATEGORY_TEMPLATES.name,
        category_icon: POST_CATEGORY_TEMPLATES.icon_name,
        category_color: POST_CATEGORY_TEMPLATES.color,
        user_profile_image: USER_PROFILES.profile_pic_url,
        user_name: USERS.name,

        // Personal event details
        event_id: USER_PERSONAL_EVENT_DETAILS.id,
        event_date: USER_PERSONAL_EVENT_DETAILS.event_date,
        contact_info: USER_PERSONAL_EVENT_DETAILS.contact_info,
        additional_info: USER_PERSONAL_EVENT_DETAILS.additional_info,

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
        
        // Complaint details
        complaint_id: USER_COMPLAINT_POSTS.id,
        complaint_brand_id: USER_COMPLAINT_POSTS.brand_id,
        complaint_brand_name: BRANDS.name,
        complaint_product_id: USER_COMPLAINT_POSTS.product_id,
        complaint_product_name: PRODUCTS.name,
        complaint_specific_product_name: USER_COMPLAINT_POSTS.specific_product_name,
        complaint_service_center_page_id: USER_COMPLAINT_POSTS.service_center_page_id,
        complaint_service_center_name: PAGES.name,
        complaint_service_center_profile: PAGE_PROFILES.profile_pic_url,
        complaint_status: USER_COMPLAINT_POSTS.status,
        complaint_user_status: USER_COMPLAINT_POSTS.user_confirmation_status,
        complaint_reported_at: USER_COMPLAINT_POSTS.reported_at,
        complaint_completed_at: USER_COMPLAINT_POSTS.completed_at,
        complaint_additional_info: USER_COMPLAINT_POSTS.additional_info,

        // Tag info
        is_tagged: sql`true`.as('is_tagged'),

        unread_messages_count: sql`(
          SELECT COUNT(*) FROM post_chat_messages
          WHERE post_chat_messages.post_id = ${USER_POSTS.id}
          AND (
            (${viewerRole} = 'admin' AND post_chat_messages.is_read_by_admin = false)
            OR
            (${viewerRole} != 'admin' AND post_chat_messages.sender_type != 'user' AND post_chat_messages.sender_id != ${userId} AND post_chat_messages.is_read_by_user = false)
          )
        )`.as("unread_messages_count"),
      })
      .from(POST_TAGS)
      .innerJoin(USER_POSTS, eq(POST_TAGS.post_id, USER_POSTS.id))
      .leftJoin(POST_CATEGORY_TEMPLATES, eq(USER_POSTS.category_id, POST_CATEGORY_TEMPLATES.id))
      .leftJoin(USER_PERSONAL_EVENT_DETAILS, eq(USER_PERSONAL_EVENT_DETAILS.post_id, USER_POSTS.id))
      .leftJoin(USER_PROFILES, eq(USER_PROFILES.user_id, USER_POSTS.creator_id))
      .leftJoin(USERS, eq(USERS.id, USER_POSTS.creator_id))
      
      // Classified joins
      .leftJoin(USER_CLASSIFIED_DETAILS, eq(USER_POSTS.id, USER_CLASSIFIED_DETAILS.post_id))
      .leftJoin(CLASSIFIED_SUB_CATEGORIES, eq(USER_CLASSIFIED_DETAILS.sub_category_id, CLASSIFIED_SUB_CATEGORIES.id))
      
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

      // COMPLAINT JOINS
      .leftJoin(USER_COMPLAINT_POSTS, eq(USER_POSTS.id, USER_COMPLAINT_POSTS.post_id))
      .leftJoin(BRANDS, eq(USER_COMPLAINT_POSTS.brand_id, BRANDS.id))
      .leftJoin(PRODUCTS, eq(USER_COMPLAINT_POSTS.product_id, PRODUCTS.id))
      .leftJoin(PAGES, eq(USER_COMPLAINT_POSTS.service_center_page_id, PAGES.id))
      .leftJoin(PAGE_PROFILES, eq(PAGE_PROFILES.page_id, PAGES.id))
      
      .where(
        and(
          eq(POST_TAGS.tagged_type, "user"),
          eq(POST_TAGS.tagged_id, userId),
          eq(POST_TAGS.is_accepted, true)
        )
      )
      .orderBy(sql`${USER_POSTS.created_at} DESC`);

    // Combine all posts and remove duplicates
    const allPostsMap = new Map();
    
    // Add user's own posts
    rawPosts.forEach(post => {
      allPostsMap.set(post.id, { ...post, is_tagged: false });
    });
    
    // Add tagged posts (will overwrite if duplicate, but that's fine)
    taggedPosts.forEach(post => {
      allPostsMap.set(post.id, { ...post, is_tagged: true });
    });

    const allPosts = Array.from(allPostsMap.values());

    // Get all post IDs to fetch their tags
    const postIds = allPosts.map(post => post.id);
    
    // Fetch all tags for these posts
    const postTagsData = postIds.length > 0 ? await db
      .select({
        post_id: POST_TAGS.post_id,
        tagged_type: POST_TAGS.tagged_type,
        tagged_id: POST_TAGS.tagged_id,
        is_accepted: POST_TAGS.is_accepted,
        // Tagged user details
        tagged_user_name: USERS.name,
        tagged_user_profile: USER_PROFILES.profile_pic_url,
      })
      .from(POST_TAGS)
      .leftJoin(USERS, and(
        eq(POST_TAGS.tagged_type, "user"),
        eq(POST_TAGS.tagged_id, USERS.id)
      ))
      .leftJoin(USER_PROFILES, and(
        eq(POST_TAGS.tagged_type, "user"),
        eq(USER_PROFILES.user_id, USERS.id)
      ))
      .where(or(...postIds.map(id => eq(POST_TAGS.post_id, id))))
      : [];

    // Group tags by post_id
    const postTagsMap = {};
    postTagsData.forEach(tag => {
      if (!postTagsMap[tag.post_id]) {
        postTagsMap[tag.post_id] = [];
      }
      postTagsMap[tag.post_id].push({
        tagged_type: tag.tagged_type,
        tagged_id: tag.tagged_id,
        is_accepted: tag.is_accepted,
        tagged_user_name: tag.tagged_user_name,
        tagged_user_profile: tag.tagged_user_profile,
      });
    });

    // Fetch classified images for all classified posts
    const classifiedIds = allPosts
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

    const complaintPostIds = allPosts
      .filter(post => post.post_type === 'complaints' && post.id)
      .map(post => post.id);

    let complaintPostImages = [];
    if (complaintPostIds.length > 0) {
      complaintPostImages = await db
        .select({
          post_id: POST_IMAGES.post_id,
          image_url: POST_IMAGES.image_url,
          is_primary: POST_IMAGES.is_primary,
          display_order: POST_IMAGES.display_order,
        })
        .from(POST_IMAGES)
        .where(inArray(POST_IMAGES.post_id, complaintPostIds))
        .orderBy(POST_IMAGES.display_order);
    }

    // Group images by post_id
    const imagesByPostId = complaintPostImages.reduce((acc, img) => {
      if (!acc[img.post_id]) acc[img.post_id] = [];
      acc[img.post_id].push(img);
      return acc;
    }, {});

    const permanentPosts = [];
    const storyPosts = [];
    const regularPosts = [];

    for (const post of allPosts) {
      // Use the is_story field directly
      const isStory = post.is_story && 
        new Date(post.created_at).getTime() + (post.delete_after_hours || 24) * 60 * 60 * 1000 > now.getTime() &&
        new Date(post.created_at).getTime() > twentyFourHoursAgo.getTime();
      
      const isRegular = !post.is_story && !post.is_permanent;
      const isPermanent = post.is_permanent;

      const basePost = {
        id: post.id,
        title: post.title,
        description: post.description,
        image_url: post.image_url,
        images: imagesByPostId[post.id] || [],
        latitude: post.latitude,
        longitude: post.longitude,
        created_at: post.created_at,
        delete_after_hours: post.delete_after_hours,
        is_story: post.is_story,
        is_permanent: post.is_permanent,
        post_type: post.post_type,
        category_id: post.category_id,
        creator_type: post.creator_type,
        creator_id: post.creator_id,
        category_name: post.category_name,
        category_icon: post.category_icon,
        category_color: post.category_color,
        user_profile_image: post.user_profile_image,
        user_name: post.user_name,
        is_tagged: post.is_tagged || false,
        status: isStory ? "story" : isPermanent ? "permanent" : "normal",
        tags: postTagsMap[post.id] || [],
        unread_messages_count: parseInt(post.unread_messages_count) || 0, // Add this line
      };

      // Add event details for event posts
      if (post.post_type === "event" || post.post_type === "personal_event") {
        basePost.event_details = {
          event_id: post.event_id,
          event_date: post.event_date,
          contact_info: post.contact_info,
          additional_info: post.additional_info,
        };
      }

      // Add classified details for classified posts
      if (post.post_type === "classifieds" && post.classified_id) {
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
        const subCategoryName = post.sub_category_name?.toLowerCase() || '';

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

      if (post.post_type === "complaints" && post.complaint_id) {
        basePost.complaint_details = {
          brand_id: post.complaint_brand_id,
          brand_name: post.complaint_brand_name,
          product_id: post.complaint_product_id,
          product_name: post.complaint_product_name,
          specific_product_name: post.complaint_specific_product_name,
          service_center_page_id: post.complaint_service_center_page_id,
          service_center_name: post.complaint_service_center_name,
          service_center_profile: post.complaint_service_center_profile,
          status: post.complaint_status,
          user_confirmation_status: post.complaint_user_status,
          reported_at: post.complaint_reported_at,
          completed_at: post.complaint_completed_at,
          additional_info: post.complaint_additional_info,
        };
      }

      if (isPermanent) permanentPosts.push(basePost);
      else if (isStory) storyPosts.push(basePost);
      else if (isRegular) regularPosts.push(basePost);
    }

    // Only include stories that are still valid (not expired)
    const validStories = storyPosts;

    // Limit last 10 normal (non-permanent) posts
    const recentRegularPosts = regularPosts.slice(0, 10);

    // Fetch available categories (this part seems to be missing the user filter)
     const categories = await db
        .select({
            id: POST_CATEGORY_TEMPLATES.id,
            name: POST_CATEGORY_TEMPLATES.name,
            shape: POST_CATEGORY_TEMPLATES.shape,
            icon_name: POST_CATEGORY_TEMPLATES.icon_name,
            color: POST_CATEGORY_TEMPLATES.color,
            class_name: POST_CATEGORY_TEMPLATES.class_name,
            post_type: POST_CATEGORY_TEMPLATES.post_type,
        })
        .from(USER_CATEGORY_PERMISSIONS)
        .innerJoin(
            POST_CATEGORY_TEMPLATES,
            eq(USER_CATEGORY_PERMISSIONS.category_template_id, POST_CATEGORY_TEMPLATES.id)
    );

    return NextResponse.json({
      posts: [...permanentPosts, ...validStories, ...recentRegularPosts],
      categories,
      summary: {
        total_posts: allPosts.length,
        own_posts: rawPosts.length,
        tagged_posts: taggedPosts.length,
        permanent_posts: permanentPosts.length,
        story_posts: validStories.length,
        regular_posts: recentRegularPosts.length,
      }
    });
  } catch (err) {
    console.error("User Posts API Error", err);
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}