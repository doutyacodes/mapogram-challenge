import { PAGES, USER_POSTS, USERS } from "./schema";
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
} from "drizzle-orm/mysql-core";

export const BRANDS = mysqlTable("brands", {
  id: int("id").primaryKey().autoincrement(),
  name: varchar("name", { length: 100 }).notNull().unique(), // e.g., "Honda", "Samsung"
  description: text("description"), // optional
  created_at: timestamp("created_at").defaultNow(),
});

export const PRODUCTS = mysqlTable("products", {
  id: int("id").primaryKey().autoincrement(),
  brand_id: int("brand_id").references(() => BRANDS.id).notNull(),
  name: varchar("name", { length: 100 }).notNull(),       // e.g., "City 2023", "Washing Machine X100"
  category: varchar("category", { length: 50 }).notNull(), // e.g., "Vehicle", "Appliance"
  description: text("description"),
  created_at: timestamp("created_at").defaultNow(),
});

export const SERVICE_CENTER_BRANDS = mysqlTable("service_center_brands", {
  id: int("id").primaryKey().autoincrement(),
  page_id: int("page_id").references(() => PAGES.id).notNull(),  // Service center page
  brand_id: int("brand_id").references(() => BRANDS.id).notNull(),
});

export const SERVICE_CENTER_PRODUCTS = mysqlTable("service_center_products", {
  id: int("id").primaryKey().autoincrement(),
  page_id: int("page_id").references(() => PAGES.id).notNull(),
  product_id: int("product_id").references(() => PRODUCTS.id).notNull(),
});

export const USER_COMPLAINT_POSTS = mysqlTable("user_complaint_posts", {
  id: int("id").primaryKey().autoincrement(),
  post_id: int("post_id").notNull().references(() => USER_POSTS.id).unique(),

  brand_id: int("brand_id").notNull().references(() => BRANDS.id),
  product_id: int("product_id").notNull().references(() => PRODUCTS.id),
  specific_product_name: varchar("specific_product_name", { length: 255 }), // optional custom product name

  service_center_page_id: int("service_center_page_id").references(() => PAGES.id),

  status: mysqlEnum("status", ["pending", "in_progress", "completed", "rejected"]).default("pending"),

  reported_at: timestamp("reported_at").defaultNow(),
  completed_at: timestamp("completed_at"),
  handled_by_user_id: int("handled_by_user_id").references(() => USERS.id), // optional admin/technician

  assigned_technician_id: int("assigned_technician_id").references(() => USERS.id), // the person actually attending

  additional_info: text("additional_info"), // extra notes

  user_confirmation_status: mysqlEnum("user_confirmation_status", ["pending", "confirmed", "rejected"]).default("pending"),
  user_confirmed_at: timestamp("user_confirmed_at"),
}, (table) => ({
  idxComplaintPostId: index("idx_user_complaint_post_id").on(table.post_id),
  idxComplaintStatus: index("idx_user_complaint_status").on(table.status),
  idxComplaintServiceCenter: index("idx_user_complaint_service_center").on(table.service_center_page_id),
  idxServiceType: index("idx_service_type").on(table.service_type),
  idxAssignedTech: index("idx_assigned_technician_id").on(table.assigned_technician_id),
  idxUserConfirmation: index("idx_user_confirmation_status").on(table.user_confirmation_status),
}));