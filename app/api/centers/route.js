import { db } from "@/utils";
import jwt from 'jsonwebtoken';
import {
  USER_POSTS,
  USERS,
  USER_PROFILES,
  PAGES,
  PAGE_PROFILES,
  POST_CATEGORY_TEMPLATES,
  PAGE_MEMBERS,
  PAGE_ROLES,
  PAGE_ROLE_CATEGORY_MAP,
  POST_IMAGES,
} from "@/utils/schema/schema";

import { USER_POST_ISSUE_DETAILS } from "@/utils/schema/centers_schema";

import { NextResponse } from "next/server";
import { eq, and, gte, lte, or, sql, inArray } from "drizzle-orm";

export async function GET(req) {
  try {
    const url = new URL(req.url);
    const token = req.cookies.get("user_token")?.value;

    if (!token) {
      return NextResponse.json({ message: "Authentication required" }, { status: 401 });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.id;

    const pageId = url.searchParams.get("pageId");
    const selectedRoleId = url.searchParams.get("role"); // Filter parameter, not user's role!

    if (!pageId) {
      return NextResponse.json({ posts: [], categories: [], pageRoles: [] });
    }

    // Get page details
    const [pageData] = await db
      .select()
      .from(PAGES)
      .where(eq(PAGES.id, parseInt(pageId)));

    if (!pageData) {
      return NextResponse.json({ message: "Page not found" }, { status: 404 });
    }

    // Get user's ACTUAL page membership and role (this never changes)
    const [membership] = await db
      .select({
        role_id: PAGE_MEMBERS.role_id,
        role_name: PAGE_ROLES.name,
        is_approved: PAGE_MEMBERS.is_approved
      })
      .from(PAGE_MEMBERS)
      .innerJoin(PAGE_ROLES, eq(PAGE_MEMBERS.role_id, PAGE_ROLES.id))
      .where(and(
        eq(PAGE_MEMBERS.page_id, parseInt(pageId)),
        eq(PAGE_MEMBERS.user_id, parseInt(userId))
      ));

    if (!membership || !membership.is_approved) {
      return NextResponse.json({ message: "Access denied" }, { status: 403 });
    }

    console.log("User's ACTUAL role:", membership.role_name);

    // Get all page roles for this page
    const pageRoles = await db
      .select({
        id: PAGE_ROLES.id,
        name: PAGE_ROLES.name,
        description: PAGE_ROLES.description,
        is_default: PAGE_ROLES.is_default,
      })
      .from(PAGE_ROLES)
      .where(eq(PAGE_ROLES.page_id, parseInt(pageId)))
      .orderBy(PAGE_ROLES.id);

    // Determine which role to use for FILTERING posts (not changing user's role!)
    let filterRoleId = membership.role_id; // Default: filter by user's own role
    let filterRoleName = membership.role_name;

    // If admin selected a different role filter, use that for filtering
    if (selectedRoleId && membership.role_name.toLowerCase() === 'admin') {
      const selectedRole = pageRoles.find(role => role.id === parseInt(selectedRoleId));
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
      // For 'member' role, get all categories available for the page
      filterCategories = await db
        .selectDistinct({
          category_id: PAGE_ROLE_CATEGORY_MAP.category_id
        })
        .from(PAGE_ROLE_CATEGORY_MAP)
        .where(eq(PAGE_ROLE_CATEGORY_MAP.page_id, parseInt(pageId)));
    } else {
      // For other roles, get categories specific to the filter role
      filterCategories = await db
        .select({
          category_id: PAGE_ROLE_CATEGORY_MAP.category_id
        })
        .from(PAGE_ROLE_CATEGORY_MAP)
        .where(and(
          eq(PAGE_ROLE_CATEGORY_MAP.page_id, parseInt(pageId)),
          eq(PAGE_ROLE_CATEGORY_MAP.page_role_id, filterRoleId)
        ));
    }

    const categoryIds = filterCategories.map(c => c.category_id);
    console.log("Filter role accessible category IDs:", categoryIds);

    // Build post query conditions
    const postConditions = [
      eq(USER_POSTS.page_id, parseInt(pageId))
    ];

    // Geographic filters if provided
    const north = url.searchParams.get("north");
    const south = url.searchParams.get("south");
    const east = url.searchParams.get("east");
    const west = url.searchParams.get("west");

    if (north && south && east && west) {
      postConditions.push(
        gte(USER_POSTS.latitude, parseFloat(south)),
        lte(USER_POSTS.latitude, parseFloat(north))
      );

      if (east < west) {
        postConditions.push(
          or(
            gte(USER_POSTS.longitude, parseFloat(west)),
            lte(USER_POSTS.longitude, parseFloat(east))
          )
        );
      } else {
        postConditions.push(
          gte(USER_POSTS.longitude, parseFloat(west)),
          lte(USER_POSTS.longitude, parseFloat(east))
        );
      }
    }

    // Get posts created by this user (regardless of category)
    const userCreatedPostIds = await db
      .select({ post_id: USER_POSTS.id })
      .from(USER_POSTS)
      .where(and(
        eq(USER_POSTS.page_id, parseInt(pageId)),
        eq(USER_POSTS.creator_type, 'user'),
        eq(USER_POSTS.creator_id, parseInt(userId))
      ));
    const userCreatedIds = userCreatedPostIds.map(p => p.post_id);

    // Build final where condition
    // Include posts that match filter role's categories OR posts created by the user
    let finalWhereCondition;
    
    if (categoryIds.length > 0) {
      if (userCreatedIds.length > 0) {
        finalWhereCondition = and(
          ...postConditions,
          or(
            inArray(USER_POSTS.category_id, categoryIds),
            inArray(USER_POSTS.id, userCreatedIds)
          )
        );
      } else {
        finalWhereCondition = and(
          ...postConditions,
          inArray(USER_POSTS.category_id, categoryIds)
        );
      }
    } else {
      // If no categories assigned, only show user's own posts
      if (userCreatedIds.length > 0) {
        finalWhereCondition = and(
          ...postConditions,
          inArray(USER_POSTS.id, userCreatedIds)
        );
      } else {
        // No posts to show
        return NextResponse.json({ 
          posts: [], 
          categories: [], 
          pageRoles: pageRoles,
          currentRole: membership.role_name, // User's ACTUAL role
          filterRole: filterRoleName, // Currently applied filter
          user: {
            id: userId,
            role: membership.role_name,
            isAdmin: membership.role_name.toLowerCase() === 'admin'
          }
        });
      }
    }

    console.log("Executing main posts query for filter role:", filterRoleName);

    // Fetch all posts with related data
    const rawPosts = await db
      .select({
        id: USER_POSTS.id,
        title: USER_POSTS.title,
        description: USER_POSTS.description,
        latitude: USER_POSTS.latitude,
        longitude: USER_POSTS.longitude,
        created_at: USER_POSTS.created_at,
        post_type: USER_POSTS.post_type,
        creator_type: USER_POSTS.creator_type,
        user_id: USER_POSTS.creator_id,
        page_id: USER_POSTS.page_id,
        is_permanent: USER_POSTS.is_permanent,

        category_id: USER_POSTS.category_id,
        category_name: POST_CATEGORY_TEMPLATES.name,
        category_icon: POST_CATEGORY_TEMPLATES.icon_name,
        category_color: POST_CATEGORY_TEMPLATES.color,
        category_shape: POST_CATEGORY_TEMPLATES.shape,

        // Issue details (null if not an issue post)
        issue_id: USER_POST_ISSUE_DETAILS.id,
        issue_status: USER_POST_ISSUE_DETAILS.status,
        issue_priority: USER_POST_ISSUE_DETAILS.priority,
        issue_building_name: USER_POST_ISSUE_DETAILS.building_name,
        issue_block_name: USER_POST_ISSUE_DETAILS.block_name,
        issue_floor_number: USER_POST_ISSUE_DETAILS.floor_number,
        issue_assigned_to: USER_POST_ISSUE_DETAILS.assigned_to_user_id,
        issue_assigned_by: USER_POST_ISSUE_DETAILS.assigned_by_user_id,
        issue_self_assigned: USER_POST_ISSUE_DETAILS.self_assigned,
        issue_additional_info: USER_POST_ISSUE_DETAILS.additional_info,
        issue_user_confirmation_status: USER_POST_ISSUE_DETAILS.user_confirmation_status,
        issue_user_confirmed_at: USER_POST_ISSUE_DETAILS.user_confirmed_at,

        // Creator details
        creator_name: USERS.name,
        creator_profile_image: USER_PROFILES.profile_pic_url,
        creator_joined_at: USERS.created_at,
        creator_id: USERS.id,

        // Page details
        page_name: PAGES.name,
        page_profile_image: PAGE_PROFILES.profile_pic_url,
      })
      .from(USER_POSTS)
      .leftJoin(USER_POST_ISSUE_DETAILS, eq(USER_POSTS.id, USER_POST_ISSUE_DETAILS.post_id))
      .leftJoin(POST_CATEGORY_TEMPLATES, eq(USER_POSTS.category_id, POST_CATEGORY_TEMPLATES.id))
      .leftJoin(USERS, eq(USER_POSTS.creator_id, USERS.id))
      .leftJoin(USER_PROFILES, eq(USER_PROFILES.user_id, USERS.id))
      .leftJoin(PAGES, eq(USER_POSTS.page_id, PAGES.id))
      .leftJoin(PAGE_PROFILES, eq(PAGE_PROFILES.page_id, PAGES.id))
      .where(finalWhereCondition)
      .orderBy(sql`${USER_POSTS.created_at} DESC`);

    console.log(`Posts found for filter role ${filterRoleName}:`, rawPosts.length);

    // Get all post IDs for fetching related data
    const allPostIds = rawPosts.map(post => post.id);

    // Fetch images for all posts
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

    // Transform posts to final format
    const posts = rawPosts.map(post => {
      const basePost = {
        id: post.id,
        title: post.title,
        description: post.description,
        latitude: post.latitude,
        longitude: post.longitude,
        created_at: post.created_at,
        post_type: post.post_type,
        is_permanent: post.is_permanent,
        user_id: post.user_id,
        page_id: post.page_id,

        creator_id: post.creator_id,
        creator_joined_at: post.creator_joined_at,
        creator_profile_image: post.creator_profile_image,
        user_name: post.creator_name,
        created_by: post.creator_id,
        user_page_role: membership.role_name, // Always use user's ACTUAL role

        category_id: post.category_id,
        category_name: post.category_name,
        category_icon: post.category_icon,
        category_color: post.category_color,
        
        images: postImagesMap[post.id] || [],

        page: {
          name: post.page_name,
          profile_image: post.page_profile_image,
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

    // Fetch all available categories for this page (for the roles bar)
    const allPageCategories = await db
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
      .from(PAGE_ROLE_CATEGORY_MAP)
      .innerJoin(
        POST_CATEGORY_TEMPLATES,
        eq(PAGE_ROLE_CATEGORY_MAP.category_id, POST_CATEGORY_TEMPLATES.id)
      )
      .where(eq(PAGE_ROLE_CATEGORY_MAP.page_id, parseInt(pageId)))
      .groupBy(POST_CATEGORY_TEMPLATES.id);

    return NextResponse.json({
      posts,
      categories: allPageCategories,
      pageRoles: pageRoles,
      currentRole: membership.role_name, // User's ACTUAL role from PAGE_MEMBERS
      filterRole: filterRoleName, // Currently applied filter (may differ for admins)
      user: {
        id: userId,
        role: membership.role_name, // User's ACTUAL role
        isAdmin: membership.role_name.toLowerCase() === 'admin'
      },
    });

  } catch (err) {
    console.error("Page Posts API Error:", err);
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}