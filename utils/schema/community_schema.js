import {
  boolean,
  date,
  datetime,
  decimal,
  float,
  int,
  json,
  mysqlEnum,
  mysqlTable,
  primaryKey,
  text,
  time,
  timestamp,
  uniqueIndex,
  unique,
  varchar,
  uniqueKeyName,
  index,
  double,
} from "drizzle-orm/mysql-core";
import { EDUCATION_QUALIFICATIONS, POST_CATEGORY_TEMPLATES, SKILLS, USERS } from "./schema";


export const USER_ROLES = mysqlTable("user_roles", {
  id: int("id").primaryKey().autoincrement(),
  role_name: varchar("role_name", { length: 100 }).notNull().unique(), // e.g. 'user', 'admin', 'moderator', 'employer', etc.
  display_name: varchar("display_name", { length: 100 }).notNull(), // UI name (e.g., "District Collector")
  created_at: timestamp("created_at").defaultNow(),
  department: varchar("department", { length: 100 }), // 🔁 Make it optional (not .notNull())
});

export const USER_ENTITIES = mysqlTable("user_entities", {
  id: int("id").primaryKey().autoincrement(),
  user_id: int("user_id").notNull().references(() => USERS.id),
  type: varchar("type", { length: 50 }).notNull(), // e.g., 'user', 'company', 'restaurant'
  reference_id: int("reference_id").notNull(), // ID from company or restaurant table
});

export const USER_COMPANIES = mysqlTable("user_companies", {
  id: int("id").primaryKey().autoincrement(),
  user_id: int("user_id").notNull().references(() => USERS.id),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  logo_url: text("logo_url"),
  website_url: varchar("website_url", { length: 255 }),
  created_at: timestamp("created_at").defaultNow(),
});

export const USER_RESTAURANTS = mysqlTable("user_restaurants", {
  id: int("id").primaryKey().autoincrement(),
  user_id: int("user_id").notNull().references(() => USERS.id),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  location: varchar("location", { length: 255 }),
  image_url: text("image_url"),
  created_at: timestamp("created_at").defaultNow(),
});

export const COMMUNITY_ROLE_REQUIREMENTS = mysqlTable("community_role_requirements", {
  id: int("id").primaryKey().autoincrement(),
  role_id: int("role_id").notNull().references(() => COMMUNITY_TYPE_ROLES.id),
  requirement_type: varchar("requirement_type", { length: 50 }).notNull(), // e.g., 'user_company', 'user_restaurant'
});

export const COMMUNITY_TYPES = mysqlTable("community_types", {
  id: int("id").primaryKey().autoincrement(),
  name: varchar("name", { length: 100 }).notNull(), // e.g., "Startup", "City"
  description: text("description"),
  
  is_user_accessible: boolean("is_user_accessible").default(true),
  is_official_only: boolean("is_official_only").default(false),
});

export const COMMUNITY_TYPE_ROLES = mysqlTable("community_type_roles", {
  id: int("id").primaryKey().autoincrement(),
  community_type_id: int("community_type_id").notNull().references(() => COMMUNITY_TYPES.id),
  role_name: varchar("role_name", { length: 100 }).notNull(),
  is_official: boolean("is_official").default(false), // true = admin-assigned, false = user-selectable
});
 
export const COMMUNITIES = mysqlTable("communities", {
  id: int("id").primaryKey().autoincrement(),
  name: varchar("name", { length: 100 }).notNull(),
  description: text("description"),
  image_url: text("image_url"),
  community_type_id: int("community_type_id").notNull().references(() => COMMUNITY_TYPES.id),
  is_open: boolean("is_open").default(false), // true = open, false = closed
  invite_code: varchar("invite_code", { length: 255 }).unique(), // for invite link
  created_by: int("created_by").notNull().references(() => USERS.id), // who created
  created_at: timestamp("created_at").defaultNow(),
});

export const COMMUNITY_ROLES = mysqlTable("community_roles", {
  id: int("id").primaryKey().autoincrement(),
  community_id: int("community_id").notNull().references(() => COMMUNITIES.id, { onDelete: 'cascade' }),
  name: varchar("name", { length: 100 }).notNull(),
  description: text("description"),
  is_default: boolean("is_default").default(false),
  can_manage_posts: boolean("can_manage_posts").default(false),
  can_approve_users: boolean("can_approve_users").default(false),
  can_manage_roles: boolean("can_manage_roles").default(false),
}, (t) => ({
  uniqueRolePerCommunity: unique().on(t.community_id, t.name),
}));

