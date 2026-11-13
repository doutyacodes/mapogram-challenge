-- Challenge pages on the Communities map (Kerala / Karnataka / Tamil Nadu tourism,
-- and the tourism, company, brand and celebrity pages) are stored in the existing
-- pages -> districts -> challenges tables. These columns hold what the map cards show.
--
--   category  which map button the item sits under. Older rows keep NULL and the
--             app derives it from frequency / exp_type as before.
--   logo_url  small logo shown on the detail panel.
--   details   card extras: {"tags": [], "price", "food_name", "rating",
--             "duration", "event_date", "hours"}
--
-- Additive only. scripts/seed_challenge_pages.mjs applies the same change
-- automatically when the columns are missing, so running this by hand is optional.

ALTER TABLE `challenges`
  ADD COLUMN `category` ENUM('Challenges','Places','Food','Activity','Events') NULL DEFAULT NULL AFTER `description`,
  ADD COLUMN `logo_url` VARCHAR(255) NULL DEFAULT NULL AFTER `category`,
  ADD COLUMN `details` JSON NULL DEFAULT NULL AFTER `logo_url`;

-- Page types for challenge pages. category = 'challenge_page' is what puts a page
-- in the Communities switcher. "State Tourism" pages show "<Name> Tourism" in the
-- header; the others show "<Type> Page".
INSERT INTO `page_types` (`name`, `description`, `category`)
SELECT * FROM (
  SELECT 'State Tourism' AS name, 'State tourism challenge map' AS description, 'challenge_page' AS category UNION ALL
  SELECT 'Tourism', 'Tourism challenge page', 'challenge_page' UNION ALL
  SELECT 'Company', 'Company challenge page', 'challenge_page' UNION ALL
  SELECT 'Brand', 'Brand challenge page', 'challenge_page' UNION ALL
  SELECT 'Celebrity', 'Celebrity challenge page', 'challenge_page'
) AS t
WHERE NOT EXISTS (SELECT 1 FROM `page_types` pt WHERE pt.name = t.name);
