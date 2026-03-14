import { db } from "@/utils";
import jwt from 'jsonwebtoken';
import {
  USER_POSTS, 
  USER_JOB_DETAILS, 
  USER_NEWS_DETAILS, 
  POST_CATEGORY_TEMPLATES, 
  USERS, 
  USER_PROFILES, 
  PAGES,
  PAGE_PROFILES,
  USER_POST_REGISTRATIONS,
  JOB_SKILLS_MAP,
  SKILLS,
  JOB_EDUCATION_MAP,
  EDUCATION_QUALIFICATIONS,
  JOB_EXPERIENCE,
  PAGE_TYPE_CATEGORY_PERMISSIONS,
  PAGE_TYPES,
  USER_EVENT_DETAILS,
  POST_TAGS,
  USER_OFFER_DETAILS,
  POST_IMAGES
} from "@/utils/schema/schema";
import {  USER_COMPLAINT_POSTS, BRANDS, PRODUCTS,} from "@/utils/schema/complaints_schema";
import { NextResponse } from "next/server";
import { eq, and, gte, lte, or, sql, inArray } from "drizzle-orm";
import { isUserPageAdmin } from "@/lib/permissions/page-permissions";

export async function GET(req) {
  try {
    const url = new URL(req.url);
    const token = req.cookies.get("user_token")?.value;

    if (!token) return NextResponse.json({ message: "Authentication required" }, { status: 401 });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const viewerId = decoded.id;
    const viewerRole = "page";

    const pageId = url.searchParams.get("pageId");
    if (!pageId) return NextResponse.json({ posts: [], categories: [] });

    // Get page details
    const [pageData] = await db.select().from(PAGES).where(eq(PAGES.id, parseInt(pageId)));
    if (!pageData) return NextResponse.json({ message: "Page not found" }, { status: 404 });

    const isOwner = await isUserPageAdmin(parseInt(viewerId), parseInt(pageId));

    console.log("pageId", pageId, "viewerId:", viewerId);
    console.log("isOwner", isOwner);

    console.log("pageData", pageData);

    // First, get posts created by this page
    const ownPostsConditions = [
      eq(USER_POSTS.creator_type, "page"),
      eq(USER_POSTS.creator_id, parseInt(pageId))
    ];

    const north = url.searchParams.get("north");
    const south = url.searchParams.get("south");
    const east = url.searchParams.get("east");
    const west = url.searchParams.get("west");

    // Add geographic filters if provided
    if (north && south && east && west) {
      ownPostsConditions.push(
        gte(USER_POSTS.latitude, parseFloat(south)),
        lte(USER_POSTS.latitude, parseFloat(north))
      );

      if (east < west) {
        ownPostsConditions.push(
          or(
            gte(USER_POSTS.longitude, parseFloat(west)),
            lte(USER_POSTS.longitude, parseFloat(east))
          )
        );
      } else {
        ownPostsConditions.push(
          gte(USER_POSTS.longitude, parseFloat(west)),
          lte(USER_POSTS.longitude, parseFloat(east))
        );
      }
    }

    // Get posts where page is tagged
    const taggedPostIds = await db
      .select({ post_id: POST_TAGS.post_id })
      .from(POST_TAGS)
      .where(and(
        eq(POST_TAGS.tagged_type, "page"),
        eq(POST_TAGS.tagged_id, parseInt(pageId)),
        eq(POST_TAGS.is_accepted, true)
      ));

    console.log("taggedPostIds", taggedPostIds);

    const taggedPostIdsArray = taggedPostIds.map(t => t.post_id);

    // Get complaint posts for this service center
    const complaintPostIds = await db
      .select({ post_id: USER_COMPLAINT_POSTS.post_id })
      .from(USER_COMPLAINT_POSTS)
      .where(eq(USER_COMPLAINT_POSTS.service_center_page_id, parseInt(pageId)));

    console.log("complaintPostIds", complaintPostIds);

    const complaintPostIdsArray = complaintPostIds.map(c => c.post_id);

    // Combine conditions: own posts OR tagged posts OR complaint posts
    let finalWhereConditions;
    const allSpecialPostIds = [...taggedPostIdsArray, ...complaintPostIdsArray].filter(id => id);

    if (allSpecialPostIds.length > 0) {
      finalWhereConditions = or(
        and(...ownPostsConditions),
        inArray(USER_POSTS.id, allSpecialPostIds)
      );
    } else {
      finalWhereConditions = and(...ownPostsConditions);
    }

    console.log("About to execute main query...");
    
    let rawPosts;
    try {
      rawPosts = await db
        .select({
          id: USER_POSTS.id,
          title: USER_POSTS.title,
          description: USER_POSTS.description,
          image_url: USER_POSTS.image_url,
          latitude: USER_POSTS.latitude,
          longitude: USER_POSTS.longitude,
          created_at: USER_POSTS.created_at,
          delete_after_hours: USER_POSTS.delete_after_hours,
          is_permanent: USER_POSTS.is_permanent,
          post_type: USER_POSTS.post_type,
          creator_type: USER_POSTS.creator_type,
          creator_id: USER_POSTS.creator_id,

          category_id: USER_POSTS.category_id,
          category_name: POST_CATEGORY_TEMPLATES.name,
          category_icon: POST_CATEGORY_TEMPLATES.icon_name,
          category_color: POST_CATEGORY_TEMPLATES.color,

          // Job details (will be null if not a job post)
          job_id: USER_JOB_DETAILS.id,
          job_type: USER_JOB_DETAILS.job_type,
          job_link: USER_JOB_DETAILS.link,
          is_paid: USER_JOB_DETAILS.is_paid,
          salary_or_stipend: USER_JOB_DETAILS.salary_or_stipend,
          location_type: USER_JOB_DETAILS.location_type,
          duration: USER_JOB_DETAILS.duration,
          application_deadline: USER_JOB_DETAILS.application_deadline,
          event_name: USER_JOB_DETAILS.event_name,
          event_date: USER_JOB_DETAILS.event_date,
          additional_info: USER_JOB_DETAILS.additional_info,

          // Experience details
          min_years: JOB_EXPERIENCE.min_years,
          max_years: JOB_EXPERIENCE.max_years,

          // Event details (will be null if not an event post)
          event_id: USER_EVENT_DETAILS.id,
          event_type: USER_EVENT_DETAILS.event_type,
          event_event_name: USER_EVENT_DETAILS.event_name,
          event_event_date: USER_EVENT_DETAILS.event_date,
          event_link: USER_EVENT_DETAILS.link,
          event_additional_info: USER_EVENT_DETAILS.additional_info,

          // Offer details (will be null if not an offer post)
          offer_id: USER_OFFER_DETAILS.id,
          valid_from: USER_OFFER_DETAILS.valid_from,
          valid_until: USER_OFFER_DETAILS.valid_until,
          coupon_code: USER_OFFER_DETAILS.coupon_code,
          website_url: USER_OFFER_DETAILS.website_url,

          // Complaint details (will be null if not a complaint post)
          complaint_id: USER_COMPLAINT_POSTS.id,
          complaint_brand_id: USER_COMPLAINT_POSTS.brand_id,
          complaint_brand_name: BRANDS.name,
          complaint_product_id: USER_COMPLAINT_POSTS.product_id,
          complaint_product_name: PRODUCTS.name,
          complaint_specific_product_name: USER_COMPLAINT_POSTS.specific_product_name,
          complaint_service_center_page_id: USER_COMPLAINT_POSTS.service_center_page_id,
          complaint_status: USER_COMPLAINT_POSTS.status,
          complaint_user_status: USER_COMPLAINT_POSTS.user_confirmation_status,
          complaint_reported_at: USER_COMPLAINT_POSTS.reported_at,
          complaint_completed_at: USER_COMPLAINT_POSTS.completed_at,
          complaint_additional_info: USER_COMPLAINT_POSTS.additional_info,

          // News details (will be null if not a news post)
          article_url: USER_NEWS_DETAILS.article_url,
          summary: USER_NEWS_DETAILS.summary,
          language_id: USER_NEWS_DETAILS.language_id,
          is_high_priority: USER_NEWS_DETAILS.is_high_priority,
          is_breaking: USER_NEWS_DETAILS.is_breaking,
          breaking_expire_at: USER_NEWS_DETAILS.breaking_expire_at,

          // Creator details (user or page)
          user_name: USERS.name,
          user_profile_image: USER_PROFILES.profile_pic_url,
          user_joined_at: USERS.created_at,

          page_name: PAGES.name,
          page_profile_image: PAGE_PROFILES.profile_pic_url,
          page_joined_at: PAGES.created_at,
          page_type_name: PAGE_TYPES.name,

          like_count: sql`(
            SELECT COUNT(*) FROM user_post_likes
            WHERE user_post_likes.post_id = ${USER_POSTS.id}
          )`.as("like_count"),

          is_liked_by_user: sql`EXISTS (
            SELECT 1 FROM user_post_likes
            WHERE user_post_likes.post_id = ${USER_POSTS.id}
            AND user_post_likes.user_id = ${viewerId}
          )`.as("is_liked_by_user"),

          is_applied_by_user: sql`EXISTS (
            SELECT 1 FROM user_post_registrations
            WHERE user_post_registrations.post_id = ${USER_POSTS.id}
            AND user_post_registrations.user_id = ${viewerId}
          )`.as("is_applied_by_user"),

          unread_messages_count: sql`(
            SELECT COUNT(*) FROM post_chat_messages
            WHERE post_chat_messages.post_id = ${USER_POSTS.id}
            AND (
              (${viewerRole} = 'admin' AND post_chat_messages.is_read_by_admin = false)
              OR
              (${viewerRole} != 'admin' AND post_chat_messages.sender_type != 'user' AND post_chat_messages.sender_id != ${viewerId} AND post_chat_messages.is_read_by_user = false)
            )
          )`.as("unread_messages_count"),
        })
        .from(USER_POSTS)
        .leftJoin(USER_JOB_DETAILS, eq(USER_POSTS.id, USER_JOB_DETAILS.post_id))
        .leftJoin(JOB_EXPERIENCE, eq(USER_JOB_DETAILS.id, JOB_EXPERIENCE.job_id))
        .leftJoin(USER_EVENT_DETAILS, eq(USER_POSTS.id, USER_EVENT_DETAILS.post_id))
        .leftJoin(USER_OFFER_DETAILS, eq(USER_POSTS.id, USER_OFFER_DETAILS.post_id))
        .leftJoin(USER_COMPLAINT_POSTS, eq(USER_POSTS.id, USER_COMPLAINT_POSTS.post_id))
        .leftJoin(BRANDS, eq(USER_COMPLAINT_POSTS.brand_id, BRANDS.id))
        .leftJoin(PRODUCTS, eq(USER_COMPLAINT_POSTS.product_id, PRODUCTS.id))
        .leftJoin(USER_NEWS_DETAILS, eq(USER_POSTS.id, USER_NEWS_DETAILS.post_id))
        .leftJoin(POST_CATEGORY_TEMPLATES, eq(USER_POSTS.category_id, POST_CATEGORY_TEMPLATES.id))
        // Join for user creators
        .leftJoin(USERS, and(
          eq(USER_POSTS.creator_type, "user"),
          eq(USER_POSTS.creator_id, USERS.id)
        ))
        .leftJoin(USER_PROFILES, and(
          eq(USER_POSTS.creator_type, "user"),
          eq(USER_PROFILES.user_id, USERS.id)
        ))
        // Join for page creators
        .leftJoin(PAGES, and(
          eq(USER_POSTS.creator_type, "page"),
          eq(USER_POSTS.creator_id, PAGES.id)
        ))
        .leftJoin(PAGE_PROFILES, and(
          eq(USER_POSTS.creator_type, "page"),
          eq(PAGE_PROFILES.page_id, PAGES.id)
        ))
        .leftJoin(PAGE_TYPES, and(
          eq(USER_POSTS.creator_type, "page"),
          eq(PAGES.page_type_id, PAGE_TYPES.id)
        ))
        .where(finalWhereConditions)
        .orderBy(sql`${USER_POSTS.created_at} DESC`);
    } catch (error) {
      console.error("Error in main query:", error);
      throw error;
    }

    console.log("Main query executed, posts found:", rawPosts.length);

    // Fetch all tags for these posts
    const allPostIds = rawPosts.map(post => post.id);
    const postTagsData = allPostIds.length > 0 ? await db
      .select({
        post_id: POST_TAGS.post_id,
        tagged_type: POST_TAGS.tagged_type,
        tagged_id: POST_TAGS.tagged_id,
        is_accepted: POST_TAGS.is_accepted,
        // Tagged user details
        tagged_user_name: USERS.name,
        tagged_user_profile: USER_PROFILES.profile_pic_url,
        // Tagged page details  
        tagged_page_name: PAGES.name,
        tagged_page_profile: PAGE_PROFILES.profile_pic_url,
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
      .leftJoin(PAGES, and(
        eq(POST_TAGS.tagged_type, "page"),
        eq(POST_TAGS.tagged_id, PAGES.id)
      ))
      .leftJoin(PAGE_PROFILES, and(
        eq(POST_TAGS.tagged_type, "page"),
        eq(PAGE_PROFILES.page_id, PAGES.id)
      ))
      .where(and(
        inArray(POST_TAGS.post_id, allPostIds),
        eq(POST_TAGS.is_accepted, true)
      ))
      : [];

    // Fetch all images for these posts
    const postImagesData = allPostIds.length > 0 ? await db
      .select({
        post_id: POST_IMAGES.post_id,
        image_url: POST_IMAGES.image_url,
        is_primary: POST_IMAGES.is_primary,
        display_order: POST_IMAGES.display_order,
      })
      .from(POST_IMAGES)
      .where(inArray(POST_IMAGES.post_id, allPostIds))
      .orderBy(POST_IMAGES.display_order)
      : [];

    // Group images by post_id
    const postImagesMap = {};
    postImagesData.forEach(img => {
      if (!postImagesMap[img.post_id]) {
        postImagesMap[img.post_id] = [];
      }
      postImagesMap[img.post_id].push({
        image_url: img.image_url,
        is_primary: img.is_primary,
        display_order: img.display_order,
      });
    });

    // Group tags by post_id
    const postTagsMap = {};
    postTagsData.forEach(tag => {
      if (!postTagsMap[tag.post_id]) {
        postTagsMap[tag.post_id] = [];
      }
      
      // Determine tagged entity details based on tagged_type
      let taggedName, taggedProfile;
      if (tag.tagged_type === 'user') {
        taggedName = tag.tagged_user_name;
        taggedProfile = tag.tagged_user_profile;
      } else if (tag.tagged_type === 'page') {
        taggedName = tag.tagged_page_name;
        taggedProfile = tag.tagged_page_profile;
      }
      
      postTagsMap[tag.post_id].push({
        tagged_type: tag.tagged_type,
        tagged_id: tag.tagged_id,
        is_accepted: tag.is_accepted,
        tagged_user_name: taggedName,
        tagged_user_profile: taggedProfile,
      });
    });

    // Get all job post IDs to fetch related skills and education
    const jobPostIds = rawPosts
      .filter(post => post.post_type === 'job' && post.job_id)
      .map(post => post.job_id);

    // Fetch skills for job posts
    let jobSkills = [];
    if (jobPostIds.length > 0) {
      jobSkills = await db
        .select({
          job_id: JOB_SKILLS_MAP.job_id,
          skill_id: SKILLS.id,
          skill_name: SKILLS.name,
        })
        .from(JOB_SKILLS_MAP)
        .innerJoin(SKILLS, eq(JOB_SKILLS_MAP.skill_id, SKILLS.id))
        .where(inArray(JOB_SKILLS_MAP.job_id, jobPostIds));
    }

    // Fetch education for job posts
    let jobEducation = [];
    if (jobPostIds.length > 0) {
      jobEducation = await db
        .select({
          job_id: JOB_EDUCATION_MAP.job_id,
          education_id: EDUCATION_QUALIFICATIONS.id,
          education_name: EDUCATION_QUALIFICATIONS.name,
        })
        .from(JOB_EDUCATION_MAP)
        .innerJoin(EDUCATION_QUALIFICATIONS, eq(JOB_EDUCATION_MAP.education_id, EDUCATION_QUALIFICATIONS.id))
        .where(inArray(JOB_EDUCATION_MAP.job_id, jobPostIds));
    }

    // Group skills and education by job_id
    const skillsByJobId = jobSkills.reduce((acc, item) => {
      if (!acc[item.job_id]) acc[item.job_id] = [];
      acc[item.job_id].push({ id: item.skill_id, name: item.skill_name });
      return acc;
    }, {});

    const educationByJobId = jobEducation.reduce((acc, item) => {
      if (!acc[item.job_id]) acc[item.job_id] = [];
      acc[item.job_id].push({ id: item.education_id, name: item.education_name });
      return acc;
    }, {});

    const posts = rawPosts.map(post => {
      // Determine creator details based on creator_type
      let creatorName, creatorProfileImage, creatorJoinedAt, creatorPageType;
      
      if (post.creator_type === 'user') {
        creatorName = post.user_name;
        creatorProfileImage = post.user_profile_image;
        creatorJoinedAt = post.user_joined_at;
        creatorPageType = 'User'; // or null
      } else if (post.creator_type === 'page') {
        creatorName = post.page_name;
        creatorProfileImage = post.page_profile_image;
        creatorJoinedAt = post.page_joined_at;
        creatorPageType = post.page_type_name;
      }

      const basePost = {
        id: post.id,
        title: post.title,
        description: post.description,
        image_url: post.image_url,
        images: postImagesMap[post.id] || [],
        latitude: post.latitude,
        longitude: post.longitude,
        created_at: post.created_at,
        delete_after_hours: post.delete_after_hours,
        is_permanent: post.is_permanent,
        post_type: post.post_type,
        creator_type: post.creator_type,
        creator_id: post.creator_id,
        category_id: post.category_id,
        category_name: post.category_name,
        category_icon: post.category_icon,
        category_color: post.category_color,
        like_count: post.like_count || 0,
        is_liked_by_user: !!post.is_liked_by_user,
        unread_messages_count: parseInt(post.unread_messages_count) || 0,
        user_profile_image: creatorProfileImage,
        user_name: creatorName,
        joined_at: creatorJoinedAt,
        created_by: post.creator_id,
        page_type_name: creatorPageType,
        tags: postTagsMap[post.id] || [],
      };

      // Add additional details based on post_type
      switch (post.post_type) {
        case 'job':
          if (post.job_type || post.job_link || post.is_paid !== null) {
            basePost.job_details = {
              job_type: post.job_type,
              link: post.job_link,
              is_paid: post.is_paid,
              salary_or_stipend: post.salary_or_stipend,
              location_type: post.location_type,
              duration: post.duration,
              application_deadline: post.application_deadline,
              event_name: post.event_name,
              event_date: post.event_date,
              additional_info: post.additional_info,
              // New structured data
              experience: {
                min_years: post.min_years || 0,
                max_years: post.max_years || 0
              },
              skills: skillsByJobId[post.job_id] || [],
              education_qualifications: educationByJobId[post.job_id] || [],
              is_applied_by_user: !!post.is_applied_by_user,
            };
          }
          break;

        case 'news':
          if (post.article_url || post.summary || post.is_high_priority !== null) {
            basePost.news_details = {
              source_name: creatorName,
              article_url: post.article_url,
              summary: post.summary,
              language_id: post.language_id,
              is_high_priority: post.is_high_priority,
              is_breaking: post.is_breaking,
              breaking_expire_at: post.breaking_expire_at,
            };
          }
          break;

        case 'event':
          if (post.event_type || post.event_event_name || post.event_link) {
            basePost.event_details = {
              event_type: post.event_type,
              event_name: post.event_event_name,
              event_date: post.event_event_date,
              link: post.event_link,
              additional_info: post.event_additional_info,
              is_applied_by_user: !!post.is_applied_by_user,
            };
          }
          break;

        case 'offers':
          if (post.valid_from || post.valid_until || post.coupon_code || post.website_url) {
            basePost.offer_details = {
              valid_from: post.valid_from,
              valid_until: post.valid_until,
              coupon_code: post.coupon_code,
              website_url: post.website_url,
            };
          }

        case 'complaints':
          if (post.complaint_id) {
            basePost.complaint_details = {
              brand_id: post.complaint_brand_id,
              brand_name: post.complaint_brand_name,
              product_id: post.complaint_product_id,
              product_name: post.complaint_product_name,
              specific_product_name: post.complaint_specific_product_name,
              service_center_page_id: post.complaint_service_center_page_id,
              status: post.complaint_status,
              user_confirmation_status: post.complaint_user_status,
              reported_at: post.complaint_reported_at,
              completed_at: post.complaint_completed_at,
              additional_info: post.complaint_additional_info,
            };
          }
          break;

        case 'general':
        default:
          // No additional details for general posts
          break;
      }

      return basePost;
    });

    // Fetch categories via page type
    const pageTypeId = pageData.page_type_id;
    const categories = await db
      .select({
        id: POST_CATEGORY_TEMPLATES.id,
        name: POST_CATEGORY_TEMPLATES.name,
        shape: POST_CATEGORY_TEMPLATES.shape,
        icon_name: POST_CATEGORY_TEMPLATES.icon_name,
        color: POST_CATEGORY_TEMPLATES.color,
        class_name: POST_CATEGORY_TEMPLATES.class_name
      })
      .from(PAGE_TYPE_CATEGORY_PERMISSIONS)
      .innerJoin(POST_CATEGORY_TEMPLATES, eq(PAGE_TYPE_CATEGORY_PERMISSIONS.category_template_id, POST_CATEGORY_TEMPLATES.id))
      .where(eq(PAGE_TYPE_CATEGORY_PERMISSIONS.page_type_id, pageTypeId));

    // Fetch registrations if owner
    let registrations = [];
    if (isOwner) {
      registrations = await db
        .select({
          id: USER_POST_REGISTRATIONS.id,
          post_id: USER_POST_REGISTRATIONS.post_id,
          user_id: USER_POST_REGISTRATIONS.user_id,
          user_latitude: USER_POST_REGISTRATIONS.user_latitude,
          user_longitude: USER_POST_REGISTRATIONS.user_longitude,
          note: USER_POST_REGISTRATIONS.note,
          resume_url: USER_POST_REGISTRATIONS.resume_url,
          created_at: USER_POST_REGISTRATIONS.created_at,

          user_name: USERS.name,
          // user_email: USERS.email,
          user_profile_image: USER_PROFILES.profile_pic_url,

          post_title: USER_POSTS.title,
          post_category_name: POST_CATEGORY_TEMPLATES.name
        })
        .from(USER_POST_REGISTRATIONS)
        .innerJoin(USERS, eq(USER_POST_REGISTRATIONS.user_id, USERS.id))
        .innerJoin(USER_PROFILES, eq(USER_PROFILES.user_id, USERS.id))
        .innerJoin(USER_POSTS, eq(USER_POST_REGISTRATIONS.post_id, USER_POSTS.id))
        .innerJoin(POST_CATEGORY_TEMPLATES, eq(USER_POSTS.category_id, POST_CATEGORY_TEMPLATES.id))
        .where(and(
          eq(USER_POSTS.creator_type, "page"),
          eq(USER_POSTS.creator_id, parseInt(pageId))
        ))
        .orderBy(sql`${USER_POST_REGISTRATIONS.created_at} DESC`);
    }

    return NextResponse.json({
      posts,
      categories,
      registrations,
      user: {
        id: viewerId,
        role: viewerRole,
      }
    });

  } catch (err) {
    console.error("Page API Error", err);
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}