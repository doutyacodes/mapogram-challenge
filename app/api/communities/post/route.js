// app/api/community/posts/route.js
import { db } from "@/utils";
import jwt from 'jsonwebtoken';
import {
  COMMUNITY_POSTS,
  COMMUNITY_JOB_DETAILS,
  COMMUNITY_EVENT_DETAILS,
  COMMUNITY_PRODUCT_LAUNCH_DETAILS,
  COMMUNITY_POST_CATEGORIES,
  COMMUNITY_JOB_SKILLS_MAP,
  COMMUNITY_JOB_EDUCATION_MAP,
  COMMUNITY_JOB_EXPERIENCE,
  USER_ENTITIES,
  USER_COMPANIES,
  USER_RESTAURANTS,
  COMMUNITIES,
  COMMUNITY_TYPES,
  USER_COMPLAINT_DETAILS,
  COMPLAINT_DEPARTMENTS,
  DEPARTMENTS,
  DEPARTMENT_ROLE_MAP,
  COMMUNITY_TYPE_ROLES,
  USER_COMMUNITY_FOLLOW,
  COMMUNITY_ROLES,
  COMMUNITY_MEMBERS,
  COMMUNITY_ROLE_CATEGORY_MAP,
  COMMUNITY_POST_ISSUE_DETAILS,
  COMMUNITY_POST_IMAGES
} from "@/utils/schema/community_schema";
import {  
  POST_CATEGORY_TEMPLATES, 
  USERS, 
  USER_PROFILES, 
  SKILLS, 
  EDUCATION_QUALIFICATIONS,
  ROLES,
} from "@/utils/schema/schema";
import { NextResponse } from "next/server";
import { eq, and, gte, lte, inArray, desc, asc, sql, or } from "drizzle-orm";

