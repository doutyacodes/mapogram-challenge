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

export const ROLES = mysqlTable('roles', {
  id: int('id').primaryKey().autoincrement(),
  name: varchar('name', { length: 50 }).notNull().unique(), // e.g., 'super_admin', 'official_admin', 'official_user', 'user'
  display_name: varchar('display_name', { length: 100 }),
  description: text('description'),
  created_at: timestamp('created_at').defaultNow(),
});

export const USERS = mysqlTable('users', {
  id: int('id').primaryKey().autoincrement(),
  name: varchar('name', { length: 100 }),
  username: varchar('username', { length: 100 }).notNull().unique(),
  password: varchar('password', { length: 255 }),
  role_id: int('role_id').references(() => ROLES.id).default(3), // default = user
  created_at: timestamp('created_at').defaultNow(),
});

export const USER_PROFILES = mysqlTable("user_profiles", {
  id: int("id").primaryKey().autoincrement(),
  user_id: int("user_id").notNull().references(() => USERS.id),
  bio: text("bio"),
  profile_pic_url: varchar("profile_pic_url", { length: 255 }),
});

export const AUTH_PROVIDERS = mysqlTable("auth_providers", {
  id: int("id").primaryKey().autoincrement(),
  user_id: int("user_id").notNull().references(() => USERS.id),
  provider: varchar("provider", { length: 50 }).notNull(), // "google"
  provider_user_id: varchar("provider_user_id", { length: 255 }).notNull(),
});

export const PAGES = mysqlTable("pages", {
  id: int("id").primaryKey().autoincrement(),
  user_id: int("user_id").notNull().references(() => USERS.id),

  name: varchar("name", { length: 100 }).notNull(),
  username: varchar("username", { length: 100 }).notNull().unique(),
  page_type_id: int("page_type_id").references(() => PAGE_TYPES.id).default(null),

  created_at: timestamp("created_at").defaultNow(),
});

export const PAGE_PROFILES = mysqlTable("page_profiles", {
  id: int("id").primaryKey().autoincrement(),
  page_id: int("page_id").notNull().references(() => PAGES.id),
  bio: text("bio"),
  profile_pic_url: varchar("profile_pic_url", { length: 255 }),
  website_url: varchar("website_url", { length: 255 }), // ✅ moved here
  latitude: decimal("latitude", { precision: 10, scale: 7 }),  // example: 12.9715987
  longitude: decimal("longitude", { precision: 10, scale: 7 }), // example: 77.594566
});

export const PAGE_GEOFENCES = mysqlTable("page_geofences", {
  id: int("id").primaryKey().autoincrement(),
  page_id: int("page_id")
    .notNull()
    .references(() => PAGES.id)
    .unique(), // one geofence per page (like one per Technopark)
    
  name: varchar("name", { length: 255 }),
  source: varchar("source", { length: 100 }).default("manual"), // “manual” if user draws it
  geojson: json("geojson").notNull(), // full GeoJSON polygon or multipolygon
  center_lat: double("center_lat"),
  center_lng: double("center_lng"),
  
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").onUpdateNow(),
});

export const PAGE_ADMINS = mysqlTable("page_admins", {
  id: int("id").primaryKey().autoincrement(),
  page_id: int("page_id").notNull().references(() => PAGES.id, { onDelete: 'cascade' }),
  user_id: int("user_id").notNull().references(() => USERS.id, { onDelete: 'cascade' }),
  is_owner: boolean("is_owner").notNull().default(false),
  added_at: timestamp("added_at").defaultNow(),
}, (table) => ({
  uniquePageAdmin: unique().on(table.page_id, table.user_id),
}));

export const PAGE_ROLES = mysqlTable("page_roles", {
  id: int("id").primaryKey().autoincrement(),
  page_id: int("page_id").notNull().references(() => PAGES.id, { onDelete: 'cascade' }),

  name: varchar("name", { length: 100 }).notNull(), // e.g. 'Admin', 'Member', 'Maintenance', 'Security'
  description: text("description"),
  is_default: boolean("is_default").default(false), // true for 'Admin' and 'Member' on page creation
  can_manage_posts: boolean("can_manage_posts").default(false),
  can_approve_users: boolean("can_approve_users").default(false),
  can_manage_roles: boolean("can_manage_roles").default(false),
});

