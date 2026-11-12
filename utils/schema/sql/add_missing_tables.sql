-- Tables the app's code expects but the database does not have.
--   * Legacy NewsOnMap tables (utils/schema/schema.js, "Legacy NewsOnMap tables"):
--     used by /api/nearby-news/*, /api/news/* and /api/admin/signup
--   * user_roles (utils/schema/community_schema.js USER_ROLES):
--     used by /api/admin/roles and /api/admin/signup
--
-- Only CREATE TABLE IF NOT EXISTS: safe to re-run, never alters or drops anything.
-- Prefer this over `drizzle-kit push`, which diffs the whole schema and may try to
-- change unrelated tables.

CREATE TABLE IF NOT EXISTS `user_roles` (
  `id` int NOT NULL AUTO_INCREMENT,
  `role_name` varchar(100) NOT NULL,
  `display_name` varchar(100) NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `department` varchar(100) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `user_roles_role_name_unique` (`role_name`)
);

CREATE TABLE IF NOT EXISTS `user_details` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(150) DEFAULT NULL,
  `username` varchar(150) NOT NULL,
  `password` varchar(255) NOT NULL,
  `mobile` varchar(20) DEFAULT NULL,
  `profile_image_url` text,
  `role_id` int DEFAULT NULL,
  `is_active` boolean DEFAULT true,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `user_details_username_unique` (`username`),
  UNIQUE KEY `user_details_mobile_unique` (`mobile`)
);

CREATE TABLE IF NOT EXISTS `hyperlocal_categories` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  PRIMARY KEY (`id`)
);

CREATE TABLE IF NOT EXISTS `hyperlocal_news` (
  `id` int NOT NULL AUTO_INCREMENT,
  `title` varchar(255) NOT NULL,
  `content` text,
  `image_url` text,
  `article_url` text,
  `latitude` decimal(10,7) NOT NULL,
  `longitude` decimal(10,7) NOT NULL,
  `category_id` int DEFAULT NULL,
  `created_by` int NOT NULL,
  `delete_after_hours` int DEFAULT 24,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_hyperlocal_news_coords` (`latitude`, `longitude`),
  KEY `idx_hyperlocal_news_created_by` (`created_by`)
);

CREATE TABLE IF NOT EXISTS `classified_ads` (
  `id` int NOT NULL AUTO_INCREMENT,
  `title` varchar(255) NOT NULL,
  `description` text,
  `ad_type` varchar(50) DEFAULT NULL,
  `price` decimal(12,2) DEFAULT NULL,
  `type` varchar(50) DEFAULT NULL,
  `images` text,
  `contact_info` varchar(255) DEFAULT NULL,
  `latitude` decimal(10,7) NOT NULL,
  `longitude` decimal(10,7) NOT NULL,
  `category_id` int DEFAULT NULL,
  `created_by` int NOT NULL,
  `delete_after_hours` int DEFAULT 24,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_classified_ads_coords` (`latitude`, `longitude`),
  KEY `idx_classified_ads_created_by` (`created_by`)
);

CREATE TABLE IF NOT EXISTS `obituaries` (
  `id` int NOT NULL AUTO_INCREMENT,
  `person_name` varchar(255) NOT NULL,
  `age` int DEFAULT NULL,
  `date_of_death` date NOT NULL,
  `image_url` text,
  `latitude` decimal(10,7) NOT NULL,
  `longitude` decimal(10,7) NOT NULL,
  `category_id` int DEFAULT NULL,
  `created_by` int NOT NULL,
  `delete_after_hours` int DEFAULT 48,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_obituaries_coords` (`latitude`, `longitude`),
  KEY `idx_obituaries_created_by` (`created_by`)
);

CREATE TABLE IF NOT EXISTS `map_news_categories` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  PRIMARY KEY (`id`)
);

CREATE TABLE IF NOT EXISTS `map_news` (
  `id` int NOT NULL AUTO_INCREMENT,
  `title` varchar(255) NOT NULL,
  `summary` text,
  `image_url` text,
  `article_url` text,
  `source_name` varchar(255) DEFAULT NULL,
  `latitude` decimal(10,7) DEFAULT NULL,
  `longitude` decimal(10,7) DEFAULT NULL,
  `category_id` int DEFAULT NULL,
  `language_id` int DEFAULT NULL,
  `is_breaking` boolean DEFAULT false,
  `breaking_expire_at` timestamp NULL DEFAULT NULL,
  `is_high_priority` boolean DEFAULT false,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_map_news_coords` (`latitude`, `longitude`),
  KEY `idx_map_news_created_at` (`created_at`),
  CONSTRAINT `map_news_category_id_map_news_categories_id_fk`
    FOREIGN KEY (`category_id`) REFERENCES `map_news_categories` (`id`),
  CONSTRAINT `map_news_language_id_languages_id_fk`
    FOREIGN KEY (`language_id`) REFERENCES `languages` (`id`)
);

CREATE TABLE IF NOT EXISTS `map_news_views` (
  `id` int NOT NULL AUTO_INCREMENT,
  `news_id` int NOT NULL,
  `ip_address` varchar(45) NOT NULL,
  `viewed_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_map_news_views_news_ip` (`news_id`, `ip_address`),
  CONSTRAINT `map_news_views_news_id_map_news_id_fk`
    FOREIGN KEY (`news_id`) REFERENCES `map_news` (`id`) ON DELETE CASCADE
);
