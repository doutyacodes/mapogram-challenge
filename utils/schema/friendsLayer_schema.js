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

export const FRIEND_REQUESTS = mysqlTable("friend_requests", {
  id: int("id").primaryKey().autoincrement(),
  sender_id: int("sender_id").notNull().references(() => USERS.id),
  receiver_id: int("receiver_id").notNull().references(() => USERS.id),
  status: mysqlEnum("status", ["pending", "accepted", "rejected"]).notNull().default("pending"),
  requested_at: timestamp("requested_at").defaultNow(),
  responded_at: timestamp("responded_at"),
}, (table) => ({
  uniqueFriendRequest: unique().on(table.sender_id, table.receiver_id),
}));

export const FRIENDS = mysqlTable("friends", {
  id: int("id").primaryKey().autoincrement(),
  user1_id: int("user1_id").notNull().references(() => USERS.id),
  user2_id: int("user2_id").notNull().references(() => USERS.id),
  became_friends_at: timestamp("became_friends_at").defaultNow(),
}, (table) => ({
  uniqueFriendship: unique().on(table.user1_id, table.user2_id),
}));

export const USER_PERSONAL_EVENT_DETAILS = mysqlTable("user_personal_event_details", {
  id: int("id").primaryKey().autoincrement(),

  post_id: int("post_id").notNull().unique().references(() => USER_POSTS.id, { onDelete: 'cascade' }),

  event_date: date("event_date").notNull(),
  contact_info: varchar("contact_info", { length: 255 }),
  additional_info: text("additional_info"),
});


// 1. Enum for notification types
const notificationType = mysqlEnum("type", [
  "follow_page",        // A user followed a page
  "friend_request",     // A user sent you a friend request
  "friend_accept",      // Your friend request was accepted
  "tagged_in_post",     // You were tagged in a post and need to approve
  "added_as_admin",     // You were added as an admin to a page
  "post_flagged"        // A post was flagged for review
]);

// 2. Table definition
export const USER_NOTIFICATIONS = mysqlTable("user_notifications", {
  id: int("id").primaryKey().autoincrement(),

  user_id: int("user_id").notNull().references(() => USERS.id), // Who receives the notification

  type: notificationType.notNull(), // Type of notification (enum)

  message: varchar("message", { length: 255 }).notNull(), // Human-readable message to display

  metadata: json("metadata"), // Optional extra info (like sender_id, post_id, etc.)

  is_read: boolean("is_read").default(false), // Mark if user has seen this

  created_at: timestamp("created_at").defaultNow(), // When it was created
});