export const COMMUNITY_MEMBERS = mysqlTable("community_members", {
  id: int("id").primaryKey().autoincrement(),
  community_id: int("community_id").notNull().references(() => COMMUNITIES.id, { onDelete: 'cascade' }),
  user_id: int("user_id").notNull().references(() => USERS.id, { onDelete: 'cascade' }),
  role_id: int("role_id").notNull().references(() => COMMUNITY_ROLES.id),
  is_approved: boolean("is_approved").default(false),
  added_by: int("added_by").references(() => USERS.id),
  created_at: timestamp("created_at").defaultNow(),
}, (t) => ({
  uniqueMember: unique().on(t.community_id, t.user_id),
}));

export const COMMUNITY_ROLE_CATEGORY_MAP = mysqlTable("community_role_category_map", {
  id: int("id").primaryKey().autoincrement(),
  community_id: int("community_id").notNull().references(() => COMMUNITIES.id, { onDelete: "cascade" }),
  community_role_id: int("community_role_id").notNull().references(() => COMMUNITY_ROLES.id, { onDelete: "cascade" }),
  category_id: int("category_id").notNull().references(() => POST_CATEGORY_TEMPLATES.id),
  created_at: timestamp("created_at").defaultNow(),
}, (t) => ({
  uniqueCombo: unique().on(t.community_id, t.community_role_id, t.category_id),
}));

export const USER_COMMUNITY_FOLLOW = mysqlTable("user_community_follow", {
  id: int("id").primaryKey().autoincrement(),
  user_id: int("user_id").notNull().references(() => USERS.id),
  community_id: int("community_id").notNull().references(() => COMMUNITIES.id),
  community_role_id: int("community_role_id").references(() => COMMUNITY_TYPE_ROLES.id),
  status: varchar("status", { length: 50 }).default("approved"), 
  // 'approved' (default) | 'pending' (join request) 

  invited_by: int("invited_by").references(() => USERS.id), // who invited them
  followed_at: timestamp("followed_at").defaultNow(),
}, (table) => {
  return {
    uniqueFollow: unique().on(table.user_id, table.community_id),
  };
});

export const COMMUNITY_GEOFENCES = mysqlTable("community_geofences", {
  id: int("id").primaryKey().autoincrement(),
  community_id: int("community_id")
    .notNull()
    .references(() => COMMUNITIES.id)
    .unique(), // one geofence per community (usually)

  name: varchar("name", { length: 255 }), // e.g. "Kanyakumari District Boundary"
  source: varchar("source", { length: 100 }).default("osm"), // e.g., "osm", "manual"
  geojson: json("geojson").notNull(), // full GeoJSON polygon or multipolygon
  center_lat: double("center_lat"), // optional: map center for faster rendering
  center_lng: double("center_lng"),

  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").onUpdateNow(),
});

export const DEPARTMENTS = mysqlTable("departments", { /* common departments */
  id: int("id").primaryKey().autoincrement(),
  name: varchar("name", { length: 100 }).notNull().unique(), // e.g. "Water Supply", "Electricity", "Health"
  description: text("description"),
});

/* Departments for a particular comunty for example departmetns frp the district community */
export const COMMUNITY_DEPARTMENTS = mysqlTable("community_departments", { 
  id: int("id").primaryKey().autoincrement(),
  community_id: int("community_id")
    .notNull()
    .references(() => COMMUNITIES.id),
  department_id: int("department_id")
    .notNull()
    .references(() => DEPARTMENTS.id),
});

export const DEPARTMENT_ROLE_MAP = mysqlTable("department_role_map", {
  id: int("id").primaryKey().autoincrement(),
  department_id: int("department_id")
    .notNull()
    .references(() => DEPARTMENTS.id),
  community_role_id: int("community_role_id")
    .notNull()
    .references(() => COMMUNITY_TYPE_ROLES.id),
});

// -----------------------------------
export const COMMUNITY_MODERATORS = mysqlTable("community_moderators", {
  id: int("id").primaryKey().autoincrement(),
  community_id: int("community_id").notNull().references(() => COMMUNITIES.id),
  user_id: int("user_id").notNull().references(() => USERS.id),
  role: varchar("role", { length: 50 }).default("admin"), // 'admin', 'moderator', etc.
});

/* Has to be manually mapped for now for each community type */
export const COMMUNITY_POST_CATEGORIES = mysqlTable("community_post_categories", {
  id: int("id").primaryKey().autoincrement(),
  community_type_id: int("community_type_id").notNull().references(() => COMMUNITY_TYPES.id),
  post_category_template_id: int("post_category_template_id").notNull().references(() => POST_CATEGORY_TEMPLATES.id),
});

