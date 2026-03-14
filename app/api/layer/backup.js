

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
  PAGE_TYPES
} from "@/utils/schema/schema";
import { NextResponse } from "next/server";
import { eq, and, gte, lte, or, sql, inArray, desc, asc } from "drizzle-orm";

// export async function GET(req) {
//   try {
//     const url = new URL(req.url);
//     const token = req.cookies.get("user_token")?.value;

//     if (!token) return NextResponse.json({ message: "Authentication required" }, { status: 401 });

//     const decoded = jwt.verify(token, process.env.JWT_SECRET);
//     const viewerId = decoded.id;
//     const viewerRole = decoded.role;

//     const layerId = url.searchParams.get("layerId");
//     if (!layerId) return NextResponse.json({ posts: [], categories: [] });

//     console.log("layerId:", layerId, "viewerId:", viewerId);

//     // Get post IDs that belong to this layer
//     const layerPosts = await db
//       .select({ post_id: POST_LAYER_MAP.post_id })
//       .from(POST_LAYER_MAP)
//       .where(eq(POST_LAYER_MAP.layer_id, parseInt(layerId)));

//     const postIds = layerPosts.map(lp => lp.post_id);
    
//     if (postIds.length === 0) {
//       return NextResponse.json({ posts: [], categories: [] });
//     }

//     const whereConditions = [inArray(USER_POSTS.id, postIds)];

//     const north = url.searchParams.get("north");
//     const south = url.searchParams.get("south");
//     const east = url.searchParams.get("east");
//     const west = url.searchParams.get("west");

//     if (north && south && east && west) {
//       whereConditions.push(
//         gte(USER_POSTS.latitude, parseFloat(south)),
//         lte(USER_POSTS.latitude, parseFloat(north))
//       );

//       if (east < west) {
//         whereConditions.push(
//           or(
//             gte(USER_POSTS.longitude, parseFloat(west)),
//             lte(USER_POSTS.longitude, parseFloat(east))
//           )
//         );
//       } else {
//         whereConditions.push(
//           gte(USER_POSTS.longitude, parseFloat(west)),
//           lte(USER_POSTS.longitude, parseFloat(east))
//         );
//       }
//     }

//     const rawPosts = await db
//       .select({
//         id: USER_POSTS.id,
//         title: USER_POSTS.title,
//         description: USER_POSTS.description,
//         image_url: USER_POSTS.image_url,
//         latitude: USER_POSTS.latitude,
//         longitude: USER_POSTS.longitude,
//         created_at: USER_POSTS.created_at,
//         delete_after_hours: USER_POSTS.delete_after_hours,
//         is_permanent: USER_POSTS.is_permanent,
//         post_type: USER_POSTS.post_type,
//         created_by: USER_POSTS.page_id,

//         category_id: USER_POSTS.category_id,
//         category_name: POST_CATEGORY_TEMPLATES.name,
//         category_icon: POST_CATEGORY_TEMPLATES.icon_name,
//         category_color: POST_CATEGORY_TEMPLATES.color,

//         // Job details (will be null if not a job post)
//         job_id: USER_JOB_DETAILS.id,
//         job_type: USER_JOB_DETAILS.job_type,
//         job_link: USER_JOB_DETAILS.link,
//         is_paid: USER_JOB_DETAILS.is_paid,
//         salary_or_stipend: USER_JOB_DETAILS.salary_or_stipend,
//         location_type: USER_JOB_DETAILS.location_type,
//         duration: USER_JOB_DETAILS.duration,
//         application_deadline: USER_JOB_DETAILS.application_deadline,
//         event_name: USER_JOB_DETAILS.event_name,
//         event_date: USER_JOB_DETAILS.event_date,
//         additional_info: USER_JOB_DETAILS.additional_info,

//         // Experience details
//         min_years: JOB_EXPERIENCE.min_years,
//         max_years: JOB_EXPERIENCE.max_years,

//         // News details (will be null if not a news post)
//         source_name: USERS.name,
//         user_profile_image: USER_PROFILES.profile_pic_url,
//         joined_at: USERS.created_at,