export async function GET(req) {
  try {
    const url = new URL(req.url);
    const token = req.cookies.get("user_token")?.value;

    if (!token) return NextResponse.json({ message: "Authentication required" }, { status: 401 });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const viewerId = decoded.id;
    const viewerRole = decoded.role;

    const communityId = url.searchParams.get("communityId");
    const selectedRoleId = url.searchParams.get("role"); // For Infrastructure role filtering

    if (!communityId) return NextResponse.json({ posts: [], categories: [] });

    console.log("communityId:", communityId, "viewerId:", viewerId, "selectedRoleId:", selectedRoleId);

    // Get community information including type
    const community = await db
      .select({ 
        id: COMMUNITIES.id,
        community_type_id: COMMUNITIES.community_type_id,
        community_type_name: COMMUNITY_TYPES.name,
      })
      .from(COMMUNITIES)
      .innerJoin(COMMUNITY_TYPES, eq(COMMUNITIES.community_type_id, COMMUNITY_TYPES.id))
      .where(eq(COMMUNITIES.id, parseInt(communityId)))
      .then(res => res[0]);

    if (!community) {
      return NextResponse.json({ message: "Community not found" }, { status: 404 });
    }

    const isInfrastructureCommunity = community.community_type_name === 'Infrastructure';
    const isDistrictCommunity = community.community_type_name === 'District';

    // Handle different community types
    if (isInfrastructureCommunity) {
      return await handleInfrastructureCommunity(community, viewerId, selectedRoleId, url);
    } else {
      return await handleRegularCommunity(community, viewerId, viewerRole, url);
    }

  } catch (err) {
    console.error("Community API Error", err);
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}

// Handle Infrastructure Community (formerly Centers)
async function handleInfrastructureCommunity(community, userId, selectedRoleId, url) {
  try {
    // Get user's community membership and role
    const [membership] = await db
      .select({
        role_id: COMMUNITY_MEMBERS.role_id,
        role_name: COMMUNITY_ROLES.name,
        is_approved: COMMUNITY_MEMBERS.is_approved
      })
      .from(COMMUNITY_MEMBERS)
      .innerJoin(COMMUNITY_ROLES, eq(COMMUNITY_MEMBERS.role_id, COMMUNITY_ROLES.id))
      .where(and(
        eq(COMMUNITY_MEMBERS.community_id, community.id),
        eq(COMMUNITY_MEMBERS.user_id, parseInt(userId))
      ));

    if (!membership || !membership.is_approved) {
      return NextResponse.json({ message: "Access denied" }, { status: 403 });
    }

    console.log("User's ACTUAL role:", membership.role_name);

    // Get all community roles for this infrastructure community
    const communityRoles = await db
      .select({
        id: COMMUNITY_ROLES.id,
        name: COMMUNITY_ROLES.name,
        description: COMMUNITY_ROLES.description,
        is_default: COMMUNITY_ROLES.is_default,
      })
      .from(COMMUNITY_ROLES)
      .where(eq(COMMUNITY_ROLES.community_id, community.id))
      .orderBy(COMMUNITY_ROLES.id);

    // Determine which role to use for FILTERING posts
    let filterRoleId = membership.role_id;
    let filterRoleName = membership.role_name;

    // If admin selected a different role filter, use that for filtering
    if (selectedRoleId && membership.role_name.toLowerCase() === 'admin') {
      const selectedRole = communityRoles.find(role => role.id === parseInt(selectedRoleId));
      if (selectedRole) {
        filterRoleId = selectedRole.id;
        filterRoleName = selectedRole.name;
        console.log(`Admin filtering posts by role: ${selectedRole.name}`);
      }
    } else if (selectedRoleId) {
      console.log(`Non-admin user cannot filter by other roles, using own role: ${membership.role_name}`);
    }

    console.log("Filtering posts for role:", filterRoleName, "ID:", filterRoleId);

    // Get categories available for the FILTER role
    let filterCategories = [];
    
    if (filterRoleName.toLowerCase() === 'member') {
      // For 'member' role, get all categories available for the community
      filterCategories = await db
        .selectDistinct({
          category_id: COMMUNITY_ROLE_CATEGORY_MAP.category_id
        })
        .from(COMMUNITY_ROLE_CATEGORY_MAP)
        .where(eq(COMMUNITY_ROLE_CATEGORY_MAP.community_id, community.id));
    } else {
      // For other roles, get categories specific to the filter role
      filterCategories = await db
        .select({
          category_id: COMMUNITY_ROLE_CATEGORY_MAP.category_id
        })
        .from(COMMUNITY_ROLE_CATEGORY_MAP)
        .where(and(
          eq(COMMUNITY_ROLE_CATEGORY_MAP.community_id, community.id),
          eq(COMMUNITY_ROLE_CATEGORY_MAP.community_role_id, filterRoleId)
        ));
    }

    const categoryIds = filterCategories.map(c => c.category_id);
    console.log("Filter role accessible category IDs:", categoryIds);

    // Build post query conditions
    const postConditions = [
      eq(COMMUNITY_POSTS.community_id, community.id)
    ];

    // Geographic filters if provided
    const north = url.searchParams.get("north");
    const south = url.searchParams.get("south");
    const east = url.searchParams.get("east");
    const west = url.searchParams.get("west");

    if (north && south && east && west) {
      postConditions.push(
        gte(COMMUNITY_POSTS.latitude, parseFloat(south)),
        lte(COMMUNITY_POSTS.latitude, parseFloat(north))
      );

      if (east < west) {
        postConditions.push(
          or(
            gte(COMMUNITY_POSTS.longitude, parseFloat(west)),
            lte(COMMUNITY_POSTS.longitude, parseFloat(east))
          )
        );
      } else {
        postConditions.push(
          gte(COMMUNITY_POSTS.longitude, parseFloat(west)),
          lte(COMMUNITY_POSTS.longitude, parseFloat(east))
        );
      }
    }

    // Get posts created by this user (regardless of category)
    const userCreatedPostIds = await db
      .select({ post_id: COMMUNITY_POSTS.id })
      .from(COMMUNITY_POSTS)
      .where(and(
        eq(COMMUNITY_POSTS.community_id, community.id),
        eq(COMMUNITY_POSTS.created_by, parseInt(userId))
      ));
    const userCreatedIds = userCreatedPostIds.map(p => p.post_id);

    // Build final where condition
    let finalWhereCondition;
    
    if (categoryIds.length > 0) {
      if (userCreatedIds.length > 0) {
        finalWhereCondition = and(
          ...postConditions,
          or(
            inArray(COMMUNITY_POSTS.category_id, categoryIds),
            inArray(COMMUNITY_POSTS.id, userCreatedIds)
          )
        );
      } else {
        finalWhereCondition = and(
          ...postConditions,
          inArray(COMMUNITY_POSTS.category_id, categoryIds)
        );
      }
    } else {
      // If no categories assigned, only show user's own posts
      if (userCreatedIds.length > 0) {
        finalWhereCondition = and(
          ...postConditions,
          inArray(COMMUNITY_POSTS.id, userCreatedIds)
        );
      } else {
        // No posts to show
        return NextResponse.json({ 
          posts: [], 
          categories: [], 
          communityRoles: communityRoles,
          currentRole: membership.role_name,
          filterRole: filterRoleName,
          user: {
            id: userId,
            role: membership.role_name,
            isAdmin: membership.role_name.toLowerCase() === 'admin'
          },
          community: {
            id: community.id,
            type: community.community_type_name,
            type_id: community.community_type_id,
          }
        });
      }
    }

    console.log("Executing main posts query for filter role:", filterRoleName);

    // Fetch all posts with related data for Infrastructure community
    const rawPosts = await db
      .select({
        id: COMMUNITY_POSTS.id,
        title: COMMUNITY_POSTS.title,
        description: COMMUNITY_POSTS.description,
        latitude: COMMUNITY_POSTS.latitude,
        longitude: COMMUNITY_POSTS.longitude,
        created_at: COMMUNITY_POSTS.created_at,
        // post_type: COMMUNITY_POSTS.post_type,
        created_by: COMMUNITY_POSTS.created_by,
        community_id: COMMUNITY_POSTS.community_id,
        is_permanent: COMMUNITY_POSTS.is_permanent,

        category_id: COMMUNITY_POSTS.category_id,
        category_name: POST_CATEGORY_TEMPLATES.name,
        category_icon: POST_CATEGORY_TEMPLATES.icon_name,
        category_color: POST_CATEGORY_TEMPLATES.color,
        category_shape: POST_CATEGORY_TEMPLATES.shape,

        // Issue details (for Infrastructure posts)
        issue_id: COMMUNITY_POST_ISSUE_DETAILS.id,
        issue_status: COMMUNITY_POST_ISSUE_DETAILS.status,
        issue_priority: COMMUNITY_POST_ISSUE_DETAILS.priority,
        issue_building_name: COMMUNITY_POST_ISSUE_DETAILS.building_name,
        issue_block_name: COMMUNITY_POST_ISSUE_DETAILS.block_name,
        issue_floor_number: COMMUNITY_POST_ISSUE_DETAILS.floor_number,
        issue_assigned_to: COMMUNITY_POST_ISSUE_DETAILS.assigned_to_user_id,
        issue_assigned_by: COMMUNITY_POST_ISSUE_DETAILS.assigned_by_user_id,
        issue_self_assigned: COMMUNITY_POST_ISSUE_DETAILS.self_assigned,
        issue_additional_info: COMMUNITY_POST_ISSUE_DETAILS.additional_info,
        issue_user_confirmation_status: COMMUNITY_POST_ISSUE_DETAILS.user_confirmation_status,
        issue_user_confirmed_at: COMMUNITY_POST_ISSUE_DETAILS.user_confirmed_at,

        // Creator details
        creator_name: USERS.name,
        creator_profile_image: USER_PROFILES.profile_pic_url,
        creator_joined_at: USERS.created_at,
        creator_id: USERS.id,

        // Community details
        community_name: COMMUNITIES.name,
      })
      .from(COMMUNITY_POSTS)
      .leftJoin(COMMUNITY_POST_ISSUE_DETAILS, eq(COMMUNITY_POSTS.id, COMMUNITY_POST_ISSUE_DETAILS.post_id))
      .leftJoin(POST_CATEGORY_TEMPLATES, eq(COMMUNITY_POSTS.category_id, POST_CATEGORY_TEMPLATES.id))
      .leftJoin(USERS, eq(COMMUNITY_POSTS.created_by, USERS.id))
      .leftJoin(USER_PROFILES, eq(USER_PROFILES.user_id, USERS.id))
      .leftJoin(COMMUNITIES, eq(COMMUNITY_POSTS.community_id, COMMUNITIES.id))
      .where(finalWhereCondition)
      .orderBy(sql`${COMMUNITY_POSTS.created_at} DESC`);

    console.log(`Posts found for filter role ${filterRoleName}:`, rawPosts.length);

    // Get all post IDs for fetching related data
    const allPostIds = rawPosts.map(post => post.id);

    // Fetch images for all posts
    const postImagesData = allPostIds.length > 0 ? await db
      .select({
        post_id: COMMUNITY_POST_IMAGES.post_id,
        image_url: COMMUNITY_POST_IMAGES.image_url,
        is_primary: COMMUNITY_POST_IMAGES.is_primary,
        display_order: COMMUNITY_POST_IMAGES.display_order,
      })
      .from(COMMUNITY_POST_IMAGES)
      .where(inArray(COMMUNITY_POST_IMAGES.post_id, allPostIds))
      .orderBy(COMMUNITY_POST_IMAGES.display_order)
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

    // Transform posts to final format
    const posts = rawPosts.map(post => {
      const basePost = {
        id: post.id,
        title: post.title,
        description: post.description,
        latitude: post.latitude,
        longitude: post.longitude,
        created_at: post.created_at,
        // post_type: post.post_type,
        is_permanent: post.is_permanent,
        created_by: post.created_by,
        community_id: post.community_id,

        creator_id: post.creator_id,
        creator_joined_at: post.creator_joined_at,
        creator_profile_image: post.creator_profile_image,
        user_name: post.creator_name,
        user_page_role: membership.role_name, // Always use user's ACTUAL role

        category_id: post.category_id,
        category_name: post.category_name,
        category_icon: post.category_icon,
        category_color: post.category_color,
        
        images: postImagesMap[post.id] || [],

        community: {
          name: post.community_name,
        },
      };

      // Add issue details if it's an issue post
      if (post.post_type === 'issue' && post.issue_id) {
        basePost.issue_details = {
          status: post.issue_status,
          priority: post.issue_priority,
          building_name: post.issue_building_name,
          block_name: post.issue_block_name,
          floor_number: post.issue_floor_number,
          assigned_to_user_id: post.issue_assigned_to,
          assigned_by_user_id: post.issue_assigned_by,
          self_assigned: post.issue_self_assigned,
          additional_info: post.issue_additional_info,
          user_confirmation_status: post.issue_user_confirmation_status,
          user_confirmed_at: post.issue_user_confirmed_at,
        };
      }

      return basePost;
    });

    // Fetch all available categories for this community (for the roles bar)
    const allCommunityCategories = await db
      .select({
        id: POST_CATEGORY_TEMPLATES.id,
        name: POST_CATEGORY_TEMPLATES.name,
        shape: POST_CATEGORY_TEMPLATES.shape,
        icon_name: POST_CATEGORY_TEMPLATES.icon_name,
        color: POST_CATEGORY_TEMPLATES.color,
        class_name: POST_CATEGORY_TEMPLATES.class_name,
        label: POST_CATEGORY_TEMPLATES.label,
        description: POST_CATEGORY_TEMPLATES.description,
        post_type: POST_CATEGORY_TEMPLATES.post_type,
      })
      .from(COMMUNITY_ROLE_CATEGORY_MAP)
      .innerJoin(
        POST_CATEGORY_TEMPLATES,
        eq(COMMUNITY_ROLE_CATEGORY_MAP.category_id, POST_CATEGORY_TEMPLATES.id)
      )
      .where(eq(COMMUNITY_ROLE_CATEGORY_MAP.community_id, community.id))
      .groupBy(POST_CATEGORY_TEMPLATES.id);

    return NextResponse.json({
      posts,
      categories: allCommunityCategories,
      communityRoles: communityRoles,
      currentRole: membership.role_name,
      filterRole: filterRoleName,
      user: {
        id: userId,
        role: membership.role_name,
        isAdmin: membership.role_name.toLowerCase() === 'admin'
      },
      community: {
        id: community.id,
        type: community.community_type_name,
        type_id: community.community_type_id,
      },
      meta: {
        is_infrastructure_community: true,
        total_posts: posts.length,
      }
    });

  } catch (err) {
    console.error("Infrastructure Community API Error:", err);
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}

// Handle Regular Communities (existing functionality)
async function handleRegularCommunity(community, viewerId, viewerRole, url) {
  try {
    // Get user's role information
    const userWithRole = await db
      .select({
        user_id: USERS.id,
        role_name: ROLES.name,
        community_role_id: USER_COMMUNITY_FOLLOW.community_role_id,
        community_role_name: COMMUNITY_TYPE_ROLES.role_name,
        is_official: COMMUNITY_TYPE_ROLES.is_official,
      })
      .from(USERS)
      .innerJoin(ROLES, eq(USERS.role_id, ROLES.id))
      .leftJoin(USER_COMMUNITY_FOLLOW, eq(USER_COMMUNITY_FOLLOW.user_id, USERS.id))
      .leftJoin(COMMUNITY_TYPE_ROLES, eq(USER_COMMUNITY_FOLLOW.community_role_id, COMMUNITY_TYPE_ROLES.id))
      .where(
        and(
          eq(USERS.id, viewerId),
          eq(USER_COMMUNITY_FOLLOW.community_id, parseInt(community.id))
        )
      )
      .then(res => res[0]);

    const isDistrictCommunity = community.community_type_name === 'District';
    const isOfficialUser = userWithRole?.role_name === 'official_user';
    
    const whereConditions = [eq(COMMUNITY_POSTS.community_id, parseInt(community.id))];

    // Filter parameters
    const jobType = url.searchParams.get("jobType");
    const locationType = url.searchParams.get("locationType");
    const isPaid = url.searchParams.get("isPaid");
    const skillIds = url.searchParams.get("skillIds");
    const educationIds = url.searchParams.get("educationIds");
    const minExperience = url.searchParams.get("minExperience");
    const maxExperience = url.searchParams.get("maxExperience");
    const applicationDeadline = url.searchParams.get("applicationDeadline");
    
    // Common filters
    const sortBy = url.searchParams.get("sortBy") || "created_at";
    const sortOrder = url.searchParams.get("sortOrder") || "desc";
    const limit = url.searchParams.get("limit");
    const postType = url.searchParams.get("postType");
    
    // Quick Action Filters
    const quickFilter = url.searchParams.get("quickFilter");

    let query = db
      .select({
        id: COMMUNITY_POSTS.id,
        title: COMMUNITY_POSTS.title,
        description: COMMUNITY_POSTS.description,
        image_url: COMMUNITY_POSTS.image_url,
        latitude: COMMUNITY_POSTS.latitude,
        longitude: COMMUNITY_POSTS.longitude,
        created_at: COMMUNITY_POSTS.created_at,
        delete_after_hours: COMMUNITY_POSTS.delete_after_hours,
        is_permanent: COMMUNITY_POSTS.is_permanent,
        created_by: COMMUNITY_POSTS.created_by,
        posted_by_entity_id: COMMUNITY_POSTS.posted_by_entity_id,
        community_id: COMMUNITY_POSTS.community_id,

        category_id: POST_CATEGORY_TEMPLATES.id,
        category_name: POST_CATEGORY_TEMPLATES.name,
        category_icon: POST_CATEGORY_TEMPLATES.icon_name,
        category_color: POST_CATEGORY_TEMPLATES.color,

        // Job details
        job_id: COMMUNITY_JOB_DETAILS.id,
        job_type: COMMUNITY_JOB_DETAILS.job_type,
        job_link: COMMUNITY_JOB_DETAILS.link,
        is_paid: COMMUNITY_JOB_DETAILS.is_paid,
        salary_or_stipend: COMMUNITY_JOB_DETAILS.salary_or_stipend,
        location_type: COMMUNITY_JOB_DETAILS.location_type,
        duration: COMMUNITY_JOB_DETAILS.duration,
        application_deadline: COMMUNITY_JOB_DETAILS.application_deadline,
        job_event_name: COMMUNITY_JOB_DETAILS.event_name,
        job_event_date: COMMUNITY_JOB_DETAILS.event_date,
        job_additional_info: COMMUNITY_JOB_DETAILS.additional_info,

        // Experience details
        min_years: COMMUNITY_JOB_EXPERIENCE.min_years,
        max_years: COMMUNITY_JOB_EXPERIENCE.max_years,

        // Event details
        event_id: COMMUNITY_EVENT_DETAILS.id,
        event_type: COMMUNITY_EVENT_DETAILS.event_type,
        event_name: COMMUNITY_EVENT_DETAILS.event_name,
        event_date: COMMUNITY_EVENT_DETAILS.event_date,
        event_link: COMMUNITY_EVENT_DETAILS.link,
        event_additional_info: COMMUNITY_EVENT_DETAILS.additional_info,

        // Product Launch details
        product_id: COMMUNITY_PRODUCT_LAUNCH_DETAILS.id,
        product_name: COMMUNITY_PRODUCT_LAUNCH_DETAILS.product_name,
        launch_date: COMMUNITY_PRODUCT_LAUNCH_DETAILS.launch_date,
        product_link: COMMUNITY_PRODUCT_LAUNCH_DETAILS.link,
        product_additional_info: COMMUNITY_PRODUCT_LAUNCH_DETAILS.additional_info,

        // Complaint details (for district communities)
        complaint_id: USER_COMPLAINT_DETAILS.id,
        location_description: USER_COMPLAINT_DETAILS.location_description,
        severity: USER_COMPLAINT_DETAILS.severity,
        status: USER_COMPLAINT_DETAILS.status,
        complaint_updated_at: USER_COMPLAINT_DETAILS.updated_at,

        // Entity details (for determining who posted)
        entity_type: USER_ENTITIES.type,
        entity_reference_id: USER_ENTITIES.reference_id,

        // User details (fallback if no entity)
        user_name: USERS.name,
        user_profile_image: USER_PROFILES.profile_pic_url,
        user_joined_at: USERS.created_at,
        
        like_count: sql`(
          SELECT COUNT(*) FROM community_post_likes
          WHERE community_post_likes.post_id = ${COMMUNITY_POSTS.id}
        )`.as("like_count"),

        is_liked_by_user: sql`EXISTS (
          SELECT 1 FROM community_post_likes
          WHERE community_post_likes.post_id = ${COMMUNITY_POSTS.id}
          AND community_post_likes.user_id = ${viewerId}
        )`.as("is_liked_by_user"),
      })
      .from(COMMUNITY_POSTS)
      .leftJoin(COMMUNITY_JOB_DETAILS, eq(COMMUNITY_POSTS.id, COMMUNITY_JOB_DETAILS.post_id))
      .leftJoin(COMMUNITY_JOB_EXPERIENCE, eq(COMMUNITY_JOB_DETAILS.id, COMMUNITY_JOB_EXPERIENCE.job_id))
      .leftJoin(COMMUNITY_EVENT_DETAILS, eq(COMMUNITY_POSTS.id, COMMUNITY_EVENT_DETAILS.post_id))
      .leftJoin(COMMUNITY_PRODUCT_LAUNCH_DETAILS, eq(COMMUNITY_POSTS.id, COMMUNITY_PRODUCT_LAUNCH_DETAILS.post_id))
      .leftJoin(USER_COMPLAINT_DETAILS, eq(COMMUNITY_POSTS.id, USER_COMPLAINT_DETAILS.post_id))
      .leftJoin(COMMUNITY_POST_CATEGORIES, eq(COMMUNITY_POSTS.category_id, COMMUNITY_POST_CATEGORIES.id))
      .leftJoin(POST_CATEGORY_TEMPLATES, eq(COMMUNITY_POST_CATEGORIES.post_category_template_id, POST_CATEGORY_TEMPLATES.id))
      .leftJoin(USER_ENTITIES, eq(COMMUNITY_POSTS.posted_by_entity_id, USER_ENTITIES.id))
      .leftJoin(USERS, eq(COMMUNITY_POSTS.created_by, USERS.id))
      .leftJoin(USER_PROFILES, eq(USER_PROFILES.user_id, USERS.id));

    // Get official user's department IDs for permission checking
    let officialUserDepartmentIds = [];
    if (isDistrictCommunity && isOfficialUser && userWithRole?.community_role_id) {
      const officialDepartments = await db
        .select({ department_id: DEPARTMENT_ROLE_MAP.department_id })
        .from(DEPARTMENT_ROLE_MAP)
        .where(eq(DEPARTMENT_ROLE_MAP.community_role_id, userWithRole.community_role_id));

      officialUserDepartmentIds = officialDepartments.map(d => d.department_id);
    }

    // Handle role-based filtering for official users in district communities
    if (isDistrictCommunity && isOfficialUser && quickFilter === "assigned" && officialUserDepartmentIds.length > 0) {
      const assignedComplaintPostIds = await db
        .select({ post_id: USER_COMPLAINT_DETAILS.post_id })
        .from(USER_COMPLAINT_DETAILS)
        .innerJoin(COMPLAINT_DEPARTMENTS, eq(USER_COMPLAINT_DETAILS.id, COMPLAINT_DEPARTMENTS.complaint_id))
        .where(inArray(COMPLAINT_DEPARTMENTS.department_id, officialUserDepartmentIds));

      const postIds = assignedComplaintPostIds.map(p => p.post_id);
      
      if (postIds.length > 0) {
        whereConditions.push(inArray(COMMUNITY_POSTS.id, postIds));
      } else {
        whereConditions.push(eq(COMMUNITY_POSTS.id, -1));
      }
    } else if (isDistrictCommunity && isOfficialUser && quickFilter === "assigned") {
      whereConditions.push(eq(COMMUNITY_POSTS.id, -1));
    }

    // Post type filter
    if (postType && postType !== 'all') {
      switch (postType) {
        case 'job':
          whereConditions.push(sql`${COMMUNITY_JOB_DETAILS.id} IS NOT NULL`);
          break;
        case 'event':
          whereConditions.push(sql`${COMMUNITY_EVENT_DETAILS.id} IS NOT NULL`);
          break;
        case 'product':
          whereConditions.push(sql`${COMMUNITY_PRODUCT_LAUNCH_DETAILS.id} IS NOT NULL`);
          break;
        case 'city':
          if (isDistrictCommunity) {
            whereConditions.push(sql`${USER_COMPLAINT_DETAILS.id} IS NOT NULL`);
          }
          break;
        case 'general':
          whereConditions.push(
            and(
              sql`${COMMUNITY_JOB_DETAILS.id} IS NULL`,
              sql`${COMMUNITY_EVENT_DETAILS.id} IS NULL`,
              sql`${COMMUNITY_PRODUCT_LAUNCH_DETAILS.id} IS NULL`,
              isDistrictCommunity ? sql`${USER_COMPLAINT_DETAILS.id} IS NULL` : sql`1=1`
            )
          );
          break;
      }
    }

    // Job-specific filters
    if (jobType && jobType !== 'all') {
      whereConditions.push(eq(COMMUNITY_JOB_DETAILS.job_type, jobType));
    }

    if (locationType && locationType !== 'all') {
      whereConditions.push(eq(COMMUNITY_JOB_DETAILS.location_type, locationType));
    }

    if (isPaid === 'true') {
      whereConditions.push(eq(COMMUNITY_JOB_DETAILS.is_paid, true));
    } else if (isPaid === 'false') {
      whereConditions.push(eq(COMMUNITY_JOB_DETAILS.is_paid, false));
    }

    if (minExperience || maxExperience) {
      if (minExperience) {
        whereConditions.push(gte(COMMUNITY_JOB_EXPERIENCE.min_years, parseInt(minExperience)));
      }
      if (maxExperience) {
        whereConditions.push(lte(COMMUNITY_JOB_EXPERIENCE.max_years, parseInt(maxExperience)));
      }
    }

    if (applicationDeadline) {
      whereConditions.push(gte(COMMUNITY_JOB_DETAILS.application_deadline, applicationDeadline));
    }

    query = query.where(and(...whereConditions));

    // Handle Quick Filter Sorting and Limiting
    if (quickFilter && quickFilter !== 'all') {
      switch (quickFilter) {
        case 'latest':
          query = query
            .orderBy(desc(COMMUNITY_POSTS.created_at))
            .limit(10);
          break;
        case 'jobs':
          whereConditions.push(sql`${COMMUNITY_JOB_DETAILS.id} IS NOT NULL`);
          query = query
            .orderBy(desc(COMMUNITY_POSTS.created_at))
            .limit(10);
          break;
        case 'events':
          whereConditions.push(sql`${COMMUNITY_EVENT_DETAILS.id} IS NOT NULL`);
          query = query
            .orderBy(desc(COMMUNITY_POSTS.created_at))
            .limit(10);
          break;
        case 'assigned':
          if (isDistrictCommunity) {
            whereConditions.push(sql`${USER_COMPLAINT_DETAILS.id} IS NOT NULL`);
            query = query
              .orderBy(desc(COMMUNITY_POSTS.created_at))
              .limit(10);
          }
          break;
        default:
          if (sortBy === 'title') {
            query = query.orderBy(sortOrder === 'asc' ? asc(COMMUNITY_POSTS.title) : desc(COMMUNITY_POSTS.title));
          } else {
            query = query.orderBy(sortOrder === 'asc' ? asc(COMMUNITY_POSTS.created_at) : desc(COMMUNITY_POSTS.created_at));
          }
          
          if (limit) {
            query = query.limit(parseInt(limit));
          }
          break;
      }
    } else {
      if (sortBy === 'title') {
        query = query.orderBy(sortOrder === 'asc' ? asc(COMMUNITY_POSTS.title) : desc(COMMUNITY_POSTS.title));
      } else {
        query = query.orderBy(sortOrder === 'asc' ? asc(COMMUNITY_POSTS.created_at) : desc(COMMUNITY_POSTS.created_at));
      }

      if (limit) {
        query = query.limit(parseInt(limit));
      }
    }

    let rawPosts = await query;

    // Handle skill and education filters
    if (skillIds || educationIds) {
      const jobPostIds = rawPosts
        .filter(post => post.job_id)
        .map(post => post.job_id);

      if (jobPostIds.length > 0) {
        let filteredJobIds = [...jobPostIds];

        if (skillIds) {
          const skillIdArray = skillIds.split(',').map(id => parseInt(id));
          const jobsWithSkills = await db
            .select({ job_id: COMMUNITY_JOB_SKILLS_MAP.job_id })
            .from(COMMUNITY_JOB_SKILLS_MAP)
            .where(
              and(
                inArray(COMMUNITY_JOB_SKILLS_MAP.job_id, jobPostIds),
                inArray(COMMUNITY_JOB_SKILLS_MAP.skill_id, skillIdArray)
              )
            )
            .groupBy(COMMUNITY_JOB_SKILLS_MAP.job_id)
            .having(sql`COUNT(DISTINCT ${COMMUNITY_JOB_SKILLS_MAP.skill_id}) >= ${skillIdArray.length}`);

          filteredJobIds = jobsWithSkills.map(j => j.job_id);
        }

        if (educationIds) {
          const educationIdArray = educationIds.split(',').map(id => parseInt(id));
          const jobsWithEducation = await db
            .select({ job_id: COMMUNITY_JOB_EDUCATION_MAP.job_id })
            .from(COMMUNITY_JOB_EDUCATION_MAP)
            .where(
              and(
                inArray(COMMUNITY_JOB_EDUCATION_MAP.job_id, filteredJobIds),
                inArray(COMMUNITY_JOB_EDUCATION_MAP.education_id, educationIdArray)
              )
            );

          filteredJobIds = jobsWithEducation.map(j => j.job_id);
        }

        rawPosts = rawPosts.filter(post => 
          !post.job_id || filteredJobIds.includes(post.job_id)
        );
      }
    }

    // Get all job post IDs to fetch related skills and education
    const jobPostIds = rawPosts
      .filter(post => post.job_id)
      .map(post => post.job_id);

    let jobSkills = [];
    if (jobPostIds.length > 0) {
      jobSkills = await db
        .select({
          job_id: COMMUNITY_JOB_SKILLS_MAP.job_id,
          skill_id: SKILLS.id,
          skill_name: SKILLS.name,
        })
        .from(COMMUNITY_JOB_SKILLS_MAP)
        .innerJoin(SKILLS, eq(COMMUNITY_JOB_SKILLS_MAP.skill_id, SKILLS.id))
        .where(inArray(COMMUNITY_JOB_SKILLS_MAP.job_id, jobPostIds));
    }

    let jobEducation = [];
    if (jobPostIds.length > 0) {
      jobEducation = await db
        .select({
          job_id: COMMUNITY_JOB_EDUCATION_MAP.job_id,
          education_id: EDUCATION_QUALIFICATIONS.id,
          education_name: EDUCATION_QUALIFICATIONS.name,
        })
        .from(COMMUNITY_JOB_EDUCATION_MAP)
        .innerJoin(EDUCATION_QUALIFICATIONS, eq(COMMUNITY_JOB_EDUCATION_MAP.education_id, EDUCATION_QUALIFICATIONS.id))
        .where(inArray(COMMUNITY_JOB_EDUCATION_MAP.job_id, jobPostIds));
    }

    // Get complaint departments and check if official user can update status
    let complaintDepartments = [];
    let complaintStatusPermissions = {};
    
    if (isDistrictCommunity) {
      const complaintIds = rawPosts
        .filter(post => post.complaint_id)
        .map(post => post.complaint_id);

      if (complaintIds.length > 0) {
        complaintDepartments = await db
          .select({
            complaint_id: COMPLAINT_DEPARTMENTS.complaint_id,
            department_id: DEPARTMENTS.id,
            department_name: DEPARTMENTS.name,
            department_description: DEPARTMENTS.description,
          })
          .from(COMPLAINT_DEPARTMENTS)
          .innerJoin(DEPARTMENTS, eq(COMPLAINT_DEPARTMENTS.department_id, DEPARTMENTS.id))
          .where(inArray(COMPLAINT_DEPARTMENTS.complaint_id, complaintIds));

        if (isOfficialUser && officialUserDepartmentIds.length > 0) {
          complaintIds.forEach(complaintId => {
            const complaintDepts = complaintDepartments
              .filter(cd => cd.complaint_id === complaintId)
              .map(cd => cd.department_id);
            
            const canUpdate = complaintDepts.some(deptId => 
              officialUserDepartmentIds.includes(deptId)
            );
            
            complaintStatusPermissions[complaintId] = canUpdate;
          });
        }
      }
    }

    // Fetch entity details
    const entityIds = rawPosts
      .filter(post => post.posted_by_entity_id && post.entity_reference_id)
      .map(post => ({ 
        entityId: post.posted_by_entity_id, 
        type: post.entity_type, 
        referenceId: post.entity_reference_id 
      }));

    const companyIds = entityIds.filter(e => e.type === 'company').map(e => e.referenceId);
    const restaurantIds = entityIds.filter(e => e.type === 'restaurant').map(e => e.referenceId);

    let companies = [];
    let restaurants = [];

    if (companyIds.length > 0) {
      companies = await db
        .select({
          id: USER_COMPANIES.id,
          name: USER_COMPANIES.name,
          logo_url: USER_COMPANIES.logo_url,
          description: USER_COMPANIES.description,
          website_url: USER_COMPANIES.website_url,
        })
        .from(USER_COMPANIES)
        .where(inArray(USER_COMPANIES.id, companyIds));
    }

    if (restaurantIds.length > 0) {
      restaurants = await db
        .select({
          id: USER_RESTAURANTS.id,
          name: USER_RESTAURANTS.name,
          image_url: USER_RESTAURANTS.image_url,
          description: USER_RESTAURANTS.description,
          location: USER_RESTAURANTS.location,
        })
        .from(USER_RESTAURANTS)
        .where(inArray(USER_RESTAURANTS.id, restaurantIds));
    }

    // Group data by IDs
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

    const departmentsByComplaintId = complaintDepartments.reduce((acc, item) => {
      if (!acc[item.complaint_id]) acc[item.complaint_id] = [];
      acc[item.complaint_id].push({ 
        id: item.department_id, 
        name: item.department_name,
        description: item.department_description
      });
      return acc;
    }, {});

    const companiesById = companies.reduce((acc, company) => {
      acc[company.id] = company;
      return acc;
    }, {});

    const restaurantsById = restaurants.reduce((acc, restaurant) => {
      acc[restaurant.id] = restaurant;
      return acc;
    }, {});

    const posts = rawPosts.map(post => {
      // Determine post type
      let postType = 'general';
      if (post.job_id) postType = 'job';
      else if (post.event_id) postType = 'event';
      else if (post.product_id) postType = 'product';
      else if (post.complaint_id) postType = 'city';

      // Determine poster details
      let posterInfo = {
        user_name: post.user_name,
        user_profile_image: post.user_profile_image,
        joined_at: post.user_joined_at,
        page_type_name: post.page_type_name || 'User',
      };

      if (post.posted_by_entity_id && post.entity_type && post.entity_reference_id) {
        if (post.entity_type === 'company' && companiesById[post.entity_reference_id]) {
          const company = companiesById[post.entity_reference_id];
          posterInfo = {
            user_name: company.name,
            user_profile_image: company.logo_url,
            joined_at: post.user_joined_at,
            page_type_name: 'Company',
            entity_details: {
              type: 'company',
              description: company.description,
              website_url: company.website_url,
            }
          };
        } else if (post.entity_type === 'restaurant' && restaurantsById[post.entity_reference_id]) {
          const restaurant = restaurantsById[post.entity_reference_id];
          posterInfo = {
            user_name: restaurant.name,
            user_profile_image: restaurant.image_url,
            joined_at: post.user_joined_at,
            page_type_name: 'Restaurant',
            entity_details: {
              type: 'restaurant',
              description: restaurant.description,
              location: restaurant.location,
            }
          };
        }
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
        post_type: postType,
        category_id: post.category_id,
        category_name: post.category_name,
        category_icon: post.category_icon,
        category_color: post.category_color,
        like_count: post.like_count || 0,
        is_liked_by_user: !!post.is_liked_by_user,
        created_by: post.created_by,
        community_id: post.community_id,
        ...posterInfo,
      };

      // Add additional details based on post_type
      switch (postType) {
        case 'job':
          if (post.job_id) {
            basePost.job_details = {
              job_type: post.job_type,
              link: post.job_link,
              is_paid: post.is_paid,
              salary_or_stipend: post.salary_or_stipend,
              location_type: post.location_type,
              duration: post.duration,
              application_deadline: post.application_deadline,
              event_name: post.job_event_name,
              event_date: post.job_event_date,
              additional_info: post.job_additional_info,
              experience: {
                min_years: post.min_years || 0,
                max_years: post.max_years || 0
              },
              skills: skillsByJobId[post.job_id] || [],
              education_qualifications: educationByJobId[post.job_id] || [],
            };
          }
          break;

        case 'event':
          if (post.event_id) {
            basePost.event_details = {
              event_type: post.event_type,
              event_name: post.event_name,
              event_date: post.event_date,
              link: post.event_link,
              additional_info: post.event_additional_info,
            };
          }
          break;

        case 'product':
          if (post.product_id) {
            basePost.product_details = {
              product_name: post.product_name,
              launch_date: post.launch_date,
              link: post.product_link,
              additional_info: post.product_additional_info,
            };
          }
          break;

        case 'city':
          if (post.complaint_id) {
            basePost.complaint_details = {
              id: post.complaint_id,
              location_description: post.location_description,
              severity: post.severity,
              status: post.status,
              updated_at: post.complaint_updated_at,
              departments: departmentsByComplaintId[post.complaint_id] || [],
              can_update_status: isDistrictCommunity && isOfficialUser ? 
                (complaintStatusPermissions[post.complaint_id] || false) : false,
            };
          }
          break;

        case 'general':
        default:
          break;
      }
      return basePost;
    });

    // Fetch categories for this community
    const categories = await db
      .select({
        id: POST_CATEGORY_TEMPLATES.id,
        name: POST_CATEGORY_TEMPLATES.name,
        shape: POST_CATEGORY_TEMPLATES.shape,
        icon_name: POST_CATEGORY_TEMPLATES.icon_name,
        color: POST_CATEGORY_TEMPLATES.color,
        class_name: POST_CATEGORY_TEMPLATES.class_name
      })
      .from(COMMUNITY_POST_CATEGORIES)
      .innerJoin(POST_CATEGORY_TEMPLATES, eq(COMMUNITY_POST_CATEGORIES.post_category_template_id, POST_CATEGORY_TEMPLATES.id))
      .where(eq(COMMUNITY_POST_CATEGORIES.community_type_id, community.community_type_id));

    return NextResponse.json({
      posts,
      categories,
      user: {
        id: viewerId,
        role: userWithRole?.role_name,
        community_role: userWithRole ? {
          id: userWithRole.community_role_id,
          name: userWithRole.community_role_name,
          is_official: userWithRole.is_official,
        } : null,
      },
      community: {
        id: parseInt(community.id),
        type: community.community_type_name,
        type_id: community.community_type_id,
      },
      meta: {
        is_district_community: isDistrictCommunity,
        posts_filter: quickFilter,
        total_posts: posts.length,
      }
    });

  } catch (err) {
    console.error("Regular Community API Error:", err);
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}