export const COMMUNITY_POSTS = mysqlTable("community_posts", {
  id: int("id").primaryKey().autoincrement(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  image_url: text("image_url"),
  latitude: decimal("latitude", { precision: 10, scale: 7 }),
  longitude: decimal("longitude", { precision: 10, scale: 7 }),

  category_id: int("category_id").references(() => COMMUNITY_POST_CATEGORIES.id),
  community_id: int("community_id").references(() => COMMUNITIES.id),
  created_by: int("created_by").references(() => USERS.id),
  posted_by_entity_id: int("posted_by_entity_id").references(() => USER_ENTITIES.id),

  delete_after_hours: int("delete_after_hours"),
  is_permanent: boolean("is_permanent").notNull().default(false),
  created_at: timestamp("created_at").defaultNow(),
}, (table) => ({
  idxCommunityPostCommunityId: index("idx_community_post_community_id").on(table.community_id),
  idxCommunityPostCategoryId: index("idx_community_post_category_id").on(table.category_id),
  idxCommunityPostCreatedBy: index("idx_community_post_created_by").on(table.created_by),
  idxCommunityPostCreatedAt: index("idx_community_post_created_at").on(table.created_at),
  idxCommunityPostCoordinates: index("idx_community_post_coordinates").on(table.latitude, table.longitude),
}));

export const COMMUNITY_POST_IMAGES = mysqlTable("community_post_images", {
  id: int("id").primaryKey().autoincrement(),
  post_id: int("post_id")
    .notNull()
    .references(() => COMMUNITY_POSTS.id, { onDelete: "cascade" }), // linked to user_posts
  image_url: text("image_url").notNull(),
  is_primary: boolean("is_primary").default(false),
  display_order: int("display_order").default(0),
  created_at: timestamp("created_at").defaultNow(),
}, (table) => ({
  idxPost: index("idx_post_images_post").on(table.post_id),
  idxPrimary: index("idx_post_images_primary").on(table.is_primary),
}));

export const USER_COMPLAINT_DETAILS = mysqlTable("user_complaint_details", {
  id: int("id").primaryKey().autoincrement(),

  post_id: int("post_id")
    .notNull()
    .unique()
    .references(() => COMMUNITY_POSTS.id, { onDelete: "cascade" }),

  location_description: varchar("location_description", { length: 255 }), // optional extra info
  severity: mysqlEnum("severity", ["low", "medium", "high"]).default("low"),

  // Status tracking
  status: mysqlEnum("status", [
    "submitted",       // user submitted complaint
    "acknowledged",    // official saw it
    "in_progress",     // official is working on it
    "resolved",        // fixed
    "rejected"         // marked invalid
  ]).default("submitted"),

  updated_at: timestamp("updated_at").defaultNow().onUpdateNow(),
}, (table) => ({
  idxComplaintPostId: index("idx_complaint_post_id").on(table.post_id),
  idxComplaintStatus: index("idx_complaint_status").on(table.status),
}));

export const COMPLAINT_DEPARTMENTS = mysqlTable("complaint_departments", {
  id: int("id").primaryKey().autoincrement(),
  complaint_id: int("complaint_id")
    .notNull()
    .references(() => USER_COMPLAINT_DETAILS.id, { onDelete: "cascade" }),
  department_id: int("department_id")
    .notNull()
    .references(() => DEPARTMENTS.id),
});

export const COMPLAINT_STATUS_LOGS = mysqlTable("complaint_status_logs", {
  id: int("id").primaryKey().autoincrement(),

  complaint_id: int("complaint_id")
    .notNull()
    .references(() => USER_COMPLAINT_DETAILS.id, { onDelete: "cascade" }),

  updated_by: int("updated_by")
    .notNull()
    .references(() => USERS.id), // who changed the status (official or citizen))

  new_status: mysqlEnum("new_status", [
    "acknowledged",
    "in_progress",
    "resolved",
    "rejected"
  ]).notNull(),

  remarks: text("remarks"), // optional comment
  updated_at: timestamp("updated_at").defaultNow(),
}, (table) => ({
  idxComplaintLogsComplaintId: index("idx_complaint_logs_complaint_id").on(table.complaint_id),
}));

export const COMMUNITY_JOB_DETAILS = mysqlTable("community_job_details", {
  id: int("id").primaryKey().autoincrement(),
  post_id: int("post_id").notNull().unique().references(() => COMMUNITY_POSTS.id, { onDelete: 'cascade' }),

  job_type: mysqlEnum("job_type", ["Internship", "Jobs", "Gigs"]).notNull(),
  link: varchar("link", { length: 500 }),
  is_paid: boolean("is_paid").notNull().default(true),
  salary_or_stipend: varchar("salary_or_stipend", { length: 100 }),
  location_type: mysqlEnum("location_type", ["remote", "onsite", "hybrid"]).notNull(),
  duration: varchar("duration", { length: 100 }),
  application_deadline: date("application_deadline"),
  event_name: varchar("event_name", { length: 255 }),
  event_date: date("event_date"),
  additional_info: text("additional_info"),
}, (table) => ({
  idxCommunityJobDetailsPostId: index("idx_community_job_details_post_id").on(table.post_id),
  idxCommunityJobDetailsJobType: index("idx_community_job_details_job_type").on(table.job_type),
  idxCommunityJobDetailsLocationType: index("idx_community_job_details_location_type").on(table.location_type),
  idxCommunityJobDetailsApplicationDeadline: index("idx_community_job_details_application_deadline").on(table.application_deadline),
}));

export const COMMUNITY_JOB_EDUCATION_MAP = mysqlTable("community_job_education_map", {
  id: int("id").primaryKey().autoincrement(),
  job_id: int("job_id").notNull().references(() => COMMUNITY_JOB_DETAILS.id),
  education_id: int("education_id").notNull().references(() => EDUCATION_QUALIFICATIONS.id),
});

export const COMMUNITY_JOB_EXPERIENCE = mysqlTable("community_job_experience", {
  id: int("id").primaryKey().autoincrement(),
  job_id: int("job_id").notNull().references(() => COMMUNITY_JOB_DETAILS.id),
  min_years: int("min_years").default(0),
  max_years: int("max_years").default(0),
});

export const COMMUNITY_JOB_SKILLS_MAP = mysqlTable("community_job_skills_map", {
  id: int("id").primaryKey().autoincrement(),
  job_id: int("job_id").notNull().references(() => COMMUNITY_JOB_DETAILS.id),
  skill_id: int("skill_id").notNull().references(() => SKILLS.id),
});

export const COMMUNITY_EVENT_DETAILS = mysqlTable("community_event_details", {
  id: int("id").primaryKey().autoincrement(),
  post_id: int("post_id").notNull().unique().references(() => COMMUNITY_POSTS.id, { onDelete: 'cascade' }),

  event_type: mysqlEnum("event_type", [
    "Job Fair",
    "Hackathon",
    "Walk-in",
    "Challenge",
  ]).notNull(),

  event_name: varchar("event_name", { length: 255 }),
  event_date: date("event_date"),
  link: varchar("link", { length: 500 }),
  additional_info: text("additional_info"),
});

export const COMMUNITY_PRODUCT_LAUNCH_DETAILS = mysqlTable("community_product_launch_details", {
  id: int("id").primaryKey().autoincrement(),
  post_id: int("post_id").notNull().unique().references(() => COMMUNITY_POSTS.id, { onDelete: 'cascade' }),

  product_name: varchar("product_name", { length: 255 }).notNull(),
  launch_date: date("launch_date"),
  link: varchar("link", { length: 500 }),
  additional_info: text("additional_info"),
});

export const COMMUNITY_POST_LIKES = mysqlTable("community_post_likes", {
  id: int("id").primaryKey().autoincrement(),
  post_id: int("post_id").notNull().references(() => COMMUNITY_POSTS.id),
  user_id: int("user_id").notNull().references(() => USERS.id),
  liked_at: timestamp("liked_at").defaultNow(),
}, (table) => {
  return {
    uniqueLike: unique().on(table.post_id, table.user_id),
  };
});

export const COMMUNITY_POST_ISSUE_DETAILS = mysqlTable("community_post_issue_details", {
  id: int("id").primaryKey().autoincrement(),

  post_id: int("post_id")
    .notNull()
    .references(() => COMMUNITY_POSTS.id, { onDelete: "cascade" }), // ⬅ now community_posts

  status: mysqlEnum("status", ["pending", "in_progress", "completed"]).default("pending"),
  priority: mysqlEnum("priority", ["low", "medium", "high"]).default("medium"),

  building_name: varchar("building_name", { length: 100 }),
  block_name: varchar("block_name", { length: 100 }),
  floor_number: varchar("floor_number", { length: 50 }),

  assigned_to_user_id: int("assigned_to_user_id").references(() => USERS.id, { onDelete: "set null" }),
  assigned_by_user_id: int("assigned_by_user_id").references(() => USERS.id, { onDelete: "set null" }),
  self_assigned: boolean("self_assigned").default(false),

  additional_info: text("additional_info"),

  user_confirmation_status: mysqlEnum("user_confirmation_status", ["pending", "confirmed", "rejected"]).default("pending"),
  user_confirmed_at: timestamp("user_confirmed_at"),

  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").onUpdateNow(),
});