//         article_url: USER_NEWS_DETAILS.article_url,
//         summary: USER_NEWS_DETAILS.summary,
//         language_id: USER_NEWS_DETAILS.language_id,
//         is_high_priority: USER_NEWS_DETAILS.is_high_priority,
//         is_breaking: USER_NEWS_DETAILS.is_breaking,
//         breaking_expire_at: USER_NEWS_DETAILS.breaking_expire_at,
//         like_count: sql`(
//           SELECT COUNT(*) FROM user_post_likes
//           WHERE user_post_likes.post_id = ${USER_POSTS.id}
//         )`.as("like_count"),

//         is_liked_by_user: sql`EXISTS (
//           SELECT 1 FROM user_post_likes
//           WHERE user_post_likes.post_id = ${USER_POSTS.id}
//           AND user_post_likes.user_id = ${viewerId}
//         )`.as("is_liked_by_user"),

//         is_applied_by_user: sql`EXISTS (
//           SELECT 1 FROM ${USER_POST_REGISTRATIONS}
//           WHERE ${USER_POST_REGISTRATIONS.post_id} = ${USER_POSTS.id}
//           AND ${USER_POST_REGISTRATIONS.user_id} = ${viewerId}
//         )`.as("is_applied_by_user"),
//       })
//       .from(USER_POSTS)
//       .leftJoin(USER_JOB_DETAILS, eq(USER_POSTS.id, USER_JOB_DETAILS.post_id))
//       .leftJoin(JOB_EXPERIENCE, eq(USER_JOB_DETAILS.id, JOB_EXPERIENCE.job_id))
//       .leftJoin(USER_NEWS_DETAILS, eq(USER_POSTS.id, USER_NEWS_DETAILS.post_id))
//       .leftJoin(POST_CATEGORY_TEMPLATES, eq(USER_POSTS.category_id, POST_CATEGORY_TEMPLATES.id))
//       .leftJoin(USERS, eq(USER_POSTS.page_id, USERS.id))
//       .leftJoin(USER_PROFILES, eq(USER_PROFILES.user_id, USERS.id))
//       .where(and(...whereConditions))
//       .orderBy(sql`${USER_POSTS.created_at} DESC`);

//     // Get all job post IDs to fetch related skills and education
//     const jobPostIds = rawPosts
//       .filter(post => post.post_type === 'job' && post.job_id)
//       .map(post => post.job_id);

//     // Fetch skills for job posts
//     let jobSkills = [];
//     if (jobPostIds.length > 0) {
//       jobSkills = await db
//         .select({
//           job_id: JOB_SKILLS_MAP.job_id,
//           skill_id: SKILLS.id,
//           skill_name: SKILLS.name,
//         })
//         .from(JOB_SKILLS_MAP)
//         .innerJoin(SKILLS, eq(JOB_SKILLS_MAP.skill_id, SKILLS.id))
//         .where(inArray(JOB_SKILLS_MAP.job_id, jobPostIds));
//     }

//     // Fetch education for job posts
//     let jobEducation = [];
//     if (jobPostIds.length > 0) {
//       jobEducation = await db
//         .select({
//           job_id: JOB_EDUCATION_MAP.job_id,
//           education_id: EDUCATION_QUALIFICATIONS.id,
//           education_name: EDUCATION_QUALIFICATIONS.name,
//         })
//         .from(JOB_EDUCATION_MAP)
//         .innerJoin(EDUCATION_QUALIFICATIONS, eq(JOB_EDUCATION_MAP.education_id, EDUCATION_QUALIFICATIONS.id))
//         .where(inArray(JOB_EDUCATION_MAP.job_id, jobPostIds));
//     }

//     // Group skills and education by job_id
//     const skillsByJobId = jobSkills.reduce((acc, item) => {
//       if (!acc[item.job_id]) acc[item.job_id] = [];
//       acc[item.job_id].push({ id: item.skill_id, name: item.skill_name });
//       return acc;
//     }, {});