export const PAGE_MEMBERS = mysqlTable("page_members", {
  id: int("id").primaryKey().autoincrement(),
  page_id: int("page_id").notNull().references(() => PAGES.id, { onDelete: 'cascade' }),
  user_id: int("user_id").notNull().references(() => USERS.id, { onDelete: 'cascade' }),
  role_id: int("role_id").notNull().references(() => PAGE_ROLES.id),
  is_approved: boolean("is_approved").default(false), // for approval workflow
  added_by: int("added_by").references(() => USERS.id),
  created_at: timestamp("created_at").defaultNow(),
}, (table) => ({
  uniqueMember: unique().on(table.page_id, table.user_id),
}));

export const PAGE_TYPES = mysqlTable("page_types", {
  id: int("id").primaryKey().autoincrement(),
  name: varchar("name", { length: 50 }).notNull().unique(),
  description: text("description"),
  icon_url: text("icon_url"), // Optional, in case you want to show an icon
  category: varchar("category", { length: 50 }).default("general"), // e.g. "government_officials", "business", "community"
});

export const USERNAMES = mysqlTable("usernames", {
  id: int("id").primaryKey().autoincrement(),

  username: varchar("username", { length: 100 }).notNull().unique(),

  entity_type: varchar("entity_type", { length: 20 }).notNull(), // e.g. "user", "page"
  entity_id: int("entity_id").notNull(), // references USERS.id or PAGES.id

  created_at: timestamp("created_at").defaultNow(),
});

export const PAGE_ROLE_CATEGORY_MAP = mysqlTable("page_role_category_map", {
  id: int("id").primaryKey().autoincrement(),
  page_id: int("page_id").notNull().references(() => PAGES.id, { onDelete: "cascade" }),
  page_role_id: int("page_role_id").notNull().references(() => PAGE_ROLES.id),
  category_id: int("category_id").notNull().references(() => POST_CATEGORY_TEMPLATES.id),
  created_at: timestamp("created_at").defaultNow(),
});

export const PAGE_TYPE_CATEGORY_PERMISSIONS = mysqlTable("page_type_category_permissions", {
  id: int("id").primaryKey().autoincrement(),

  page_type_id: int("page_type_id").notNull().references(() => PAGE_TYPES.id),
  category_template_id: int("category_template_id").notNull().references(() => POST_CATEGORY_TEMPLATES.id),
})

export const USER_CATEGORY_PERMISSIONS = mysqlTable("user_category_permissions", {
  id: int("id").primaryKey().autoincrement(),
  category_template_id: int("category_template_id").notNull().references(() => POST_CATEGORY_TEMPLATES.id),
});

export const LAYERS = mysqlTable("layers", {
  id: int("id").primaryKey().autoincrement(),
  name: varchar("name", { length: 100 }).notNull().unique(), // "News", "Jobs", "Events"
  is_permanent: boolean("is_permanent").default(false).notNull(), // new
});

export const POST_CATEGORY_TEMPLATES = mysqlTable("post_category_templates", {
  id: int("id").primaryKey().autoincrement(),
  name: varchar("name", { length: 100 }).notNull().unique(),       // e.g., "Hiring"
  shape: varchar("shape", { length: 30 }).notNull(),               // e.g., "circle", "pin"
  icon_name: varchar("icon_name", { length: 50 }).notNull(),       // e.g., "UserPlus"
  color: varchar("color", { length: 20 }),                         // e.g., "#10B981"
  gradient_class_name: varchar("gradient_class_name", { length: 150 }),// e.g., "bg-gradient-to-r from-sky-500 to-sky-600"
  class_name: varchar("class_name", { length: 100 }),              // e.g., "text-white"
  post_type: mysqlEnum("post_type", ["general", "job", "news", "event", "announcement", "personal_event","classified", "city", "offers", "complaints", "issue"]).default("general"),
  label: varchar("label", { length: 100 }), // e.g., "Post a Job", "Create News", "Make an Announcement"
  description: varchar("description", { length: 255 }), // e.g., "Announce something happening at a place and time — let others know and join in"
  is_official: boolean("is_official").default(false),
  is_ops_only: boolean("is_ops_only").default(false),
});

export const CATEGORY_LAYER_MAP = mysqlTable("category_layer_map", {
  id: int("id").primaryKey().autoincrement(),
  category_id: int("category_id").notNull().references(() => POST_CATEGORY_TEMPLATES.id),
  layer_id: int("layer_id").notNull().references(() => LAYERS.id),
},(table) => ({
  idxCategoryLayerMapCategoryId: index("idx_category_layer_map_category_id").on(table.category_id),
  idxCategoryLayerMapLayerId: index("idx_category_layer_map_layer_id").on(table.layer_id),
})
);

