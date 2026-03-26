-- phpMyAdmin SQL Dump
-- version 5.2.2
-- https://www.phpmyadmin.net/
--
-- Host: localhost:3306
-- Generation Time: Mar 26, 2026 at 12:13 AM
-- Server version: 8.0.45
-- PHP Version: 8.4.18

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `devuser_mapogram_challenges`
--

-- --------------------------------------------------------

--
-- Table structure for table `challenges`
--

CREATE TABLE `challenges` (
  `id` int NOT NULL,
  `district_id` int DEFAULT NULL,
  `page_id` int NOT NULL,
  `title` varchar(255) NOT NULL,
  `description` text NOT NULL,
  `challenge_type` enum('ordered','unordered') DEFAULT 'unordered',
  `frequency` enum('daily','weekly','once','quiz','bootcamp','contest','treasure','food','experience','event') DEFAULT 'once',
  `start_date` datetime DEFAULT NULL,
  `end_date` datetime DEFAULT NULL,
  `entry_points` int DEFAULT '0',
  `reward_points` int DEFAULT '0',
  `level_required` int DEFAULT '1',
  `exp_type` enum('biriyani','arts','breakfast','entertainment') DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT '1',
  `participants_count` int DEFAULT '0',
  `location_restricted` tinyint(1) DEFAULT '0',
  `latitude` decimal(10,7) DEFAULT NULL,
  `longitude` decimal(10,7) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `challenges`
--

INSERT INTO `challenges` (`id`, `district_id`, `page_id`, `title`, `description`, `challenge_type`, `frequency`, `start_date`, `end_date`, `entry_points`, `reward_points`, `level_required`, `exp_type`, `is_active`, `participants_count`, `location_restricted`, `latitude`, `longitude`, `created_at`) VALUES
(10001, NULL, 10001, 'Test challenge', 'Test challengeTest challengeTest challengeTest challenge', 'ordered', 'once', '2025-04-17 18:30:00', '2025-03-30 18:30:00', 100, 100, 1, 'biriyani', 1, 0, 0, NULL, NULL, '2026-03-24 21:28:03'),
(10002, NULL, 10001, 'New Challenge', 'New Challenge New Challenge', 'ordered', 'once', '2025-02-28 18:30:00', '2025-03-30 18:30:00', 10, 10, 1, 'biriyani', 1, 0, 0, NULL, NULL, '2026-03-24 21:28:03');

-- --------------------------------------------------------

--
-- Table structure for table `challenge_media`
--

CREATE TABLE `challenge_media` (
  `id` int NOT NULL,
  `challenge_id` int NOT NULL,
  `media_type` enum('image','video') NOT NULL,
  `media_url` varchar(255) NOT NULL,
  `display_order` int DEFAULT '0'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `challenge_media`
--

INSERT INTO `challenge_media` (`id`, `challenge_id`, `media_type`, `media_url`, `display_order`) VALUES
(1, 10001, 'image', 'https://wowfy.in/wowfy_app_codebase/photos/file_67c1a672d8fd56.75835570.jpg', 0),
(2, 10002, 'image', 'https://wowfy.in/wowfy_app_codebase/photos/file_67c1afebf37194.78210612.jpg', 0);

-- --------------------------------------------------------

--
-- Table structure for table `challenge_stores`
--

CREATE TABLE `challenge_stores` (
  `id` int NOT NULL,
  `challenge_id` int NOT NULL,
  `store_id` int NOT NULL,
  `is_active` tinyint(1) DEFAULT '1'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Table structure for table `tasks`
--

CREATE TABLE `tasks` (
  `id` int NOT NULL,
  `challenge_id` int NOT NULL,
  `title` varchar(255) NOT NULL,
  `description` text NOT NULL,
  `task_type` enum('quiz','media_upload','location_checkin','pedometer','external_link') NOT NULL,
  `verification_method` varchar(50) DEFAULT NULL,
  `reward_points` int DEFAULT '0',
  `reward_xp` int DEFAULT '0',
  `order_index` int DEFAULT '0',
  `is_active` tinyint(1) DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `tasks`
--

INSERT INTO `tasks` (`id`, `challenge_id`, `title`, `description`, `task_type`, `verification_method`, `reward_points`, `reward_xp`, `order_index`, `is_active`, `created_at`) VALUES
(10002, 10002, 'New Challenge', 'New Task Task', 'pedometer', 'auto', 10, 10, 5, 1, '2026-03-24 21:28:03'),
(10003, 10002, 'New Challenge 2', 'New Challenge 2', 'media_upload', 'auto', 10, 10, 10, 1, '2026-03-24 21:28:03'),
(10004, 10002, 'New Challenge 3', 'New Challenge 3', 'media_upload', 'auto', 10, 10, 100, 1, '2026-03-24 21:28:03'),
(10005, 10002, 'New Challenge 4', 'New Challenge 4', 'quiz', 'auto', 100, 10, 100, 1, '2026-03-24 21:28:03'),
(10006, 10002, 'New Challenge 5', 'New Challenge 5', 'location_checkin', 'auto', 10, 10, 100, 1, '2026-03-24 21:28:03');

-- --------------------------------------------------------

--
-- Table structure for table `task_map`
--

CREATE TABLE `task_map` (
  `id` int NOT NULL,
  `task_id` int NOT NULL,
  `challenge_id` int NOT NULL,
  `reach_distance_meters` float DEFAULT '100',
  `latitude` decimal(10,7) DEFAULT NULL,
  `longitude` decimal(10,7) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `task_map`
--

INSERT INTO `task_map` (`id`, `task_id`, `challenge_id`, `reach_distance_meters`, `latitude`, `longitude`) VALUES
(1, 10006, 10002, 100, 9.5869364, 76.4948362);

-- --------------------------------------------------------

--
-- Table structure for table `task_media`
--

CREATE TABLE `task_media` (
  `id` int NOT NULL,
  `task_id` int NOT NULL,
  `media_type` enum('image','video') NOT NULL,
  `media_url` varchar(255) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `task_media`
--

INSERT INTO `task_media` (`id`, `task_id`, `media_type`, `media_url`) VALUES
(1, 10002, 'image', 'https://wowfy.in/wowfy_app_codebase/photos/file_67c1a672d8fd56.75835570.jpg'),
(2, 10003, 'image', 'https://wowfy.in/wowfy_app_codebase/photos/file_67c1a672d8fd56.75835570.jpg'),
(3, 10004, 'image', 'https://wowfy.in/wowfy_app_codebase/photos/file_67c1a672d8fd56.75835570.jpg'),
(4, 10005, 'image', 'https://wowfy.in/wowfy_app_codebase/photos/file_67c1a672d8fd56.75835570.jpg'),
(5, 10006, 'image', 'https://wowfy.in/wowfy_app_codebase/photos/file_67c1a672d8fd56.75835570.jpg');

-- --------------------------------------------------------

--
-- Table structure for table `task_pedometer`
--

CREATE TABLE `task_pedometer` (
  `id` int NOT NULL,
  `task_id` int NOT NULL,
  `steps_goal` int NOT NULL,
  `direction` varchar(100) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `task_pedometer`
--

INSERT INTO `task_pedometer` (`id`, `task_id`, `steps_goal`, `direction`) VALUES
(1, 10002, 100, 'any');

-- --------------------------------------------------------

--
-- Table structure for table `task_relations`
--

CREATE TABLE `task_relations` (
  `id` int NOT NULL,
  `challenge_id` int NOT NULL,
  `task_id` int NOT NULL,
  `order_id` int NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `task_relations`
--

INSERT INTO `task_relations` (`id`, `challenge_id`, `task_id`, `order_id`) VALUES
(1, 10002, 10002, 1),
(2, 10002, 10003, 2),
(3, 10002, 10004, 3),
(4, 10002, 10005, 4),
(5, 10002, 10006, 5);

--
-- Indexes for dumped tables
--

--
-- Indexes for table `challenges`
--
ALTER TABLE `challenges`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_challenges_district` (`district_id`),
  ADD KEY `fk_challenges_page` (`page_id`);

--
-- Indexes for table `challenge_media`
--
ALTER TABLE `challenge_media`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_challenge_media_challenge` (`challenge_id`);

--
-- Indexes for table `challenge_stores`
--
ALTER TABLE `challenge_stores`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_challenge_stores_challenge` (`challenge_id`),
  ADD KEY `fk_challenge_stores_store` (`store_id`);

--
-- Indexes for table `tasks`
--
ALTER TABLE `tasks`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_tasks_challenge` (`challenge_id`);

--
-- Indexes for table `task_map`
--
ALTER TABLE `task_map`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_task_map_task` (`task_id`),
  ADD KEY `fk_task_map_challenge` (`challenge_id`);

--
-- Indexes for table `task_media`
--
ALTER TABLE `task_media`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_task_media_task` (`task_id`);

--
-- Indexes for table `task_pedometer`
--
ALTER TABLE `task_pedometer`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_task_pedometer_task` (`task_id`);

--
-- Indexes for table `task_relations`
--
ALTER TABLE `task_relations`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_task_relations_challenge` (`challenge_id`),
  ADD KEY `fk_task_relations_task` (`task_id`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `challenges`
--
ALTER TABLE `challenges`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=10003;

--
-- AUTO_INCREMENT for table `challenge_media`
--
ALTER TABLE `challenge_media`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `challenge_stores`
--
ALTER TABLE `challenge_stores`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `tasks`
--
ALTER TABLE `tasks`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=10007;

--
-- AUTO_INCREMENT for table `task_map`
--
ALTER TABLE `task_map`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `task_media`
--
ALTER TABLE `task_media`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT for table `task_pedometer`
--
ALTER TABLE `task_pedometer`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `task_relations`
--
ALTER TABLE `task_relations`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `challenges`
--
ALTER TABLE `challenges`
  ADD CONSTRAINT `fk_challenges_district` FOREIGN KEY (`district_id`) REFERENCES `districts` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_challenges_page` FOREIGN KEY (`page_id`) REFERENCES `pages` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `challenge_media`
--
ALTER TABLE `challenge_media`
  ADD CONSTRAINT `fk_challenge_media_challenge` FOREIGN KEY (`challenge_id`) REFERENCES `challenges` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `challenge_stores`
--
ALTER TABLE `challenge_stores`
  ADD CONSTRAINT `fk_challenge_stores_challenge` FOREIGN KEY (`challenge_id`) REFERENCES `challenges` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_challenge_stores_store` FOREIGN KEY (`store_id`) REFERENCES `stores` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `tasks`
--
ALTER TABLE `tasks`
  ADD CONSTRAINT `fk_tasks_challenge` FOREIGN KEY (`challenge_id`) REFERENCES `challenges` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `task_map`
--
ALTER TABLE `task_map`
  ADD CONSTRAINT `fk_task_map_challenge` FOREIGN KEY (`challenge_id`) REFERENCES `challenges` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_task_map_task` FOREIGN KEY (`task_id`) REFERENCES `tasks` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `task_media`
--
ALTER TABLE `task_media`
  ADD CONSTRAINT `fk_task_media_task` FOREIGN KEY (`task_id`) REFERENCES `tasks` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `task_pedometer`
--
ALTER TABLE `task_pedometer`
  ADD CONSTRAINT `fk_task_pedometer_task` FOREIGN KEY (`task_id`) REFERENCES `tasks` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `task_relations`
--
ALTER TABLE `task_relations`
  ADD CONSTRAINT `fk_task_relations_challenge` FOREIGN KEY (`challenge_id`) REFERENCES `challenges` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_task_relations_task` FOREIGN KEY (`task_id`) REFERENCES `tasks` (`id`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