//     const educationByJobId = jobEducation.reduce((acc, item) => {
//       if (!acc[item.job_id]) acc[item.job_id] = [];
//       acc[item.job_id].push({ id: item.education_id, name: item.education_name });
//       return acc;
//     }, {});

//     const posts = rawPosts.map(post => {
//       const basePost = {
//         id: post.id,
//         title: post.title,
//         description: post.description,
//         image_url: post.image_url,
//         latitude: post.latitude,
//         longitude: post.longitude,
//         created_at: post.created_at,
//         delete_after_hours: post.delete_after_hours,
//         is_permanent: post.is_permanent,
//         post_type: post.post_type,
//         category_id: post.category_id,
//         category_name: post.category_name,
//         category_icon: post.category_icon,
//         category_color: post.category_color,
//         like_count: post.like_count || 0,
//         is_liked_by_user: !!post.is_liked_by_user,
//         user_profile_image: post.user_profile_image,
//         user_name: post.source_name,
//         joined_at: post.joined_at,
//         created_by: post.created_by,
//       };

//       // Add additional details based on post_type
//       switch (post.post_type) {
//         case 'job':
//           if (post.job_type || post.job_link || post.is_paid !== null) {
//             basePost.job_details = {
//               job_type: post.job_type,
//               link: post.job_link,
//               is_paid: post.is_paid,
//               salary_or_stipend: post.salary_or_stipend,
//               location_type: post.location_type,
//               duration: post.duration,
//               application_deadline: post.application_deadline,
//               event_name: post.event_name,
//               event_date: post.event_date,
//               additional_info: post.additional_info,
//               // New structured data
//               experience: {
//                 min_years: post.min_years || 0,
//                 max_years: post.max_years || 0
//               },
//               skills: skillsByJobId[post.job_id] || [],
//               education_qualifications: educationByJobId[post.job_id] || [],
//               is_applied_by_user: !!post.is_applied_by_user,
//             };
//           }
//           break;

//         case 'news':
//           if (post.article_url || post.summary || post.is_high_priority !== null) {
//             basePost.news_details = {
//               source_name: post.source_name,
//               article_url: post.article_url,
//               summary: post.summary,
//               language_id: post.language_id,
//               is_high_priority: post.is_high_priority,
//               is_breaking: post.is_breaking,
//               breaking_expire_at: post.breaking_expire_at,
//             };
//           }
//           break;

//         case 'event':
//           // For now, no additional details for events (as you mentioned)
//           // When you add USER_EVENT_DETAILS table later, you can add it here
//           break;

//         case 'general':
//         default:
//           // No additional details for general posts
//           break;
//       }

//       return basePost;
//     });

//     // Fetch categories for this layer
//     const categories = await db
//       .select({
//         id: POST_CATEGORY_TEMPLATES.id,
//         name: POST_CATEGORY_TEMPLATES.name,
//         shape: POST_CATEGORY_TEMPLATES.shape,
//         icon_name: POST_CATEGORY_TEMPLATES.icon_name,
//         color: POST_CATEGORY_TEMPLATES.color,
//         class_name: POST_CATEGORY_TEMPLATES.class_name
//       })
//       .from(CATEGORY_LAYER_MAP)
//       .innerJoin(POST_CATEGORY_TEMPLATES, eq(CATEGORY_LAYER_MAP.category_id, POST_CATEGORY_TEMPLATES.id))
//       .where(eq(CATEGORY_LAYER_MAP.layer_id, parseInt(layerId)));

//     return NextResponse.json({
//       posts,
//       categories,
//       user: {
//         id: viewerId,
//         role: viewerRole,
//       }
//     });

//   } catch (err) {
//     console.error("Layer API Error", err);
//     return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
//   }
// }