export const USER_POSTS = mysqlTable("user_posts", {
  id: int("id").primaryKey().autoincrement(),

  creator_type: mysqlEnum("creator_type", ["user", "page"]).notNull(),
  creator_id: int("creator_id").notNull(), // Will be either USERS.id or PAGES.id
  page_id: int("page_id").references(() => PAGES.id, { onDelete: "set null" }),

  title: varchar("title", { length: 255 }),
  description: text("description"),
  image_url: text("image_url"),
  latitude: decimal("latitude", { precision: 10, scale: 7 }),
  longitude: decimal("longitude", { precision: 10, scale: 7 }),

  category_id: int("category_id").notNull().references(() => POST_CATEGORY_TEMPLATES.id),
  post_type: mysqlEnum("post_type", ["general", "job", "news", "event", "personal_event", "classifieds", "offers", "complaints", "issue"]).default("general"),

  delete_after_hours: int("delete_after_hours"),
  is_story: boolean("is_story").notNull().default(false),

  is_permanent: boolean("is_permanent").notNull().default(false),
  created_at: timestamp("created_at").defaultNow(),
}, (table) => ({
  idxCreator: index("idx_creator").on(table.creator_type, table.creator_id),
  idxPage: index("idx_user_posts_page_id").on(table.page_id),
  idxCategory: index("idx_user_posts_category_id").on(table.category_id),
  idxPostType: index("idx_user_posts_post_type").on(table.post_type),
  idxCreatedAt: index("idx_user_posts_created_at").on(table.created_at),
  idxCoordinates: index("idx_user_posts_coordinates").on(table.latitude, table.longitude),
}));

export const POST_IMAGES = mysqlTable("post_images", {
  id: int("id").primaryKey().autoincrement(),
  post_id: int("post_id")
    .notNull()
    .references(() => USER_POSTS.id, { onDelete: "cascade" }), // linked to user_posts
  image_url: text("image_url").notNull(),
  is_primary: boolean("is_primary").default(false),
  display_order: int("display_order").default(0),
  created_at: timestamp("created_at").defaultNow(),
}, (table) => ({
  idxPost: index("idx_post_images_post").on(table.post_id),
  idxPrimary: index("idx_post_images_primary").on(table.is_primary),
}));

export const POST_TAGS = mysqlTable("post_tags", {
  id: int("id").primaryKey().autoincrement(),

  post_id: int("post_id").notNull().references(() => USER_POSTS.id),

  tagged_type: mysqlEnum("tagged_type", ["user", "page"]).notNull(),
  tagged_id: int("tagged_id").notNull(), // refers to USERS.id or PAGES.id depending on tagged_type

  is_accepted: boolean("is_accepted").notNull().default(false),
  created_at: timestamp("created_at").defaultNow(),
}, (table) => ({
  idxPostTag: index("idx_post_tag").on(table.post_id, table.tagged_type, table.tagged_id),
}));

export const POST_CHAT_MESSAGES = mysqlTable("post_chat_messages", {
  id: int("id").primaryKey().autoincrement(),

  post_id: int("post_id").notNull().references(() => USER_POSTS.id, { onDelete: "cascade" }),
  post_type: varchar("post_type", { length: 50 }).notNull(), // e.g. "complaint", "job", "news"
  
  sender_type: varchar("sender_type", { length: 50 }).notNull(), // "user" or "service_center"
  sender_id: int("sender_id").notNull(), // can be user_id or page_id

  message_text: text("message_text"),
  media_url: text("media_url"),
  media_type: varchar("media_type", { length: 20 }).default("none"), // "image", "video", "none"

  is_read_by_user: boolean("is_read_by_user").default(false),
  is_read_by_admin: boolean("is_read_by_admin").default(false),

  created_at: timestamp("created_at").defaultNow(),
}, (table) => ({
  idxPost: index("idx_post_chat_messages_post_id").on(table.post_id),
  idxSender: index("idx_post_chat_messages_sender_id").on(table.sender_id),
}));

export const USER_POST_LIKES = mysqlTable('user_post_likes', {
  user_id: int('user_id').notNull().references(() => USERS.id),
  post_id: int('post_id').notNull().references(() => USER_POSTS.id),
  liked_at: timestamp('liked_at').defaultNow(), // Optional
}, (table) => ({
  pk_user_post_like: primaryKey({ columns: [table.user_id, table.post_id] }),
}));

