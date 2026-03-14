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
import { USER_POSTS, USERS } from "./schema";

export const USER_POST_ISSUE_DETAILS = mysqlTable("user_post_issue_details", {
  id: int("id").primaryKey().autoincrement(),

  post_id: int("post_id")
    .notNull()
    .references(() => USER_POSTS.id, { onDelete: "cascade" }),

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