export async function GET(req) {
  try {
    const url = new URL(req.url);
    const token = req.cookies.get("user_token")?.value;

    if (!token) return NextResponse.json({ message: "Authentication required" }, { status: 401 });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const viewerId = decoded.id;
    const viewerRole = decoded.role;

    const layerId = url.searchParams.get("layerId");
    if (!layerId) return NextResponse.json({ posts: [], categories: [] });

    console.log("layerId:", layerId, "viewerId:", viewerId);

    // Get post IDs that belong to this layer
    const layerPosts = await db
      .select({ post_id: POST_LAYER_MAP.post_id })
      .from(POST_LAYER_MAP)
      .where(eq(POST_LAYER_MAP.layer_id, parseInt(layerId)));

    const postIds = layerPosts.map(lp => lp.post_id);
    
    if (postIds.length === 0) {
      return NextResponse.json({ posts: [], categories: [] });
    }

    const whereConditions = [inArray(USER_POSTS.id, postIds)];

    // Geographic bounds filtering
    const north = url.searchParams.get("north");
    const south = url.searchParams.get("south");
    const east = url.searchParams.get("east");
    const west = url.searchParams.get("west");

    if (north && south && east && west) {
      whereConditions.push(
        gte(USER_POSTS.latitude, parseFloat(south)),
        lte(USER_POSTS.latitude, parseFloat(north))
      );

      if (east < west) {
        whereConditions.push(
          or(
            gte(USER_POSTS.longitude, parseFloat(west)),
            lte(USER_POSTS.longitude, parseFloat(east))
          )
        );
      } else {
        whereConditions.push(
          gte(USER_POSTS.longitude, parseFloat(west)),
          lte(USER_POSTS.longitude, parseFloat(east))
        );
      }
    }

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
    const newsType = url.searchParams.get("newsType"); // latest, priority, breaking, all
    
    // Common filters
    const sortBy = url.searchParams.get("sortBy") || "created_at"; // created_at, title
    const sortOrder = url.searchParams.get("sortOrder") || "desc"; // asc, desc
    const limit = url.searchParams.get("limit");

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
      })
      .from(USER_POSTS)
      .leftJoin(USER_JOB_DETAILS, eq(USER_POSTS.id, USER_JOB_DETAILS.post_id))
      .leftJoin(JOB_EXPERIENCE, eq(USER_JOB_DETAILS.id, JOB_EXPERIENCE.job_id))
      .leftJoin(USER_NEWS_DETAILS, eq(USER_POSTS.id, USER_NEWS_DETAILS.post_id))
      .leftJoin(LANGUAGES, eq(USER_NEWS_DETAILS.language_id, LANGUAGES.id))
      .leftJoin(POST_CATEGORY_TEMPLATES, eq(USER_POSTS.category_id, POST_CATEGORY_TEMPLATES.id))
      .leftJoin(USERS, eq(USER_POSTS.page_id, USERS.id))
      .leftJoin(USER_PROFILES, eq(USER_PROFILES.user_id, USERS.id))
      .leftJoin(PAGE_TYPES, eq(USERS.page_type_id, PAGE_TYPES.id));


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

    query = query.where(and(...whereConditions));

    // Sorting
    if (sortBy === 'title') {
      query = query.orderBy(sortOrder === 'asc' ? asc(USER_POSTS.title) : desc(USER_POSTS.title));
    } else {
      query = query.orderBy(sortOrder === 'asc' ? asc(USER_POSTS.created_at) : desc(USER_POSTS.created_at));
    }

    // Limit
    if (limit) {
      query = query.limit(parseInt(limit));
    }

    let rawPosts = await query;

    // Handle skill and education filters (requires separate filtering due to many-to-many relationship)
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

        // Filter rawPosts to only include jobs with matching skills/education
        rawPosts = rawPosts.filter(post => 
          post.post_type !== 'job' || (post.job_id && filteredJobIds.includes(post.job_id))
        );
      }
    }

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
          break;

        case 'general':
        default:
          break;
      }

      return basePost;
    });

    // Fetch categories for this layer
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
      .where(eq(CATEGORY_LAYER_MAP.layer_id, parseInt(layerId)));

    return NextResponse.json({
      posts,
      categories,
      user: {
        id: viewerId,
        role: viewerRole,
      }
    });

  } catch (err) {
    console.error("Layer API Error", err);
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}