export const POST_LAYER_MAP = mysqlTable("post_layer_map", {
  id: int("id").primaryKey().autoincrement(),
  post_id: int("post_id").notNull().references(() => USER_POSTS.id),
  layer_id: int("layer_id").notNull().references(() => LAYERS.id),
},(table) => ({
  idxPostLayerMapPostId: index("idx_post_layer_map_post_id").on(table.post_id),
  erMapLayerId: index("idx_post_layer_map_layer_id").on(table.layer_id),
})
);

export const USER_JOB_DETAILS = mysqlTable("user_job_details", {
  id: int("id").primaryKey().autoincrement(),
  post_id: int("post_id").notNull().references(() => USER_POSTS.id).unique(),
  job_type: mysqlEnum("job_type", ["Internship", "Jobs", "Gigs"]).notNull(),
  // 🔗 Action link (e.g., Apply, Register, etc)
  link: varchar("link", { length: 500 }),

  // 💸 Compensation
  is_paid: boolean("is_paid").notNull().default(true),
  salary_or_stipend: varchar("salary_or_stipend", { length: 100 }), // e.g., ₹10,000/month or 3-5 LPA

  // 🔁 Location info (type only; coordinates are in base table)
  location_type: mysqlEnum("location_type", ["remote", "onsite", "hybrid"]).notNull(),

  // 📅 Duration (esp. for internship/gig)
  duration: varchar("duration", { length: 100 }),

  // 🎓 Qualifications or Skills
  // experience_required: varchar("experience_required", { length: 100 }), // e.g., "0-2 years"
  // education_required: varchar("education_required", { length: 100 }), // e.g., "B.Tech", "Any Graduate"
  // skills_required: text("skills_required"), // comma separated or JSON

  application_deadline: date("application_deadline"),

  // 📆 For `other` post types like Job Fair
  event_name: varchar("event_name", { length: 255 }),
  event_date: date("event_date"),
  additional_info: text("additional_info"), 
},(table) => ({
  idxUserJobDetailsPostId: index("idx_user_job_details_post_id").on(table.post_id),
  idxUserJobDetailsJobType: index("idx_user_job_details_job_type").on(table.job_type),
  idxUserJobDetailsLocationType: index("idx_user_job_details_location_type").on(table.location_type),
  idxUserJobDetailsApplicationDeadline: index("idx_user_job_details_application_deadline").on(table.application_deadline),
})
);

