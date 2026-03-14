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
  POST_LAYER_MAP,
  CATEGORY_LAYER_MAP,
  LANGUAGES,
  PAGE_TYPES,
  USER_POST_VIEWS,
  LAYERS,
  USER_EVENT_DETAILS,
  POST_TAGS,
  USER_FOLLOWED_PAGES,
  USER_OFFER_DETAILS
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

  // Handle guest users
  const isGuest = decoded.isGuest || false;
  const viewerId = isGuest ? null : decoded.id;
  const viewerRole = isGuest ? 'guest' : decoded.role;
  const sessionId = isGuest ? decoded.sessionId : null;


  const layerId = url.searchParams.get("layerId");
  if (!layerId) return NextResponse.json({ posts: [], categories: [] });

  console.log("layerId:", layerId, "viewerId:", viewerId);
  console.log("User info:", { isGuest, viewerId, sessionId, layerId });

  // Check layer type
  const layerInfo = await db
    .select({ name: LAYERS.name })
    .from(LAYERS)
    .where(eq(LAYERS.id, parseInt(layerId)))
    .limit(1);

   const layerName = layerInfo.length > 0 ? layerInfo[0].name.toLowerCase() : '';

  const isFriendshipLayer = layerName === 'my friends';
  const isMyPagesLayer = layerName === 'my pages';

  // Block friendship and pages layers for guest users
  if (isGuest && (isFriendshipLayer || isMyPagesLayer)) {
    return NextResponse.json({ 
      message: "Authentication required for this layer",
      posts: [], 
      categories: [] 
    }, { status: 401 });
  }

  let postIds = [];

  if (isFriendshipLayer) {
      // For friendship layer, get friends' posts from last 24 hours only
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

      console.log("friendIds", friendIds)
      
      if (friendIds.length === 0) {
        return NextResponse.json({ posts: [], categories: [] });
      }

      // Get posts from friends in the last 24 hours only
      // Now checking for creator_type = 'user' and creator_id in friendIds
      const friendsPosts = await db
        .select({ post_id: USER_POSTS.id })
        .from(USER_POSTS)
        .where(
          and(
            eq(USER_POSTS.creator_type, 'user'),
            inArray(USER_POSTS.creator_id, friendIds),
            gte(USER_POSTS.created_at, sql`DATE_SUB(NOW(), INTERVAL 24 HOUR)`)
          )
        );

      postIds = friendsPosts.map(fp => fp.post_id);
    } else if (isMyPagesLayer) {
      // For my pages layer, get posts from pages user follows
      const followedPages = await db
        .select({ page_id: USER_FOLLOWED_PAGES.page_id })
        .from(USER_FOLLOWED_PAGES)
        .where(eq(USER_FOLLOWED_PAGES.user_id, viewerId));

      const followedPageIds = followedPages.map(fp => fp.page_id);
      
      if (followedPageIds.length === 0) {
        return NextResponse.json({ posts: [], categories: [] });
      }

      // Get all posts from followed pages
      const pagesPosts = await db
        .select({ post_id: USER_POSTS.id })
        .from(USER_POSTS)
        .where(
          and(
            eq(USER_POSTS.creator_type, 'page'),
            inArray(USER_POSTS.creator_id, followedPageIds)
          )
        );

      postIds = pagesPosts.map(pp => pp.post_id);
    } else {
      // For other layers, get post IDs that belong to this layer
      const layerPosts = await db
        .select({ post_id: POST_LAYER_MAP.post_id })
        .from(POST_LAYER_MAP)
        .where(eq(POST_LAYER_MAP.layer_id, parseInt(layerId)));

      postIds = layerPosts.map(lp => lp.post_id);
    }
    
    if (postIds.length === 0) {
      return NextResponse.json({ posts: [], categories: [] });
    }

    const whereConditions = [inArray(USER_POSTS.id, postIds)];

    // Filter parameters (only apply to regular layers, not friendship or my pages)
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
    const newsType = url.searchParams.get("newsType"); // latest, priority, breaking, all
    
    // Common filters
    const sortBy = url.searchParams.get("sortBy") || "created_at"; // created_at, title
    const sortOrder = url.searchParams.get("sortOrder") || "desc"; // asc, desc
    const limit = url.searchParams.get("limit");
    
    // New Quick Action Filters
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
        is_story: USER_POSTS.is_story,
        is_permanent: USER_POSTS.is_permanent,
        post_type: USER_POSTS.post_type,
        creator_type: USER_POSTS.creator_type,
        creator_id: USER_POSTS.creator_id,

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

        // Event details (will be null if not an event post)
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

        // Offer details (will be null if not an offer post)
        offer_id: USER_OFFER_DETAILS.id,
        valid_from: USER_OFFER_DETAILS.valid_from,
        valid_until: USER_OFFER_DETAILS.valid_until,
        coupon_code: USER_OFFER_DETAILS.coupon_code,
        website_url: USER_OFFER_DETAILS.website_url,

        // News details
        article_url: USER_NEWS_DETAILS.article_url,
        summary: USER_NEWS_DETAILS.summary,
        language_id: USER_NEWS_DETAILS.language_id,
        language_name: LANGUAGES.name,
        language_code: LANGUAGES.code,
        is_high_priority: USER_NEWS_DETAILS.is_high_priority,
        is_breaking: USER_NEWS_DETAILS.is_breaking,
        breaking_expire_at: USER_NEWS_DETAILS.breaking_expire_at,

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
        
        like_count: sql`(
          SELECT COUNT(*) FROM user_post_likes
          WHERE user_post_likes.post_id = ${USER_POSTS.id}
        )`.as("like_count"),

        // Add view count for trending calculation
        view_count_24h: sql`(
          SELECT COUNT(*) FROM ${USER_POST_VIEWS}
          WHERE ${USER_POST_VIEWS.post_id} = ${USER_POSTS.id}
          AND ${USER_POST_VIEWS.viewed_at} >= DATE_SUB(NOW(), INTERVAL 24 HOUR)
        )`.as("view_count_24h"),

        is_liked_by_user: isGuest ? sql`FALSE`.as("is_liked_by_user") : sql`EXISTS (
          SELECT 1 FROM user_post_likes
          WHERE user_post_likes.post_id = ${USER_POSTS.id}
          AND user_post_likes.user_id = ${viewerId}
        )`.as("is_liked_by_user"),

        is_applied_by_user: isGuest ? sql`FALSE`.as("is_applied_by_user") : sql`EXISTS (
          SELECT 1 FROM ${USER_POST_REGISTRATIONS}
          WHERE ${USER_POST_REGISTRATIONS.post_id} = ${USER_POSTS.id}
          AND ${USER_POST_REGISTRATIONS.user_id} = ${viewerId}
        )`.as("is_applied_by_user"),
      })
      .from(USER_POSTS)
      .leftJoin(USER_JOB_DETAILS, eq(USER_POSTS.id, USER_JOB_DETAILS.post_id))
      .leftJoin(JOB_EXPERIENCE, eq(USER_JOB_DETAILS.id, JOB_EXPERIENCE.job_id))
      .leftJoin(USER_EVENT_DETAILS, eq(USER_POSTS.id, USER_EVENT_DETAILS.post_id))
      .leftJoin(USER_PERSONAL_EVENT_DETAILS, eq(USER_POSTS.id, USER_PERSONAL_EVENT_DETAILS.post_id))
      .leftJoin(USER_OFFER_DETAILS, eq(USER_POSTS.id, USER_OFFER_DETAILS.post_id))
      .leftJoin(USER_NEWS_DETAILS, eq(USER_POSTS.id, USER_NEWS_DETAILS.post_id))
      .leftJoin(LANGUAGES, eq(USER_NEWS_DETAILS.language_id, LANGUAGES.id))
      .leftJoin(POST_CATEGORY_TEMPLATES, eq(USER_POSTS.category_id, POST_CATEGORY_TEMPLATES.id))
      // Join with USERS table when creator_type = 'user'
      .leftJoin(USERS, and(
        eq(USER_POSTS.creator_type, 'user'),
        eq(USER_POSTS.creator_id, USERS.id)
      ))
      .leftJoin(USER_PROFILES, eq(USER_PROFILES.user_id, USERS.id))
      // Join with PAGES table when creator_type = 'page'
      .leftJoin(PAGES, and(
        eq(USER_POSTS.creator_type, 'page'),
        eq(USER_POSTS.creator_id, PAGES.id)
      ))
      .leftJoin(PAGE_PROFILES, eq(PAGE_PROFILES.page_id, PAGES.id))
      .leftJoin(PAGE_TYPES, eq(PAGES.page_type_id, PAGE_TYPES.id));

    // Apply filters only for regular layers (not friendship or my pages)
    if (!isFriendshipLayer && !isMyPagesLayer) {
      // Apply Quick Filters for News Layer
      if (quickFilter && quickFilter !== 'all') {
        switch (quickFilter) {
          case 'english':
            // Filter for English language posts (news only)
            whereConditions.push(eq(LANGUAGES.code, 'en'));
            break;
          // Note: 'trending' and 'latest' will be handled in sorting/limiting logic
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

      // News type filter
      if (newsType === 'latest') {
          // Get only latest 10 news
          // This will be handled by limit and sorting
      } else if (newsType === 'priority') {
          whereConditions.push(eq(USER_NEWS_DETAILS.is_high_priority, true));
      } else if (newsType === 'breaking') {
          whereConditions.push(eq(USER_NEWS_DETAILS.is_breaking, true));
      }
    }

    query = query.where(and(...whereConditions));

    // Handle sorting and limiting
    if (!isFriendshipLayer && !isMyPagesLayer && quickFilter && quickFilter !== 'all') {
      switch (quickFilter) {
        case 'trending':
          // Sort by view count in last 24 hours, then by created_at
          query = query
            .orderBy(desc(sql`view_count_24h`), desc(USER_POSTS.created_at))
            .limit(10);
          break;
        case 'latest':
          // Sort by latest created posts
          query = query
            .orderBy(desc(USER_POSTS.created_at))
            .limit(10);
          break;
        default:
          // Default sorting from existing code
          if (sortBy === 'title') {
            query = query.orderBy(sortOrder === 'asc' ? asc(USER_POSTS.title) : desc(USER_POSTS.title));
          } else {
            query = query.orderBy(sortOrder === 'asc' ? asc(USER_POSTS.created_at) : desc(USER_POSTS.created_at));
          }
          
          // Apply regular limit if provided
          if (limit) {
            query = query.limit(parseInt(limit));
          }
          break;
      }
    } else {
        if (sortBy === 'title') {
        query = query.orderBy(sortOrder === 'asc' ? asc(USER_POSTS.title) : desc(USER_POSTS.title));
        } else {
        query = query.orderBy(sortOrder === 'asc' ? asc(USER_POSTS.created_at) : desc(USER_POSTS.created_at));
        }
    
        // Limit (for friendship and my pages layers, this will be applied after specific filtering)
        if (limit && !isFriendshipLayer && !isMyPagesLayer) {
        query = query.limit(parseInt(limit));
        }
    }

    let rawPosts = await query;

    // Handle skill and education filters (requires separate filtering due to many-to-many relationship)
    // Only apply these filters for regular layers (not friendship or my pages)
    if (!isFriendshipLayer && !isMyPagesLayer && (skillIds || educationIds)) {
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

        // Filter rawPosts to only include jobs with matching skills/education
        rawPosts = rawPosts.filter(post => 
          post.post_type !== 'job' || (post.job_id && filteredJobIds.includes(post.job_id))
        );
      }
    }

    // Get all job post IDs to fetch related skills and education (only for regular layers)
    let jobSkills = [];
    let jobEducation = [];
    
    if (!isFriendshipLayer && !isMyPagesLayer) {
      const jobPostIds = rawPosts
        .filter(post => post.post_type === 'job' && post.job_id)
        .map(post => post.job_id);

      // Fetch skills for job posts
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
    }

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
        tags: postTagsMap[post.id] || [],
      };

      // Add status field only for friendship layer (for all post types)
      if (isFriendshipLayer) {
        if (post.is_story) {
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
              source_name: sourceName, // Use the creator name as source
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
          if (isFriendshipLayer) {
            // Use personal event details for friendship layer
            if (post.personal_event_id) {
              basePost.event_details = {
                event_date: post.personal_event_date,
                contact_info: post.personal_contact_info,
                additional_info: post.personal_additional_info,
                is_applied_by_user: !!post.is_applied_by_user,
              };
            }
          } else {
            // Use regular event details for other layers
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

        case 'personal_event':
          // Handle personal_event type (new post type)
          if (post.personal_event_id) {
            basePost.event_details = {
              event_date: post.personal_event_date,
              contact_info: post.personal_contact_info,
              additional_info: post.personal_additional_info,
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
        break;

        case 'general':
        default:
          break;
      }

      return basePost;
    });

    // Fetch categories for this layer
    let categories = [];
    
    if (isFriendshipLayer || isMyPagesLayer) {
      // For friendship layer, fetch all categories from POST_CATEGORY_TEMPLATES
      categories = await db
        .select({
          id: POST_CATEGORY_TEMPLATES.id,
          name: POST_CATEGORY_TEMPLATES.name,
          shape: POST_CATEGORY_TEMPLATES.shape,
          icon_name: POST_CATEGORY_TEMPLATES.icon_name,
          color: POST_CATEGORY_TEMPLATES.color,
          class_name: POST_CATEGORY_TEMPLATES.class_name
        })
        .from(POST_CATEGORY_TEMPLATES);
    } else {
      // For other layers, fetch categories through CATEGORY_LAYER_MAP
      categories = await db
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
        .where(eq(CATEGORY_LAYER_MAP.layer_id, parseInt(layerId)));
    }

    return NextResponse.json({
      posts,
      categories,
      user: isGuest ? {
        isGuest: true,
        sessionId: sessionId,
        role: viewerRole,
      } : {
        id: viewerId,
        role: viewerRole,
      }
    });

  } catch (err) {
    console.error("Layer API Error", err);
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}