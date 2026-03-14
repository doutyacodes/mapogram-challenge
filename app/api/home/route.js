import { db } from "@/utils";
import jwt from 'jsonwebtoken';
import {
  USER_POSTS, 
  USER_JOB_DETAILS, 
  USER_NEWS_DETAILS, 
  POST_CATEGORY_TEMPLATES, 
  USERS, 
  USER_PROFILES, 
  USER_POST_REGISTRATIONS,
  JOB_SKILLS_MAP,
  SKILLS,
  JOB_EDUCATION_MAP,
  EDUCATION_QUALIFICATIONS,
  JOB_EXPERIENCE,
  POST_LAYER_MAP,
  CATEGORY_LAYER_MAP,
  LANGUAGES,
  PAGE_TYPES,
  USER_POST_VIEWS,
  LAYERS,
  USER_EVENT_DETAILS,
  USER_FOLLOWED_LAYERS
} from "@/utils/schema/schema";
import { FRIENDS, USER_PERSONAL_EVENT_DETAILS } from "@/utils/schema/friendsLayer_schema";

import { NextResponse } from "next/server";
import { eq, and, gte, lte, or, sql, inArray, desc, asc } from "drizzle-orm";

export async function GET(req) {
  try {
    const url = new URL(req.url);
    const token = req.cookies.get("user_token")?.value;

    if (!token) return NextResponse.json({ message: "Authentication required" }, { status: 401 });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const viewerId = decoded.id;
    const viewerRole = decoded.role;

    // Get user's location from query params or user profile
    const userLat = parseFloat(url.searchParams.get("userLat"));
    const userLng = parseFloat(url.searchParams.get("userLng"));
    const radiusKm = parseFloat(url.searchParams.get("radiusKm")) || 10; // Default 10km radius

    if (!userLat || !userLng) {
      return NextResponse.json({ 
        message: "User location is required for home feed" 
      }, { status: 400 });
    }

    console.log("Home API - viewerId:", viewerId, "location:", userLat, userLng, "radius:", radiusKm);

    // Get all layers that the user follows
    const followedLayers = await db
      .select({
        layer_id: USER_FOLLOWED_LAYERS.layer_id,
        layer_name: LAYERS.name
      })
      .from(USER_FOLLOWED_LAYERS)
      .innerJoin(LAYERS, eq(USER_FOLLOWED_LAYERS.layer_id, LAYERS.id))
      .where(eq(USER_FOLLOWED_LAYERS.user_id, viewerId));

    if (followedLayers.length === 0) {
      return NextResponse.json({ posts: [], categories: [] });
    }

    const layerIds = followedLayers.map(layer => layer.layer_id);
    const friendshipLayerIds = followedLayers
      .filter(layer => layer.layer_name.toLowerCase() === 'My Friends')
      .map(layer => layer.layer_id);

    let allPostIds = [];
    
    // Handle friendship layers separately
    if (friendshipLayerIds.length > 0) {
      // Get friends' posts from last 24 hours only
      const friends = await db
        .select({
          friend_id: sql`CASE 
            WHEN ${FRIENDS.user1_id} = ${viewerId} THEN ${FRIENDS.user2_id}
            ELSE ${FRIENDS.user1_id}
          END`.as("friend_id")
        })
        .from(FRIENDS)
        .where(
          or(
            eq(FRIENDS.user1_id, viewerId),
            eq(FRIENDS.user2_id, viewerId)
          )
        );

      const friendIds = friends.map(f => f.friend_id);
      
      if (friendIds.length > 0) {
        // Get posts from friends in the last 24 hours with location filtering
        const friendsPosts = await db
          .select({ 
            post_id: USER_POSTS.id,
            latitude: USER_POSTS.latitude,
            longitude: USER_POSTS.longitude
          })
          .from(USER_POSTS)
          .where(
            and(
              inArray(USER_POSTS.page_id, friendIds),
              gte(USER_POSTS.created_at, sql`DATE_SUB(NOW(), INTERVAL 24 HOUR)`)
            )
          );

        // Filter friends' posts by radius
        const friendsPostsInRadius = friendsPosts.filter(post => {
          if (!post.latitude || !post.longitude) return false;
          const distance = calculateDistance(userLat, userLng, post.latitude, post.longitude);
          return distance <= radiusKm;
        });

        allPostIds.push(...friendsPostsInRadius.map(fp => fp.post_id));
      }
    }
    
    // Handle other layers (non-friendship)
    const nonFriendshipLayerIds = layerIds.filter(id => !friendshipLayerIds.includes(id));
    
    if (nonFriendshipLayerIds.length > 0) {
      // Get posts from other layers with location filtering
      const otherLayerPosts = await db
        .select({ 
          post_id: POST_LAYER_MAP.post_id,
          latitude: USER_POSTS.latitude,
          longitude: USER_POSTS.longitude
        })
        .from(POST_LAYER_MAP)
        .innerJoin(USER_POSTS, eq(POST_LAYER_MAP.post_id, USER_POSTS.id))
        .where(inArray(POST_LAYER_MAP.layer_id, nonFriendshipLayerIds));

      // Filter other layer posts by radius
      const otherLayerPostsInRadius = otherLayerPosts.filter(post => {
        if (!post.latitude || !post.longitude) return false;
        const distance = calculateDistance(userLat, userLng, post.latitude, post.longitude);
        return distance <= radiusKm;
      });

      allPostIds.push(...otherLayerPostsInRadius.map(lp => lp.post_id));
    }

    if (allPostIds.length === 0) {
      return NextResponse.json({ posts: [], categories: [] });
    }

    // Remove duplicates
    allPostIds = [...new Set(allPostIds)];

    const whereConditions = [inArray(USER_POSTS.id, allPostIds)];

    // Filter parameters
    const jobType = url.searchParams.get("jobType");
    const locationType = url.searchParams.get("locationType");
    const isPaid = url.searchParams.get("isPaid");
    const skillIds = url.searchParams.get("skillIds");
    const educationIds = url.searchParams.get("educationIds");
    const minExperience = url.searchParams.get("minExperience");
    const maxExperience = url.searchParams.get("maxExperience");
    const applicationDeadline = url.searchParams.get("applicationDeadline");
    
    // News filters
    const languageId = url.searchParams.get("languageId");
    const isHighPriority = url.searchParams.get("isHighPriority");
    const isBreaking = url.searchParams.get("isBreaking");
    const newsType = url.searchParams.get("newsType");
    
    // Common filters
    const sortBy = url.searchParams.get("sortBy") || "created_at";
    const sortOrder = url.searchParams.get("sortOrder") || "desc";
    const limit = url.searchParams.get("limit");
    
    // Quick Action Filters
    const quickFilter = url.searchParams.get("quickFilter");
    
    let query = db
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
        created_by: USER_POSTS.page_id,

        category_id: USER_POSTS.category_id,
        category_name: POST_CATEGORY_TEMPLATES.name,
        category_icon: POST_CATEGORY_TEMPLATES.icon_name,
        category_color: POST_CATEGORY_TEMPLATES.color,

        // Job details
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

        // Event details
        event_id: USER_EVENT_DETAILS.id,
        event_type: USER_EVENT_DETAILS.event_type,
        event_event_name: USER_EVENT_DETAILS.event_name,
        event_event_date: USER_EVENT_DETAILS.event_date,
        event_link: USER_EVENT_DETAILS.link,
        event_additional_info: USER_EVENT_DETAILS.additional_info,

        // Personal Event details for friendship layer
        personal_event_id: USER_PERSONAL_EVENT_DETAILS.id,
        personal_event_date: USER_PERSONAL_EVENT_DETAILS.event_date,
        personal_contact_info: USER_PERSONAL_EVENT_DETAILS.contact_info,
        personal_additional_info: USER_PERSONAL_EVENT_DETAILS.additional_info,

        // News details
        source_name: USERS.name,
        user_profile_image: USER_PROFILES.profile_pic_url,
        joined_at: USERS.created_at,
        page_type_name: PAGE_TYPES.name,

        article_url: USER_NEWS_DETAILS.article_url,
        summary: USER_NEWS_DETAILS.summary,
        language_id: USER_NEWS_DETAILS.language_id,
        language_name: LANGUAGES.name,
        language_code: LANGUAGES.code,
        is_high_priority: USER_NEWS_DETAILS.is_high_priority,
        is_breaking: USER_NEWS_DETAILS.is_breaking,
        breaking_expire_at: USER_NEWS_DETAILS.breaking_expire_at,
        
        like_count: sql`(
          SELECT COUNT(*) FROM user_post_likes
          WHERE user_post_likes.post_id = ${USER_POSTS.id}
        )`.as("like_count"),

        view_count_24h: sql`(
          SELECT COUNT(*) FROM ${USER_POST_VIEWS}
          WHERE ${USER_POST_VIEWS.post_id} = ${USER_POSTS.id}
          AND ${USER_POST_VIEWS.viewed_at} >= DATE_SUB(NOW(), INTERVAL 24 HOUR)
        )`.as("view_count_24h"),

        is_liked_by_user: sql`EXISTS (
          SELECT 1 FROM user_post_likes
          WHERE user_post_likes.post_id = ${USER_POSTS.id}
          AND user_post_likes.user_id = ${viewerId}
        )`.as("is_liked_by_user"),

        is_applied_by_user: sql`EXISTS (
          SELECT 1 FROM ${USER_POST_REGISTRATIONS}
          WHERE ${USER_POST_REGISTRATIONS.post_id} = ${USER_POSTS.id}
          AND ${USER_POST_REGISTRATIONS.user_id} = ${viewerId}
        )`.as("is_applied_by_user"),

        // Add distance calculation
        distance_km: sql`(
          6371 * acos(
            cos(radians(${userLat})) * 
            cos(radians(${USER_POSTS.latitude})) * 
            cos(radians(${USER_POSTS.longitude}) - radians(${userLng})) + 
            sin(radians(${userLat})) * 
            sin(radians(${USER_POSTS.latitude}))
          )
        )`.as("distance_km"),

        // Check if post is from friendship layer
        is_friendship_post: sql`EXISTS (
          SELECT 1 FROM ${POST_LAYER_MAP} plm
          INNER JOIN ${LAYERS} l ON plm.layer_id = l.id
          WHERE plm.post_id = ${USER_POSTS.id}
          AND l.name = 'my friends'
        ) OR EXISTS (
          SELECT 1 FROM ${FRIENDS} f
          WHERE (f.user1_id = ${viewerId} AND f.user2_id = ${USER_POSTS.page_id})
          OR (f.user2_id = ${viewerId} AND f.user1_id = ${USER_POSTS.page_id})
        )`.as("is_friendship_post")
      })
      .from(USER_POSTS)
      .leftJoin(USER_JOB_DETAILS, eq(USER_POSTS.id, USER_JOB_DETAILS.post_id))
      .leftJoin(JOB_EXPERIENCE, eq(USER_JOB_DETAILS.id, JOB_EXPERIENCE.job_id))
      .leftJoin(USER_EVENT_DETAILS, eq(USER_POSTS.id, USER_EVENT_DETAILS.post_id))
      .leftJoin(USER_PERSONAL_EVENT_DETAILS, eq(USER_POSTS.id, USER_PERSONAL_EVENT_DETAILS.post_id))
      .leftJoin(USER_NEWS_DETAILS, eq(USER_POSTS.id, USER_NEWS_DETAILS.post_id))
      .leftJoin(LANGUAGES, eq(USER_NEWS_DETAILS.language_id, LANGUAGES.id))
      .leftJoin(POST_CATEGORY_TEMPLATES, eq(USER_POSTS.category_id, POST_CATEGORY_TEMPLATES.id))
      .leftJoin(USERS, eq(USER_POSTS.page_id, USERS.id))
      .leftJoin(USER_PROFILES, eq(USER_PROFILES.user_id, USERS.id))
      .leftJoin(PAGE_TYPES, eq(USERS.page_type_id, PAGE_TYPES.id));

    // Apply filters (same as original API but without friendship layer check)
    if (quickFilter && quickFilter !== 'all') {
      switch (quickFilter) {
        case 'english':
          whereConditions.push(eq(LANGUAGES.code, 'en'));
          break;
      }
    }

    // Job-specific filters
    if (jobType && jobType !== 'all') {
      whereConditions.push(eq(USER_JOB_DETAILS.job_type, jobType));
    }

    if (locationType && locationType !== 'all') {
      whereConditions.push(eq(USER_JOB_DETAILS.location_type, locationType));
    }

    if (isPaid === 'true') {
      whereConditions.push(eq(USER_JOB_DETAILS.is_paid, true));
    } else if (isPaid === 'false') {
      whereConditions.push(eq(USER_JOB_DETAILS.is_paid, false));
    }

    if (minExperience || maxExperience) {
      if (minExperience) {
        whereConditions.push(gte(JOB_EXPERIENCE.min_years, parseInt(minExperience)));
      }
      if (maxExperience) {
        whereConditions.push(lte(JOB_EXPERIENCE.max_years, parseInt(maxExperience)));
      }
    }

    if (applicationDeadline) {
      whereConditions.push(gte(USER_JOB_DETAILS.application_deadline, applicationDeadline));
    }

    // News-specific filters
    if (languageId && languageId !== 'all') {
      whereConditions.push(eq(USER_NEWS_DETAILS.language_id, parseInt(languageId)));
    }

    if (isHighPriority === 'true') {
      whereConditions.push(eq(USER_NEWS_DETAILS.is_high_priority, true));
    }

    if (isBreaking === 'true') {
      whereConditions.push(eq(USER_NEWS_DETAILS.is_breaking, true));
    }

    if (newsType === 'priority') {
      whereConditions.push(eq(USER_NEWS_DETAILS.is_high_priority, true));
    } else if (newsType === 'breaking') {
      whereConditions.push(eq(USER_NEWS_DETAILS.is_breaking, true));
    }

    query = query.where(and(...whereConditions));

    // Handle sorting and limiting
    if (quickFilter && quickFilter !== 'all') {
      switch (quickFilter) {
        case 'trending':
          query = query
            .orderBy(desc(sql`view_count_24h`), desc(USER_POSTS.created_at))
            .limit(10);
          break;
        case 'latest':
          query = query
            .orderBy(desc(USER_POSTS.created_at))
            .limit(10);
          break;
        case 'nearby':
          query = query
            .orderBy(asc(sql`distance_km`), desc(USER_POSTS.created_at))
            .limit(10);
          break;
        default:
          if (sortBy === 'title') {
            query = query.orderBy(sortOrder === 'asc' ? asc(USER_POSTS.title) : desc(USER_POSTS.title));
          } else if (sortBy === 'distance') {
            query = query.orderBy(asc(sql`distance_km`));
          } else {
            query = query.orderBy(sortOrder === 'asc' ? asc(USER_POSTS.created_at) : desc(USER_POSTS.created_at));
          }
          
          if (limit) {
            query = query.limit(parseInt(limit));
          }
          break;
      }
    } else {
      if (sortBy === 'title') {
        query = query.orderBy(sortOrder === 'asc' ? asc(USER_POSTS.title) : desc(USER_POSTS.title));
      } else if (sortBy === 'distance') {
        query = query.orderBy(asc(sql`distance_km`));
      } else {
        query = query.orderBy(sortOrder === 'asc' ? asc(USER_POSTS.created_at) : desc(USER_POSTS.created_at));
      }

      if (limit) {
        query = query.limit(parseInt(limit));
      }
    }

    let rawPosts = await query;

    // Handle skill and education filters
    if (skillIds || educationIds) {
      const jobPostIds = rawPosts
        .filter(post => post.post_type === 'job' && post.job_id)
        .map(post => post.job_id);

      if (jobPostIds.length > 0) {
        let filteredJobIds = [...jobPostIds];

        if (skillIds) {
          const skillIdArray = skillIds.split(',').map(id => parseInt(id));
          const jobsWithSkills = await db
            .select({ job_id: JOB_SKILLS_MAP.job_id })
            .from(JOB_SKILLS_MAP)
            .where(
              and(
                inArray(JOB_SKILLS_MAP.job_id, jobPostIds),
                inArray(JOB_SKILLS_MAP.skill_id, skillIdArray)
              )
            )
            .groupBy(JOB_SKILLS_MAP.job_id)
            .having(sql`COUNT(DISTINCT ${JOB_SKILLS_MAP.skill_id}) >= ${skillIdArray.length}`);

          filteredJobIds = jobsWithSkills.map(j => j.job_id);
        }

        if (educationIds) {
          const educationIdArray = educationIds.split(',').map(id => parseInt(id));
          const jobsWithEducation = await db
            .select({ job_id: JOB_EDUCATION_MAP.job_id })
            .from(JOB_EDUCATION_MAP)
            .where(
              and(
                inArray(JOB_EDUCATION_MAP.job_id, filteredJobIds),
                inArray(JOB_EDUCATION_MAP.education_id, educationIdArray)
              )
            );

          filteredJobIds = jobsWithEducation.map(j => j.job_id);
        }

        rawPosts = rawPosts.filter(post => 
          post.post_type !== 'job' || (post.job_id && filteredJobIds.includes(post.job_id))
        );
      }
    }

    // Get skills and education for job posts
    const jobPostIds = rawPosts
      .filter(post => post.post_type === 'job' && post.job_id)
      .map(post => post.job_id);

    let jobSkills = [];
    let jobEducation = [];

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
        user_profile_image: post.user_profile_image,
        user_name: post.source_name,
        joined_at: post.joined_at,
        created_by: post.created_by,
        page_type_name: post.page_type_name,
        distance_km: parseFloat(post.distance_km?.toFixed(2)) || 0,
        is_friendship_post: !!post.is_friendship_post
      };

      // Add status field for friendship posts
      if (post.is_friendship_post) {
        if (post.delete_after_hours !== null && post.delete_after_hours > 0) {
          basePost.status = 'story';
        } else if (post.is_permanent) {
          basePost.status = 'permanent';
        } else {
          basePost.status = 'normal';
        }
      }

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
              source_name: post.source_name,
              article_url: post.article_url,
              summary: post.summary,
              language_id: post.language_id,
              language_name: post.language_name,
              language_code: post.language_code,
              is_high_priority: post.is_high_priority,
              is_breaking: post.is_breaking,
              breaking_expire_at: post.breaking_expire_at,
            };
          }
          break;

        case 'event':
          if (post.is_friendship_post) {
            // Use personal event details for friendship posts
            if (post.personal_event_id) {
              basePost.event_details = {
                event_date: post.personal_event_date,
                contact_info: post.personal_contact_info,
                additional_info: post.personal_additional_info,
                is_applied_by_user: !!post.is_applied_by_user,
              };
            }
          } else {
            // Use regular event details for other posts
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
          }
          break;

        case 'general':
        default:
          break;
      }

      return basePost;
    });

    // Fetch all categories from all followed layers
    const categories = await db
      .select({
        id: POST_CATEGORY_TEMPLATES.id,
        name: POST_CATEGORY_TEMPLATES.name,
        shape: POST_CATEGORY_TEMPLATES.shape,
        icon_name: POST_CATEGORY_TEMPLATES.icon_name,
        color: POST_CATEGORY_TEMPLATES.color,
        class_name: POST_CATEGORY_TEMPLATES.class_name
      })
      .from(CATEGORY_LAYER_MAP)
      .innerJoin(POST_CATEGORY_TEMPLATES, eq(CATEGORY_LAYER_MAP.category_id, POST_CATEGORY_TEMPLATES.id))
      .where(inArray(CATEGORY_LAYER_MAP.layer_id, layerIds))
      .groupBy(POST_CATEGORY_TEMPLATES.id); // Remove duplicates

    return NextResponse.json({
      posts,
      categories,
      user: {
        id: viewerId,
        role: viewerRole,
      },
      location: {
        lat: userLat,
        lng: userLng,
        radius_km: radiusKm
      },
      followed_layers: followedLayers
    });

  } catch (err) {
    console.error("Home API Error", err);
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}

// Helper function to calculate distance between two points using Haversine formula
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Radius of the Earth in kilometers
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  const d = R * c; // Distance in kilometers
  return d;
}

function deg2rad(deg) {
  return deg * (Math.PI/180);
}