export const USER_EVENT_DETAILS = mysqlTable("user_event_details", {
  id: int("id").primaryKey().autoincrement(),

  post_id: int("post_id").notNull().unique().references(() => USER_POSTS.id, { onDelete: 'cascade' }),

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

export const JOB_SKILLS_MAP = mysqlTable("job_skills_map", {
  id: int("id").primaryKey().autoincrement(),
  job_id: int("job_id").notNull().references(() => USER_JOB_DETAILS.id),
  skill_id: int("skill_id").notNull().references(() => SKILLS.id),
});

export const SKILLS = mysqlTable("skills", {
  id: int("id").primaryKey().autoincrement(),
  name: varchar("name", { length: 100 }).unique().notNull(),
});

export const JOB_EDUCATION_MAP = mysqlTable("job_education_map", {
  id: int("id").primaryKey().autoincrement(),
  job_id: int("job_id").notNull().references(() => USER_JOB_DETAILS.id),
  education_id: int("education_id").notNull().references(() => EDUCATION_QUALIFICATIONS.id),
});

export const EDUCATION_QUALIFICATIONS = mysqlTable("education_qualifications", {
  id: int("id").primaryKey().autoincrement(),
  name: varchar("name", { length: 100 }).unique().notNull(), // e.g., "B.Tech", "MBA", "Any Graduate"
});

export const JOB_EXPERIENCE = mysqlTable("job_experience", {
  id: int("id").primaryKey().autoincrement(),
  job_id: int("job_id").notNull().references(() => USER_JOB_DETAILS.id),
  min_years: int("min_years").default(0),
  max_years: int("max_years").default(0),
});

export const USER_POST_REGISTRATIONS = mysqlTable(
  "user_post_registrations",
  {
    id: int("id").primaryKey().autoincrement(),

    post_id: int("post_id").notNull().references(() => USER_POSTS.id),
    user_id: int("user_id").notNull().references(() => USERS.id),

    user_latitude: decimal("user_latitude", { precision: 10, scale: 7 }),
    user_longitude: decimal("user_longitude", { precision: 10, scale: 7 }),

    note: text("note"),
    resume_url: text("resume_url"),

    created_at: timestamp("created_at").defaultNow(),
  },
  (table) => ({
    uniqueRegistration: unique("unique_registration").on(table.post_id, table.user_id),
  })
);

export const LANGUAGES = mysqlTable("languages", {
  id: int("id").primaryKey().autoincrement(),
  name: varchar("name", { length: 100 }).notNull(),  // e.g., "English", "Hindi"
  code: varchar("code", { length: 10 }).notNull(),   // e.g., "en", "hi"
});

export const USER_NEWS_DETAILS = mysqlTable("user_news_details", {
  id: int("id").primaryKey().autoincrement(),
  post_id: int("post_id").notNull().references(() => USER_POSTS.id).unique(),

  // Optional: if page wants to attach full article
  article_url: text("article_url"),

  // Optional: summary or body
  summary: text("summary"),

  // Optional: news language (if you want to filter by lang)
  language_id: int("language_id").references(() => LANGUAGES.id),

  // Optional: flag for high priority news
  is_high_priority: boolean("is_high_priority").default(false),

  // Optional: Breaking news marker
  is_breaking: boolean("is_breaking").default(false),
  breaking_expire_at: timestamp("breaking_expire_at"),
},(table) => ({
  idxUserNewsDetailsPostId: index("idx_user_news_details_post_id").on(table.post_id),
  idxUserNewsDetailsLanguageId: index("idx_user_news_details_language_id").on(table.language_id),
  idxUserNewsDetailsIsHighPriority: index("idx_user_news_details_is_high_priority").on(table.is_high_priority),
})
);

/* Offers */
export const USER_OFFER_DETAILS = mysqlTable("user_offer_details", {
  id: int("id").primaryKey().autoincrement(),

  post_id: int("post_id").notNull().unique().references(() => USER_POSTS.id, { onDelete: 'cascade' }),

  valid_from: date("valid_from").notNull(),
  valid_until: date("valid_until").notNull(),

  coupon_code: varchar("coupon_code", { length: 50 }), // optional
  website_url: varchar("website_url", { length: 500 }), // optional
}, (table) => ({
  idxUserOfferDetailsPostId: index("idx_user_offer_details_post_id").on(table.post_id),
  idxUserOfferDetailsDates: index("idx_user_offer_details_dates").on(table.valid_from, table.valid_until),
}));

// Users following Pages
export const USER_FOLLOWED_PAGES = mysqlTable(
  "user_followed_pages",
  {
    id: int("id").primaryKey().autoincrement(),
    user_id: int("user_id").notNull().references(() => USERS.id),
    page_id: int("page_id").notNull().references(() => PAGES.id),
    followed_at: timestamp("followed_at").defaultNow(),
  },
  (table) => ({
    userPageIndex: index("idx_user_page").on(table.user_id, table.page_id),
  })
);

// Users following Layers
export const USER_FOLLOWED_LAYERS = mysqlTable(
  "user_followed_layers",
  {
    id: int("id").primaryKey().autoincrement(),
    user_id: int("user_id").notNull().references(() => USERS.id),
    layer_id: int("layer_id").notNull().references(() => LAYERS.id),
    followed_at: timestamp("followed_at").defaultNow(),
  },
  (table) => ({
    userLayerIndex: index("idx_user_layer").on(table.user_id, table.layer_id),
  })
);

export const USER_BOTTOM_BAR = mysqlTable('user_bottom_bar', {
  id: int('id').primaryKey().autoincrement(),
  user_id: int('user_id').notNull().references(() => USERS.id, { onDelete: 'cascade' }),
  item_id: int('item_id').notNull(),
  item_type: varchar('item_type', { length: 10 }).notNull(), // 'page' or 'layer' or 'community'
  position: int('position').notNull(),
  created_at: timestamp('created_at').defaultNow(),
  updated_at: timestamp('updated_at').defaultNow(),
}, (table) => ({
  uniqUserPosition: unique().on(table.user_id, table.position), // 👈 This ensures one item per position per user
}));

export const USER_POST_VIEWS = mysqlTable("user_post_views", {
  id: int("id").primaryKey().autoincrement(),

  post_id: int("post_id").notNull().references(() => USER_POSTS.id, { onDelete: "cascade" }),
  user_id: int("user_id").notNull().references(() => USERS.id, { onDelete: "cascade" }),

  viewed_at: timestamp("viewed_at").defaultNow(),
}, (table) => ({
  idxPostId: index("idx_post_id").on(table.post_id),
  idxUserId: index("idx_user_id").on(table.user_id),
}));

// -----------------------------------====================================--------------