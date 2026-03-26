-- phpMyAdmin SQL Dump
-- version 5.2.2
-- https://www.phpmyadmin.net/
--
-- Host: localhost:3306
-- Generation Time: Mar 24, 2026 at 07:15 PM
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
-- Database: `devuser_wowfy`
--

-- --------------------------------------------------------

--
-- Table structure for table `answers`
--

CREATE TABLE `answers` (
  `id` int NOT NULL,
  `question_id` int NOT NULL,
  `answer_text` text NOT NULL,
  `answer` enum('no','yes') NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `answers`
--

INSERT INTO `answers` (`id`, `question_id`, `answer_text`, `answer`) VALUES
(5, 2, 'a', 'yes'),
(6, 2, 'b', 'no'),
(7, 2, 'c', 'no'),
(8, 2, 'd', 'no'),
(9, 3, 'a', 'yes'),
(10, 3, 'b', 'no'),
(11, 3, 'c', 'no'),
(12, 3, 'd', 'no'),
(13, 4, 'a', 'yes'),
(14, 4, 'b', 'no'),
(15, 4, 'c', 'no'),
(16, 4, 'd', 'no');

-- --------------------------------------------------------

--
-- Table structure for table `certificates`
--

CREATE TABLE `certificates` (
  `id` int NOT NULL,
  `challenge_id` int NOT NULL,
  `user_id` int NOT NULL,
  `page_id` int NOT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `end_date` datetime NOT NULL,
  `rank` int NOT NULL DEFAULT '0',
  `people_data_id` int NOT NULL,
  `task_id` int NOT NULL,
  `status` enum('inactive','active') NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Table structure for table `challenges`
--

CREATE TABLE `challenges` (
  `challenge_id` int NOT NULL,
  `page_id` int NOT NULL,
  `title` varchar(100) NOT NULL,
  `description` text NOT NULL,
  `challenge_type` enum('ordered','unordered') CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `frequency` enum('challenges','daily','bootcamp','contest','treasure','referral','streak','refer','quiz','food','experience') CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `start_date` datetime NOT NULL,
  `start_time` time NOT NULL,
  `end_date` datetime NOT NULL,
  `end_time` time NOT NULL,
  `entry_points` int NOT NULL,
  `reward_points` int NOT NULL,
  `level` int NOT NULL DEFAULT '1',
  `created_by` varchar(100) NOT NULL,
  `created_date` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `participants_count` int NOT NULL DEFAULT '0',
  `removed_date` datetime DEFAULT NULL,
  `removed_by` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  `arena` enum('no','yes') NOT NULL,
  `district_id` int DEFAULT NULL,
  `visit` enum('no','yes') NOT NULL,
  `active` enum('no','yes') NOT NULL,
  `days` int NOT NULL DEFAULT '0',
  `referral_count` int NOT NULL DEFAULT '0',
  `open_for` enum('everyone','location','specific') CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `like_based` enum('no','yes') NOT NULL,
  `live` enum('no','yes') NOT NULL,
  `questions` int NOT NULL DEFAULT '0',
  `exp_type` enum('biriyani','arts','breakfast','entertainment') CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `rewards` enum('no','yes') NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `challenges`
--

INSERT INTO `challenges` (`challenge_id`, `page_id`, `title`, `description`, `challenge_type`, `frequency`, `start_date`, `start_time`, `end_date`, `end_time`, `entry_points`, `reward_points`, `level`, `created_by`, `created_date`, `participants_count`, `removed_date`, `removed_by`, `arena`, `district_id`, `visit`, `active`, `days`, `referral_count`, `open_for`, `like_based`, `live`, `questions`, `exp_type`, `rewards`) VALUES
(1, 1, 'Test challenge', 'VGVzdCBjaGFsbGVuZ2VUZXN0IGNoYWxsZW5nZVRlc3QgY2hhbGxlbmdlVGVzdCBjaGFsbGVuZ2U=', 'ordered', 'challenges', '2025-04-17 18:30:00', '12:00:00', '2025-03-30 18:30:00', '23:59:59', 100, 100, 1, 'Admin', '2025-02-28 12:05:09', 0, NULL, NULL, 'no', NULL, 'no', 'no', 0, 0, 'everyone', 'no', 'no', 0, 'biriyani', 'no'),
(2, 1, 'New Challenge', 'TmV3IENoYWxsZW5nZSBOZXcgQ2hhbGxlbmdl', 'ordered', 'challenges', '2025-02-28 18:30:00', '12:00:00', '2025-03-30 18:30:00', '23:59:59', 10, 10, 1, 'Admin', '2025-02-28 12:45:38', 0, NULL, NULL, 'no', NULL, 'no', 'yes', 0, 0, 'everyone', 'no', 'no', 0, 'biriyani', 'no');

-- --------------------------------------------------------

--
-- Table structure for table `challengeStore`
--

CREATE TABLE `challengeStore` (
  `id` int NOT NULL,
  `store_id` int NOT NULL,
  `challenge_id` int NOT NULL,
  `page_id` int NOT NULL,
  `opened` enum('yes','no') NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Table structure for table `challenge_media`
--

CREATE TABLE `challenge_media` (
  `media_id` int NOT NULL,
  `challenge_id` int NOT NULL,
  `media_type` enum('photo','video') CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `media_path` varchar(250) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `challenge_media`
--

INSERT INTO `challenge_media` (`media_id`, `challenge_id`, `media_type`, `media_path`) VALUES
(1, 1, 'photo', 'file_67c1a672d8fd56.75835570.jpg'),
(2, 2, 'photo', 'file_67c1afebf37194.78210612.jpg');

-- --------------------------------------------------------

--
-- Table structure for table `districts`
--

CREATE TABLE `districts` (
  `district_id` int NOT NULL,
  `page_id` int NOT NULL,
  `title` varchar(100) NOT NULL,
  `description` text NOT NULL,
  `image` varchar(150) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `districts`
--

INSERT INTO `districts` (`district_id`, `page_id`, `title`, `description`, `image`) VALUES
(1, 1, 'Thiruvananthapuram', 'VGhpcnV2YW5hbnRoYXB1cmFtIGlzIHRoZSBjYXBpdGFsIGNpdHkgb2YgS2VyYWxhLCBrbm93biBm\nb3IgaXRzIGNvbG9uaWFsIGFyY2hpdGVjdHVyZSwgYmVhdXRpZnVsIGJlYWNoZXMsIGFuZCByaWNo\nIGN1bHR1cmFsIGhlcml0YWdlLg==', 'icon-kerala.jpg'),
(2, 1, 'Kochi', 'S29jaGksIGFsc28ga25vd24gYXMgQ29jaGluLCBpcyBhIHZpYnJhbnQgcG9ydCBjaXR5IGluIEtl\ncmFsYSBmYW1vdXMgZm9yIGl0cyBidXN0bGluZyBtYXJrZXRzLCBoaXN0b3JpYyBzaXRlcywgYW5k\nIHNjZW5pYyBiYWNrd2F0ZXJzLg==', 'icon-kerala.jpg'),
(3, 1, 'Kozhikode', 'S296aGlrb2RlLCBmb3JtZXJseSBrbm93biBhcyBDYWxpY3V0LCBpcyBhIGNvYXN0YWwgY2l0eSBp\nbiBLZXJhbGEgcmVub3duZWQgZm9yIGl0cyB0cmFkZSBoaXN0b3J5LCBwcmlzdGluZSBiZWFjaGVz\nLCBhbmQgZGVsZWN0YWJsZSBjdWlzaW5lLg==', 'icon-kerala.jpg'),
(4, 1, 'Thrissur', 'VGhyaXNzdXIsIGtub3duIGFzIHRoZSBjdWx0dXJhbCBjYXBpdGFsIG9mIEtlcmFsYSwgaXMgZmFt\nb3VzIGZvciBpdHMgZmVzdGl2YWxzLCB0ZW1wbGVzLCBhbmQgY3VsdHVyYWwgaGVyaXRhZ2Ugc2l0\nZXMgc3VjaCBhcyB0aGUgVmFkYWtrdW5uYXRoYW4gVGVtcGxlIGFuZCBUaHJpc3N1ciBQb29yYW0u', 'icon-kerala.jpg'),
(5, 1, 'Kollam', 'S29sbGFtLCBzaXR1YXRlZCBvbiB0aGUgYmFua3Mgb2YgdGhlIEFzaHRhbXVkaSBMYWtlLCBpcyBr\nbm93biBmb3IgaXRzIGhpc3RvcmljIHBvcnRzLCBjYXNoZXcgaW5kdXN0cnksIGFuZCBwaWN0dXJl\nc3F1ZSBiYWNrd2F0ZXIgY3J1aXNlcy4=', 'icon-kerala.jpg'),
(6, 1, 'Alappuzha', 'QWxhcHB1emhhLCBhbHNvIGtub3duIGFzIEFsbGVwcGV5LCBpcyBmYW1vdXMgZm9yIGl0cyBzZXJl\nbmUgYmFja3dhdGVycywgaG91c2Vib2F0IGNydWlzZXMsIGFuZCBhbm51YWwgTmVocnUgVHJvcGh5\nIEJvYXQgUmFjZS4=', 'icon-kerala.jpg'),
(7, 1, 'Kannur', 'S2FubnVyLCBsb2NhdGVkIG9uIHRoZSBNYWxhYmFyIENvYXN0LCBpcyByZW5vd25lZCBmb3IgaXRz\nIHByaXN0aW5lIGJlYWNoZXMsIFRoZXl5YW0gcml0dWFscywgYW5kIGhhbmRsb29tIGluZHVzdHJ5\nLCBlc3BlY2lhbGx5IGtub3duIGZvciBLYW5udXIgY290dG9uLg==', 'icon-kerala.jpg'),
(8, 1, 'Kottayam', 'S290dGF5YW0sIGtub3duIGFzIHRoZSBsYW5kIG9mIGxldHRlcnMsIGxhdGV4LCBhbmQgbGFrZXMs\nIGlzIGZhbW91cyBmb3IgaXRzIHJ1YmJlciBwbGFudGF0aW9ucywgYW5jaWVudCBjaHVyY2hlcywg\nYW5kIHRoZSBiYWNrd2F0ZXIgdG93biBvZiBLdW1hcmFrb20u', 'icon-kerala.jpg'),
(9, 1, 'Palakkad', 'UGFsYWtrYWQsIGJvcmRlcmVkIGJ5IHRoZSBXZXN0ZXJuIEdoYXRzLCBpcyBrbm93biBmb3IgaXRz\nIGx1c2ggZ3JlZW4gbGFuZHNjYXBlcywgaGlzdG9yaWNhbCBmb3J0cywgYW5kIFBhbGFra2FkIEdh\ncCwgYSBuYXR1cmFsIG1vdW50YWluIHBhc3MgY29ubmVjdGluZyBLZXJhbGEgdG8gVGFtaWwgTmFk\ndS4=', 'icon-kerala.jpg'),
(10, 1, 'Malappuram', 'TWFsYXBwdXJhbSwgc2l0dWF0ZWQgb24gdGhlIE1hbGFiYXIgQ29hc3QsIGlzIGtub3duIGZvciBp\ndHMgcmljaCBjdWx0dXJhbCBoZXJpdGFnZSwgbW9zcXVlcywgYW5kIGVkdWNhdGlvbmFsIGluc3Rp\ndHV0aW9ucy4=', 'icon-kerala.jpg'),
(11, 1, 'Pathanamthitta', 'UGF0aGFuYW10aGl0dGEsIGtub3duIGFzIHRoZSBoZWFkcXVhcnRlcnMgb2YgcGlsZ3JpbWFnZSB0\nb3VyaXNtIGluIEtlcmFsYSwgaXMgZmFtb3VzIGZvciB0aGUgU2FiYXJpbWFsYSB0ZW1wbGUgYW5k\nIGl0cyBzdXJyb3VuZGluZyBuYXR1cmFsIGJlYXV0eS4=', 'icon-kerala.jpg'),
(12, 1, 'Idukki', 'SWR1a2tpLCBjaGFyYWN0ZXJpemVkIGJ5IGl0cyBydWdnZWQgdGVycmFpbiwgd2lsZGxpZmUgc2Fu\nY3R1YXJpZXMsIGFuZCBoaWxsIHN0YXRpb25zIGxpa2UgTXVubmFyIGFuZCBWYWdhbW9uLCBpcyBr\nbm93biBmb3IgaXRzIHRlYSwgY29mZmVlLCBhbmQgc3BpY2UgcGxhbnRhdGlvbnMu', 'icon-kerala.jpg'),
(13, 1, 'Wayanad', 'V2F5YW5hZCwgbG9jYXRlZCBpbiB0aGUgV2VzdGVybiBHaGF0cywgaXMga25vd24gZm9yIGl0cyBs\ndXNoIGdyZWVuZXJ5LCB3aWxkbGlmZSByZXNlcnZlcyBsaWtlIFdheWFuYWQgV2lsZGxpZmUgU2Fu\nY3R1YXJ5LCBhbmQgaW5kaWdlbm91cyB0cmliYWwgY3VsdHVyZS4=', 'icon-kerala.jpg'),
(14, 1, 'Ernakulam', 'RXJuYWt1bGFtLCBhbHNvIGtub3duIGFzIENvY2hpbiwgaXMgdGhlIGNvbW1lcmNpYWwgaHViIG9m\nIEtlcmFsYSwgZmFtb3VzIGZvciBpdHMgYnVzdGxpbmcgbWFya2V0cywgY29zbW9wb2xpdGFuIGN1\nbHR1cmUsIGFuZCBoaXN0b3JpY2FsIGxhbmRtYXJrcyBsaWtlIEZvcnQgS29jaGkgYW5kIE1hdHRh\nbmNoZXJyeSBQYWxhY2Uu', 'icon-kerala.jpg'),
(15, 2, 'Bagalkot', 'QmFnYWxrb3QgaXMgYSBkaXN0cmljdCBpbiBLYXJuYXRha2Ega25vd24gZm9yIGl0cyBoaXN0b3Jp\nY2FsIHNpdGVzLCBpbmNsdWRpbmcgdGhlIEJhZGFtaSBDYXZlIFRlbXBsZXMsIEFpaG9sZSwgYW5k\nIFBhdHRhZGFrYWwsIGNvbGxlY3RpdmVseSByZWNvZ25pemVkIGFzIFVORVNDTyBXb3JsZCBIZXJp\ndGFnZSBTaXRlcy4=', 'icon-karnataka.jpg'),
(16, 2, 'Ballari', 'QmFsbGFyaSwgb2ZmaWNpYWxseSBrbm93biBhcyBCZWxsYXJ5LCBpcyBhIGRpc3RyaWN0IGluIEth\ncm5hdGFrYSBrbm93biBmb3IgaXRzIHJpY2ggbWluZXJhbCBkZXBvc2l0cywgaGlzdG9yaWNhbCBt\nb251bWVudHMgbGlrZSB0aGUgQmVsbGFyeSBGb3J0LCBhbmQgcmVsaWdpb3VzIHNpdGVzIGxpa2Ug\ndGhlIFZpcnVwYWtzaGEgVGVtcGxlIGluIEhhbXBpLg==', 'icon-karnataka.jpg'),
(17, 2, 'Belagavi', 'QmVsYWdhdmksIGZvcm1lcmx5IGtub3duIGFzIEJlbGdhdW0sIGlzIGEgZGlzdHJpY3QgaW4gS2Fy\nbmF0YWthIGtub3duIGZvciBpdHMgaGlzdG9yaWNhbCBzaXRlcywgdGVtcGxlcywgYW5kIGl0cyBy\nb2xlIGFzIGEgbWVsdGluZyBwb3Qgb2YgTWFyYXRoaSBhbmQgS2FubmFkYSBjdWx0dXJlcy4=', 'icon-karnataka.jpg'),
(18, 2, 'Bengaluru Rural', 'QmVuZ2FsdXJ1IFJ1cmFsIGlzIGEgZGlzdHJpY3QgaW4gS2FybmF0YWthIHN1cnJvdW5kaW5nIHRo\nZSB1cmJhbiBhcmVhIG9mIEJlbmdhbHVydSwga25vd24gZm9yIGl0cyBhZ3JpY3VsdHVyYWwgYWN0\naXZpdGllcywgaW5kdXN0cmlhbCB6b25lcywgYW5kIG5hdHVyYWwgbGFuZHNjYXBlcy4=', 'icon-karnataka.jpg'),
(19, 2, 'Bengaluru Urban', 'QmVuZ2FsdXJ1IFVyYmFuIGlzIHRoZSB1cmJhbiBjb3JlIG9mIEthcm5hdGFrYSwgZW5jb21wYXNz\naW5nIHRoZSBjaXR5IG9mIEJlbmdhbHVydSwga25vd24gYXMgdGhlIFNpbGljb24gVmFsbGV5IG9m\nIEluZGlhIGFuZCBmYW1vdXMgZm9yIGl0cyBJVCBpbmR1c3RyeSwgdmlicmFudCBjdWx0dXJlLCBh\nbmQgcGxlYXNhbnQgY2xpbWF0ZS4=', 'icon-karnataka.jpg'),
(20, 2, 'Bidar', 'QmlkYXIgaXMgYSBoaXN0b3JpY2FsIGRpc3RyaWN0IGluIEthcm5hdGFrYSBrbm93biBmb3IgaXRz\nIHJpY2ggaGVyaXRhZ2UsIGluY2x1ZGluZyB0aGUgQmlkYXIgRm9ydCwgQmFobWFuaSBUb21icywg\nYW5kIHJlbGlnaW91cyBzaXRlcyBsaWtlIHRoZSBHdXJ1IE5hbmFrIEpoaXJhIFNhaGliIEd1cnVk\nd2FyYS4=', 'icon-karnataka.jpg'),
(21, 2, 'Chamarajanagar', 'Q2hhbWFyYWphbmFnYXIgaXMgYSBkaXN0cmljdCBpbiBLYXJuYXRha2Ega25vd24gZm9yIGl0cyBu\nYXR1cmFsIGJlYXV0eSwgd2lsZGxpZmUgc2FuY3R1YXJpZXMgbGlrZSB0aGUgQmlsaWdpcmlyYW5n\nYSBIaWxscyBhbmQgQ2F1dmVyeSBXaWxkbGlmZSBTYW5jdHVhcnksIGFuZCByZWxpZ2lvdXMgc2l0\nZXMgbGlrZSB0aGUgTWFsZSBNYWhhZGVzaHdhcmEgVGVtcGxlLg==', 'icon-karnataka.jpg'),
(22, 2, 'Chikballapur', 'Q2hpa2JhbGxhcHVyIGlzIGEgZGlzdHJpY3QgaW4gS2FybmF0YWthIGtub3duIGZvciBpdHMgcGlj\ndHVyZXNxdWUgbGFuZHNjYXBlcywgaGlsbHMsIGFuZCBoaXN0b3JpY2FsIHNpdGVzIGxpa2UgTmFu\nZGkgSGlsbHMsIEJob2dhIE5hbmRlZXNod2FyYSBUZW1wbGUsIGFuZCB0aGUgYmlydGhwbGFjZSBv\nZiBTaXIgTS4gVmlzdmVzdmFyYXlhIGluIE11ZGRlbmFoYWxsaS4=', 'icon-karnataka.jpg'),
(23, 2, 'Chikkamagaluru', 'Q2hpa2thbWFnYWx1cnUsIGFsc28ga25vd24gYXMgQ2hpa21hZ2FsdXIsIGlzIGEgZGlzdHJpY3Qg\naW4gS2FybmF0YWthIGZhbW91cyBmb3IgaXRzIGNvZmZlZSBwbGFudGF0aW9ucywgc2NlbmljIGhp\nbGwgc3RhdGlvbnMgbGlrZSBLZW1tYW5ndW5kaSBhbmQgTXVsbGF5YW5hZ2lyaSwgYW5kIHJlbGln\naW91cyBzaXRlcyBsaWtlIFNyaW5nZXJpIFNoYXJhZGEgUGVldGhhbS4=', 'icon-karnataka.jpg'),
(24, 2, 'Chitradurga', 'Q2hpdHJhZHVyZ2EgaXMgYSBkaXN0cmljdCBpbiBLYXJuYXRha2Ega25vd24gZm9yIGl0cyBoaXN0\nb3JpY2FsIGZvcnQsIENoaXRyYWR1cmdhIEZvcnQsIHdoaWNoIGlzIHBlcmNoZWQgYXRvcCBhIGhp\nbGwgYW5kIG9mZmVycyBwYW5vcmFtaWMgdmlld3Mgb2YgdGhlIHN1cnJvdW5kaW5nIGxhbmRzY2Fw\nZS4=', 'icon-karnataka.jpg'),
(25, 2, 'Dakshina Kannada', 'RGFrc2hpbmEgS2FubmFkYSBpcyBhIGNvYXN0YWwgZGlzdHJpY3QgaW4gS2FybmF0YWthIGtub3du\nIGZvciBpdHMgcHJpc3RpbmUgYmVhY2hlcywgdGVtcGxlIGFyY2hpdGVjdHVyZSwgYW5kIGVkdWNh\ndGlvbmFsIGluc3RpdHV0aW9ucyBsaWtlIE1hbmlwYWwgVW5pdmVyc2l0eSBhbmQgTklUSyBTdXJh\ndGhrYWwu', 'icon-karnataka.jpg'),
(26, 2, 'Davanagere', 'RGF2YW5hZ2VyZSBpcyBhIGRpc3RyaWN0IGluIEthcm5hdGFrYSBrbm93biBmb3IgaXRzIHRleHRp\nbGUgaW5kdXN0cnksIGVkdWNhdGlvbmFsIGluc3RpdHV0aW9ucywgYW5kIGhpc3RvcmljIGxhbmRt\nYXJrcyBsaWtlIHRoZSBTaWRkZXNod2FyYSBUZW1wbGUgYW5kIEFhbmVndW5kaSBKYWluIHRlbXBs\nZSBjb21wbGV4Lg==', 'icon-karnataka.jpg'),
(27, 2, 'Dharwad', 'RGhhcndhZCBpcyBhIGRpc3RyaWN0IGluIEthcm5hdGFrYSBrbm93biBmb3IgaXRzIGVkdWNhdGlv\nbmFsIGluc3RpdHV0aW9ucywgY3VsdHVyYWwgaGVyaXRhZ2UsIGFuZCBoaXN0b3JpYyBzaXRlcyBs\naWtlIHRoZSBLaXR0dXIgRm9ydCBhbmQgRGF0dGF0cmV5YSBUZW1wbGUgaW4gRGhhcndhZCBjaXR5\nLg==', 'icon-karnataka.jpg'),
(28, 2, 'Gadag', 'R2FkYWcgaXMgYSBkaXN0cmljdCBpbiBLYXJuYXRha2Ega25vd24gZm9yIGl0cyBoaXN0b3JpY2Fs\nIHNpdGVzLCBpbmNsdWRpbmcgdGhlIEdhZGFnLUJldGFnZXJpIHRlbXBsZSBjb21wbGV4LCBhcnRp\nc3RpYyBoZXJpdGFnZSwgYW5kIGNvbnRyaWJ1dGlvbnMgdG8gdGhlIEthbm5hZGEgbGl0ZXJhdHVy\nZS4=', 'icon-karnataka.jpg'),
(29, 2, 'Hassan', 'SGFzc2FuIGlzIGEgZGlzdHJpY3QgaW4gS2FybmF0YWthIGtub3duIGFzIHRoZSB0ZW1wbGUgYXJj\naGl0ZWN0dXJlIGNhcGl0YWwsIGZhbW91cyBmb3IgaXRzIEhveXNhbGEgdGVtcGxlcyBsaWtlIHRo\nZSBDaGVubmFrZXNhdmEgVGVtcGxlIGluIEJlbHVyIGFuZCB0aGUgSG95c2FsZXN3YXJhIFRlbXBs\nZSBpbiBIYWxlYmlkdS4=', 'icon-karnataka.jpg'),
(30, 2, 'Haveri', 'SGF2ZXJpIGlzIGEgZGlzdHJpY3QgaW4gS2FybmF0YWthIGtub3duIGZvciBpdHMgYWdyaWN1bHR1\ncmFsIHByb2R1Y3Rpdml0eSwgZWR1Y2F0aW9uYWwgaW5zdGl0dXRpb25zLCBhbmQgaGlzdG9yaWNh\nbCBzaXRlcyBsaWtlIHRoZSBIYXZlcmkgU2lkZGhlc3ZhcmEgVGVtcGxlIGFuZCBBa2tpYWx1ci4=', 'icon-karnataka.jpg'),
(31, 2, 'Kalaburagi', 'S2FsYWJ1cmFnaSwgZm9ybWVybHkga25vd24gYXMgR3VsYmFyZ2EsIGlzIGEgZGlzdHJpY3QgaW4g\nS2FybmF0YWthIHdpdGggYSByaWNoIGhpc3RvcnksIGRpdmVyc2UgY3VsdHVyZSwgYW5kIGFyY2hp\ndGVjdHVyYWwgbWFydmVscyBzdWNoIGFzIHRoZSBHdWxiYXJnYSBGb3J0IGFuZCBKYW1hIE1hc2pp\nZC4=', 'icon-karnataka.jpg'),
(32, 2, 'Kodagu', 'S29kYWd1LCBhbHNvIGtub3duIGFzIENvb3JnLCBpcyBhIGRpc3RyaWN0IGluIEthcm5hdGFrYSBr\nbm93biBmb3IgaXRzIGNvZmZlZSBwbGFudGF0aW9ucywgbWlzdHkgaGlsbHMsIGFuZCBsdXNoIGdy\nZWVuZXJ5LCBtYWtpbmcgaXQgYSBwb3B1bGFyIGRlc3RpbmF0aW9uIGZvciBuYXR1cmUgbG92ZXJz\nIGFuZCBhZHZlbnR1cmUgc2Vla2Vycy4=', 'icon-karnataka.jpg'),
(33, 2, 'Kolar', 'S29sYXIgaXMgYSBkaXN0cmljdCBpbiBLYXJuYXRha2Ega25vd24gZm9yIGl0cyBnb2xkIG1pbmlu\nZyBoaXN0b3J5LCBhbmNpZW50IHRlbXBsZXMgbGlrZSB0aGUgS29sYXJhbW1hIFRlbXBsZSBhbmQg\nU29tZXNod2FyYSBUZW1wbGUsIGFuZCBuYXR1cmFsIGF0dHJhY3Rpb25zIGxpa2UgQW50aGFyYWdh\nbmdlLg==', 'icon-karnataka.jpg'),
(34, 2, 'Koppal', 'S29wcGFsIGlzIGEgZGlzdHJpY3QgaW4gS2FybmF0YWthIGtub3duIGZvciBpdHMgaGlzdG9yaWNh\nbCBzaWduaWZpY2FuY2UsIGluY2x1ZGluZyB0aGUgS29wcGFsIEZvcnQsIE1haGFkZXZhIFRlbXBs\nZSwgYW5kIHRoZSBBbmVndW5kaSBhcmVhLCBiZWxpZXZlZCB0byBiZSB0aGUgbWF0ZXJuYWwgaG9t\nZSBvZiBIYW51bWFuLg==', 'icon-karnataka.jpg'),
(35, 2, 'Mandya', 'TWFuZHlhIGlzIGEgZGlzdHJpY3QgaW4gS2FybmF0YWthIGtub3duIGZvciBpdHMgc3VnYXJjYW5l\nIGN1bHRpdmF0aW9uLCBlZHVjYXRpb25hbCBpbnN0aXR1dGlvbnMsIGFuZCBsYW5kbWFya3MgbGlr\nZSB0aGUgS1JTIERhbSAoS3Jpc2huYSBSYWphIFNhZ2FyYSBEYW0pIGFuZCB0aGUgU3JpcmFuZ2Fw\nYXRuYSBGb3J0Lg==', 'icon-karnataka.jpg'),
(36, 2, 'Mysuru', 'TXlzdXJ1LCBhbHNvIGtub3duIGFzIE15c29yZSwgaXMgYSBkaXN0cmljdCBpbiBLYXJuYXRha2Eg\nZmFtb3VzIGZvciBpdHMgcm95YWwgaGVyaXRhZ2UsIG1hamVzdGljIHBhbGFjZXMsIGFuZCB2aWJy\nYW50IERhc2FyYSBmZXN0aXZhbCBjZWxlYnJhdGlvbnMu', 'icon-karnataka.jpg'),
(37, 2, 'Raichur', 'UmFpY2h1ciBpcyBhIGRpc3RyaWN0IGluIEthcm5hdGFrYSBrbm93biBmb3IgaXRzIGhpc3Rvcmlj\nYWwgc2lnbmlmaWNhbmNlLCBpbmNsdWRpbmcgdGhlIFJhaWNodXIgRm9ydCwgRWsgTWluYXIgS2kg\nTWFzamlkLCBhbmQgdGhlIGFuY2llbnQgdG93biBvZiBNdWRnYWwu', 'icon-karnataka.jpg'),
(38, 2, 'Ramanagara', 'UmFtYW5hZ2FyYSBpcyBhIGRpc3RyaWN0IGluIEthcm5hdGFrYSBrbm93biBmb3IgaXRzIHNpbGsg\naW5kdXN0cnksIHJvY2sgZm9ybWF0aW9ucyBsaWtlIHRoZSBSYW1hZGV2YXJhIEJldHRhIGhpbGws\nIGFuZCBhcyB0aGUgc2V0dGluZyBmb3IgdGhlIGZhbW91cyBCb2xseXdvb2QgbW92aWUgIlNob2xh\neS4i', 'icon-karnataka.jpg'),
(39, 2, 'Shivamogga', 'U2hpdmFtb2dnYSwgYWxzbyBrbm93biBhcyBTaGltb2dhLCBpcyBhIGRpc3RyaWN0IGluIEthcm5h\ndGFrYSBzdXJyb3VuZGVkIGJ5IGx1c2ggZ3JlZW5lcnksIHdhdGVyZmFsbHMsIGFuZCB3aWxkbGlm\nZSBzYW5jdHVhcmllcywgbWFraW5nIGl0IGEgcG9wdWxhciBkZXN0aW5hdGlvbiBmb3IgbmF0dXJl\nIGxvdmVycyBhbmQgYWR2ZW50dXJlIGVudGh1c2lhc3RzLg==', 'icon-karnataka.jpg'),
(40, 2, 'Tumakuru', 'VHVtYWt1cnUsIGxvY2F0ZWQgaW4gdGhlIGhlYXJ0IG9mIEthcm5hdGFrYSwgaXMga25vd24gZm9y\nIGl0cyBhZ3JpY3VsdHVyYWwgc2lnbmlmaWNhbmNlLCBlZHVjYXRpb25hbCBpbnN0aXR1dGlvbnMs\nIGFuZCBoaXN0b3JpY2FsIHNpdGVzIGxpa2UgdGhlIFNpZGRhZ2FuZ2EgTWF0aGEu', 'icon-karnataka.jpg'),
(41, 2, 'Udupi', 'VWR1cGkgaXMgYSBjb2FzdGFsIGRpc3RyaWN0IGluIEthcm5hdGFrYSBrbm93biBmb3IgaXRzIEty\naXNobmEgVGVtcGxlLCBjdWlzaW5lIGNlbnRlcmVkIGFyb3VuZCBVZHVwaSByZXN0YXVyYW50cywg\nYW5kIHBpY3R1cmVzcXVlIGJlYWNoZXMgbGlrZSBNYWxwZSBCZWFjaCBhbmQgS2FwdSBCZWFjaC4=', 'icon-karnataka.jpg'),
(42, 2, 'Uttara Kannada', 'VXR0YXJhIEthbm5hZGEsIGFsc28ga25vd24gYXMgTm9ydGggQ2FuYXJhLCBpcyBhIGRpc3RyaWN0\nIGluIEthcm5hdGFrYSBrbm93biBmb3IgaXRzIFdlc3Rlcm4gR2hhdHMgYmlvZGl2ZXJzaXR5LCBw\ncmlzdGluZSBiZWFjaGVzLCBhbmQgdGhlIEpvZyBGYWxscywgb25lIG9mIHRoZSBoaWdoZXN0IHdh\ndGVyZmFsbHMgaW4gSW5kaWEu', 'icon-karnataka.jpg'),
(43, 2, 'Vijayapura', 'VmlqYXlhcHVyYSwgZm9ybWVybHkga25vd24gYXMgQmlqYXB1ciwgaXMgYSBkaXN0cmljdCBpbiBL\nYXJuYXRha2EgZmFtb3VzIGZvciBpdHMgYXJjaGl0ZWN0dXJhbCBtYXJ2ZWxzIGxpa2UgdGhlIEdv\nbCBHdW1iYXosIElicmFoaW0gUmF1emEsIGFuZCB0aGUgTWFsaWstZS1NYWlkYW4sIG9uZSBvZiB0\naGUgbGFyZ2VzdCBtZWRpZXZhbCBjYW5ub25zIGluIHRoZSB3b3JsZC4=', 'icon-karnataka.jpg'),
(44, 2, 'Yadgir', 'WWFkZ2lyIGlzIGEgZGlzdHJpY3QgaW4gS2FybmF0YWthIGtub3duIGZvciBpdHMgaGlzdG9yaWNh\nbCBzaXRlcyBsaWtlIHRoZSBZYWRnaXIgRm9ydCwgcmVsaWdpb3VzIHNpZ25pZmljYW5jZSwgYW5k\nIGFncmljdWx0dXJhbCBhY3Rpdml0aWVzLCBlc3BlY2lhbGx5IGNvdHRvbiBjdWx0aXZhdGlvbi4=', 'icon-karnataka.jpg'),
(45, 3, 'Anantapur', 'QW5hbnRhcHVyIGRpc3RyaWN0IGlzIHNpdHVhdGVkIGluIHRoZSB3ZXN0ZXJuIHBhcnQgb2YgQW5k\naHJhIFByYWRlc2gsIGtub3duIGZvciBpdHMgaGlzdG9yaWNhbCBzaWduaWZpY2FuY2UsIHRlbXBs\nZXMgbGlrZSBMZXBha3NoaSwgYW5kIGl0cyByb2xlIGluIGFncmljdWx0dXJlIGFuZCBtaW5pbmcg\naW5kdXN0cmllcy4=', 'icon-andhra.jpg'),
(46, 3, 'Chittoor', 'Q2hpdHRvb3IgZGlzdHJpY3QsIGxvY2F0ZWQgaW4gdGhlIHNvdXRoZWFzdGVybiBwYXJ0IG9mIEFu\nZGhyYSBQcmFkZXNoLCBpcyBmYW1vdXMgZm9yIGl0cyB0ZW1wbGVzIGxpa2UgVGlydXBhdGksIHNj\nZW5pYyBsYW5kc2NhcGVzLCBhbmQgYWdyaWN1bHR1cmFsIGFjdGl2aXRpZXMsIGVzcGVjaWFsbHkg\naG9ydGljdWx0dXJlIGFuZCBtYW5nbyBjdWx0aXZhdGlvbi4=', 'icon-andhra.jpg'),
(47, 3, 'East Godavari', 'RWFzdCBHb2RhdmFyaSBkaXN0cmljdCBpcyBzaXR1YXRlZCBpbiB0aGUgbm9ydGhlYXN0ZXJuIHBh\ncnQgb2YgQW5kaHJhIFByYWRlc2gsIGtub3duIGZvciBpdHMgbHVzaCBncmVlbmVyeSwgZmVydGls\nZSBwbGFpbnMsIGNvY29udXQgZ3JvdmVzLCBhbmQgdGhlIHNjZW5pYyBHb2RhdmFyaSBSaXZlciwg\nb2ZmZXJpbmcgYSByaWNoIGN1bHR1cmFsIGFuZCBuYXR1cmFsIGhlcml0YWdlLg==', 'icon-andhra.jpg'),
(48, 3, 'Guntur', 'R3VudHVyIGRpc3RyaWN0LCBsb2NhdGVkIGluIHRoZSBjb2FzdGFsIHJlZ2lvbiBvZiBBbmRocmEg\nUHJhZGVzaCwgaXMga25vd24gZm9yIGl0cyByaWNoIGhpc3RvcnksIGN1bHR1cmFsIGhlcml0YWdl\nLCBhbmQgYWdyaWN1bHR1cmFsIHNpZ25pZmljYW5jZSwgcGFydGljdWxhcmx5IGluIHRoZSBwcm9k\ndWN0aW9uIG9mIGNoaWxpZXMgYW5kIGNvdHRvbi4=', 'icon-andhra.jpg'),
(49, 3, 'Krishna', 'S3Jpc2huYSBkaXN0cmljdCBpcyBzaXR1YXRlZCBpbiB0aGUgc291dGhlYXN0ZXJuIHBhcnQgb2Yg\nQW5kaHJhIFByYWRlc2gsIGtub3duIGZvciBpdHMgaGlzdG9yaWMgc2l0ZXMgbGlrZSBBbWFyYXZh\ndGksIHZpYnJhbnQgY3VsdHVyZSwgZmVydGlsZSBsYW5kcyBhbG9uZyB0aGUgS3Jpc2huYSBSaXZl\nciwgYW5kIHNpZ25pZmljYW50IGNvbnRyaWJ1dGlvbnMgdG8gYWdyaWN1bHR1cmUgYW5kIGluZHVz\ndHJ5Lg==', 'icon-andhra.jpg'),
(50, 3, 'Kurnool', 'S3Vybm9vbCBkaXN0cmljdCBpcyBsb2NhdGVkIGluIHRoZSB3ZXN0ZXJuIHBhcnQgb2YgQW5kaHJh\nIFByYWRlc2gsIGtub3duIGZvciBpdHMgaGlzdG9yaWNhbCBtb251bWVudHMgbGlrZSBLdXJub29s\nIEZvcnQsIGRpdmVyc2UgbGFuZHNjYXBlcyByYW5naW5nIGZyb20gcm9ja3kgaGlsbHMgdG8gZmVy\ndGlsZSBwbGFpbnMsIGFuZCBpdHMgaW1wb3J0YW5jZSBpbiBhZ3JpY3VsdHVyZSwgbWluaW5nLCBh\nbmQgZW5lcmd5IHNlY3RvcnMu', 'icon-andhra.jpg'),
(51, 3, 'Prakasam', 'UHJha2FzYW0gZGlzdHJpY3QgaXMgc2l0dWF0ZWQgb24gdGhlIHNvdXRoZWFzdGVybiBjb2FzdCBv\nZiBBbmRocmEgUHJhZGVzaCwga25vd24gZm9yIGl0cyBzY2VuaWMgYmVhY2hlcywgaGlzdG9yaWNh\nbCBsYW5kbWFya3MgbGlrZSBDaGlyYWxhIGFuZCBBZGRhbmtpLCBhbmQgaXRzIHJvbGUgaW4gYWdy\naWN1bHR1cmUsIGFxdWFjdWx0dXJlLCBhbmQgdGhlIGdyYW5pdGUgaW5kdXN0cnku', 'icon-andhra.jpg'),
(52, 3, 'Sri Potti Sriramulu Nellore', 'U3JpIFBvdHRpIFNyaXJhbXVsdSBOZWxsb3JlIGRpc3RyaWN0LCBjb21tb25seSByZWZlcnJlZCB0\nbyBhcyBOZWxsb3JlIGRpc3RyaWN0LCBpcyBsb2NhdGVkIG9uIHRoZSBzb3V0aGVhc3Rlcm4gY29h\nc3Qgb2YgQW5kaHJhIFByYWRlc2gsIGtub3duIGZvciBpdHMgY3VsdHVyYWwgaGVyaXRhZ2UsIGFn\ncmljdWx0dXJhbCBhY3Rpdml0aWVzLCBhbmQgaW5kdXN0cmlhbCBkZXZlbG9wbWVudCwgcGFydGlj\ndWxhcmx5IGluIHRoZSBhcXVhY3VsdHVyZSBzZWN0b3Iu', 'icon-andhra.jpg'),
(53, 3, 'Srikakulam', 'U3Jpa2FrdWxhbSBkaXN0cmljdCBpcyBzaXR1YXRlZCBpbiB0aGUgbm9ydGhlYXN0ZXJuIHBhcnQg\nb2YgQW5kaHJhIFByYWRlc2gsIGtub3duIGZvciBpdHMgcHJpc3RpbmUgYmVhY2hlcywgYW5jaWVu\ndCB0ZW1wbGVzLCBsdXNoIGdyZWVuZXJ5LCBhbmQgcmljaCBjdWx0dXJhbCBoZXJpdGFnZSwgb2Zm\nZXJpbmcgYSBzZXJlbmUgYW5kIHBpY3R1cmVzcXVlIHNldHRpbmcu', 'icon-andhra.jpg'),
(54, 3, 'Visakhapatnam', 'VmlzYWtoYXBhdG5hbSBkaXN0cmljdCwgb2Z0ZW4gcmVmZXJyZWQgdG8gYXMgVml6YWcsIGlzIGxv\nY2F0ZWQgb24gdGhlIHNvdXRoZWFzdGVybiBjb2FzdCBvZiBBbmRocmEgUHJhZGVzaCwga25vd24g\nZm9yIGl0cyBuYXR1cmFsIGJlYXV0eSwgYmVhY2hlcywgaGlsbCByYW5nZXMgbGlrZSB0aGUgRWFz\ndGVybiBHaGF0cywgcG9ydCBmYWNpbGl0aWVzLCBhbmQgaW5kdXN0cmlhbCBkZXZlbG9wbWVudHMs\nIG1ha2luZyBpdCBhIG1ham9yIGVjb25vbWljIGh1Yi4=', 'icon-andhra.jpg'),
(55, 3, 'Vizianagaram', 'Vml6aWFuYWdhcmFtIGRpc3RyaWN0IGlzIHNpdHVhdGVkIGluIHRoZSBub3J0aGVhc3Rlcm4gcGFy\ndCBvZiBBbmRocmEgUHJhZGVzaCwga25vd24gZm9yIGl0cyBoaXN0b3JpY2FsIHNpZ25pZmljYW5j\nZSwgY3VsdHVyYWwgaGVyaXRhZ2UsIGFuY2llbnQgdGVtcGxlcywgYW5kIGl0cyByb2xlIGluIGFn\ncmljdWx0dXJlLCBwYXJ0aWN1bGFybHkgaW4gcGFkZHkgY3VsdGl2YXRpb24gYW5kIGNhc2hldyBu\ndXQgcHJvZHVjdGlvbi4=', 'icon-andhra.jpg'),
(56, 3, 'West Godavari', 'V2VzdCBHb2RhdmFyaSBkaXN0cmljdCBpcyBsb2NhdGVkIGluIHRoZSBjb2FzdGFsIHJlZ2lvbiBv\nZiBBbmRocmEgUHJhZGVzaCwga25vd24gZm9yIGl0cyBmZXJ0aWxlIGxhbmRzLCByaWNoIGN1bHR1\ncmFsIGhlcml0YWdlLCBsdXNoIGdyZWVuZXJ5LCBhbmQgc2lnbmlmaWNhbnQgY29udHJpYnV0aW9u\ncyB0byBhZ3JpY3VsdHVyZSwgYXF1YWN1bHR1cmUsIGFuZCB0aGUgdGV4dGlsZSBpbmR1c3RyeS4=', 'icon-andhra.jpg'),
(57, 3, 'YSR Kadapa', 'WVNSIEthZGFwYSBkaXN0cmljdCwgZm9ybWVybHkga25vd24gYXMgQ3VkZGFwYWgsIGlzIHNpdHVh\ndGVkIGluIHRoZSBzb3V0aHdlc3Rlcm4gcGFydCBvZiBBbmRocmEgUHJhZGVzaCwga25vd24gZm9y\nIGl0cyBoaXN0b3JpY2FsIGxhbmRtYXJrcyBsaWtlIEdhbmRpa290YSBGb3J0LCBuYXR1cmFsIGxh\nbmRzY2FwZXMsIGFuZCBhZ3JpY3VsdHVyYWwgYWN0aXZpdGllcywgcGFydGljdWxhcmx5IGluIHRo\nZSBjdWx0aXZhdGlvbiBvZiBncm91bmRudXRzIGFuZCBjb3R0b24u', 'icon-andhra.jpg'),
(58, 7, 'Adilabad', 'WVNSIEthZGFwYSBkaXN0cmljdCwgZm9ybWVybHkga25vd24gYXMgQ3VkZGFwYWgsIGlzIHNpdHVh\n', 'telangana2.jpg'),
(59, 7, 'Bhadradri Kothagudem', 'WVNSIEthZGFwYSBkaXN0cmljdCwgZm9ybWVybHkga25vd24gYXMgQ3VkZGFwYWgsIGlzIHNpdHVh\n', 'telangana2.jpg'),
(60, 7, 'Hyderabad', 'WVNSIEthZGFwYSBkaXN0cmljdCwgZm9ybWVybHkga25vd24gYXMgQ3VkZGFwYWgsIGlzIHNpdHVh\n', 'telangana2.jpg'),
(61, 7, 'Jagtial', 'WVNSIEthZGFwYSBkaXN0cmljdCwgZm9ybWVybHkga25vd24gYXMgQ3VkZGFwYWgsIGlzIHNpdHVh\n', 'telangana2.jpg'),
(62, 7, 'Jangaon', 'WVNSIEthZGFwYSBkaXN0cmljdCwgZm9ybWVybHkga25vd24gYXMgQ3VkZGFwYWgsIGlzIHNpdHVh\n', 'telangana2.jpg'),
(63, 7, 'Jayashankar Bhupalpally', 'WVNSIEthZGFwYSBkaXN0cmljdCwgZm9ybWVybHkga25vd24gYXMgQ3VkZGFwYWgsIGlzIHNpdHVh\n', 'telangana2.jpg'),
(64, 7, 'Jogulamba Gadwal', 'WVNSIEthZGFwYSBkaXN0cmljdCwgZm9ybWVybHkga25vd24gYXMgQ3VkZGFwYWgsIGlzIHNpdHVh\n', 'telangana2.jpg'),
(65, 7, 'Kamareddy', 'WVNSIEthZGFwYSBkaXN0cmljdCwgZm9ybWVybHkga25vd24gYXMgQ3VkZGFwYWgsIGlzIHNpdHVh\n', 'telangana2.jpg'),
(66, 7, 'Karimnagar', 'WVNSIEthZGFwYSBkaXN0cmljdCwgZm9ybWVybHkga25vd24gYXMgQ3VkZGFwYWgsIGlzIHNpdHVh\n', 'telangana2.jpg'),
(67, 7, 'Khammam', 'WVNSIEthZGFwYSBkaXN0cmljdCwgZm9ybWVybHkga25vd24gYXMgQ3VkZGFwYWgsIGlzIHNpdHVh\n', 'telangana2.jpg'),
(68, 7, 'Komaram Bheem', 'WVNSIEthZGFwYSBkaXN0cmljdCwgZm9ybWVybHkga25vd24gYXMgQ3VkZGFwYWgsIGlzIHNpdHVh\n', 'telangana2.jpg'),
(69, 7, 'Mahabubabad', 'WVNSIEthZGFwYSBkaXN0cmljdCwgZm9ybWVybHkga25vd24gYXMgQ3VkZGFwYWgsIGlzIHNpdHVh\n', 'telangana2.jpg'),
(70, 7, 'Mahbubnagar', 'WVNSIEthZGFwYSBkaXN0cmljdCwgZm9ybWVybHkga25vd24gYXMgQ3VkZGFwYWgsIGlzIHNpdHVh\n', 'telangana2.jpg'),
(71, 7, 'Mancherial', 'WVNSIEthZGFwYSBkaXN0cmljdCwgZm9ybWVybHkga25vd24gYXMgQ3VkZGFwYWgsIGlzIHNpdHVh\n', 'telangana2.jpg'),
(72, 7, 'Medak', 'WVNSIEthZGFwYSBkaXN0cmljdCwgZm9ybWVybHkga25vd24gYXMgQ3VkZGFwYWgsIGlzIHNpdHVh\n', 'telangana2.jpg'),
(73, 7, 'Medchal–Malkajgiri', 'WVNSIEthZGFwYSBkaXN0cmljdCwgZm9ybWVybHkga25vd24gYXMgQ3VkZGFwYWgsIGlzIHNpdHVh\n', 'telangana2.jpg'),
(74, 7, 'Nagarkurnool', 'WVNSIEthZGFwYSBkaXN0cmljdCwgZm9ybWVybHkga25vd24gYXMgQ3VkZGFwYWgsIGlzIHNpdHVh\n', 'telangana2.jpg'),
(75, 7, 'Nalgonda', 'WVNSIEthZGFwYSBkaXN0cmljdCwgZm9ybWVybHkga25vd24gYXMgQ3VkZGFwYWgsIGlzIHNpdHVh\n', 'telangana2.jpg'),
(76, 7, 'Nirmal', 'WVNSIEthZGFwYSBkaXN0cmljdCwgZm9ybWVybHkga25vd24gYXMgQ3VkZGFwYWgsIGlzIHNpdHVh\n', 'telangana2.jpg'),
(77, 7, 'Nizamabad', 'WVNSIEthZGFwYSBkaXN0cmljdCwgZm9ybWVybHkga25vd24gYXMgQ3VkZGFwYWgsIGlzIHNpdHVh\n', 'telangana2.jpg'),
(78, 7, 'Peddapalli', 'WVNSIEthZGFwYSBkaXN0cmljdCwgZm9ybWVybHkga25vd24gYXMgQ3VkZGFwYWgsIGlzIHNpdHVh\n', 'telangana2.jpg'),
(79, 7, 'Rajanna Sircilla', 'WVNSIEthZGFwYSBkaXN0cmljdCwgZm9ybWVybHkga25vd24gYXMgQ3VkZGFwYWgsIGlzIHNpdHVh\n', 'telangana2.jpg'),
(80, 7, 'Rangareddy', 'WVNSIEthZGFwYSBkaXN0cmljdCwgZm9ybWVybHkga25vd24gYXMgQ3VkZGFwYWgsIGlzIHNpdHVh\n', 'telangana2.jpg'),
(81, 7, 'Sangareddy', 'WVNSIEthZGFwYSBkaXN0cmljdCwgZm9ybWVybHkga25vd24gYXMgQ3VkZGFwYWgsIGlzIHNpdHVh\n', 'telangana2.jpg'),
(82, 7, 'Siddipet', 'WVNSIEthZGFwYSBkaXN0cmljdCwgZm9ybWVybHkga25vd24gYXMgQ3VkZGFwYWgsIGlzIHNpdHVh\n', 'telangana2.jpg'),
(83, 7, 'Suryapet', 'WVNSIEthZGFwYSBkaXN0cmljdCwgZm9ybWVybHkga25vd24gYXMgQ3VkZGFwYWgsIGlzIHNpdHVh\n', 'telangana2.jpg'),
(84, 7, 'Vikarabad', 'WVNSIEthZGFwYSBkaXN0cmljdCwgZm9ybWVybHkga25vd24gYXMgQ3VkZGFwYWgsIGlzIHNpdHVh\n', 'telangana2.jpg'),
(85, 7, 'Wanaparthy', 'WVNSIEthZGFwYSBkaXN0cmljdCwgZm9ybWVybHkga25vd24gYXMgQ3VkZGFwYWgsIGlzIHNpdHVh\n', 'telangana2.jpg'),
(86, 7, 'Warangal Rural', 'WVNSIEthZGFwYSBkaXN0cmljdCwgZm9ybWVybHkga25vd24gYXMgQ3VkZGFwYWgsIGlzIHNpdHVh\n', 'telangana2.jpg'),
(87, 7, 'Warangal Urban', 'WVNSIEthZGFwYSBkaXN0cmljdCwgZm9ybWVybHkga25vd24gYXMgQ3VkZGFwYWgsIGlzIHNpdHVh\n', 'telangana2.jpg'),
(88, 7, 'Yadadri Bhuvanagiri', 'WVNSIEthZGFwYSBkaXN0cmljdCwgZm9ybWVybHkga25vd24gYXMgQ3VkZGFwYWgsIGlzIHNpdHVh\n', 'telangana2.jpg'),
(89, 10, 'Kanniyakumari', 'VGhpcnV2YW5hbnRoYXB1cmFtIGlzIHRoZSBjYXBpdGFsIGNpdHkgb2YgS2VyYWxhLCBrbm93biBm\r\nb3IgaXRzIGNvbG9uaWFsIGFyY2hpdGVjdHVyZSwgYmVhdXRpZnVsIGJlYWNoZXMsIGFuZCByaWNo\r\nIGN1bHR1cmFsIGhlcml0YWdlLg==', '1-meenakshi-amman-temple-madurai-tamil-nadu-attr-hero.jpeg'),
(90, 11, 'Dumka', 'VGhpcnV2YW5hbnRoYXB1cmFtIGlzIHRoZSBjYXBpdGFsIGNpdHkgb2YgS2VyYWxhLCBrbm93biBm b3IgaXRzIGNvbG9uaWFsIGFyY2hpdGVjdHVyZSwgYmVhdXRpZnVsIGJlYWNoZXMsIGFuZCByaWNo IGN1bHR1cmFsIGhlcml0YWdlLg==', 'dumka.jpg');

-- --------------------------------------------------------

--
-- Table structure for table `media_tasks`
--

CREATE TABLE `media_tasks` (
  `id` int NOT NULL,
  `task_id` int NOT NULL,
  `media_type` enum('photo','video') CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `title` varchar(150) NOT NULL,
  `duration` int DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `media_tasks`
--

INSERT INTO `media_tasks` (`id`, `task_id`, `media_type`, `title`, `duration`) VALUES
(1, 3, 'video', 'Sample video ', 10),
(2, 4, 'photo', 'Sample Image', 0);

-- --------------------------------------------------------

--
-- Table structure for table `questions`
--

CREATE TABLE `questions` (
  `id` int NOT NULL,
  `type` enum('text','audio','video','image') NOT NULL,
  `timer` int NOT NULL,
  `video` varchar(150) DEFAULT NULL,
  `audio` varchar(150) DEFAULT NULL,
  `image` varchar(150) DEFAULT NULL,
  `question` text NOT NULL,
  `challenge_id` int NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `questions`
--

INSERT INTO `questions` (`id`, `type`, `timer`, `video`, `audio`, `image`, `question`, `challenge_id`) VALUES
(2, 'text', 30, NULL, NULL, NULL, 'Question 1 (ans a)', 2),
(3, 'image', 30, NULL, NULL, 'file_67c1b688973008.33262408.jpeg', 'Question (ans a)', 2),
(4, 'video', 30, 'file_67c1b68f1dbef3.68568172.mp4', NULL, NULL, 'Question (ans a)', 2);

-- --------------------------------------------------------

--
-- Table structure for table `rewards`
--

CREATE TABLE `rewards` (
  `id` int NOT NULL,
  `challenge_id` int NOT NULL,
  `title` varchar(200) NOT NULL,
  `coupon` varchar(150) DEFAULT NULL,
  `description` text NOT NULL,
  `link` text CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci,
  `page_id` int NOT NULL,
  `expiration_date` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `cancelled` enum('no','yes') NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Table structure for table `tasks`
--

CREATE TABLE `tasks` (
  `task_id` int NOT NULL,
  `challenge_id` int NOT NULL,
  `task_name` varchar(100) NOT NULL,
  `description` text NOT NULL,
  `start_date` datetime NOT NULL,
  `start_time` time NOT NULL,
  `end_date` datetime NOT NULL,
  `end_time` time NOT NULL,
  `task_type` varchar(100) NOT NULL,
  `verification_method` varchar(15) NOT NULL,
  `entry_points` int NOT NULL,
  `reward_points` int NOT NULL,
  `reward_cash` int NOT NULL,
  `verification_points` int NOT NULL,
  `is_certificate` varchar(15) NOT NULL,
  `is_badge` varchar(15) NOT NULL,
  `player_level` varchar(15) NOT NULL,
  `created_date` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `created_by` varchar(100) NOT NULL,
  `participants_count` int NOT NULL,
  `active` enum('yes','no') CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `removed_date` datetime DEFAULT NULL,
  `removed_by` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  `day` int NOT NULL DEFAULT '0'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `tasks`
--

INSERT INTO `tasks` (`task_id`, `challenge_id`, `task_name`, `description`, `start_date`, `start_time`, `end_date`, `end_time`, `task_type`, `verification_method`, `entry_points`, `reward_points`, `reward_cash`, `verification_points`, `is_certificate`, `is_badge`, `player_level`, `created_date`, `created_by`, `participants_count`, `active`, `removed_date`, `removed_by`, `day`) VALUES
(2, 2, 'New Challenge', 'TmV3IFRhc2sgVGFzaw==', '2025-02-28 06:30:00', '12:00:00', '2025-03-31 06:30:00', '12:00:00', 'stepCounter', 'auto', 10, 10, 10, 9, 'no', 'no', 'beginner', '2025-02-28 18:19:07', 'Admin', 0, 'yes', NULL, NULL, 5),
(3, 2, 'New Challenge 2 ', 'TmV3IENoYWxsZW5nZSAy', '2025-02-28 06:30:00', '12:00:00', '2025-03-31 06:30:00', '12:00:00', 'videoCapture', 'auto', 10, 10, 10, 10, 'no', 'no', 'beginner', '2025-02-28 18:32:03', 'Admin', 0, 'yes', NULL, NULL, 10),
(4, 2, 'New Challenge 3', 'TmV3IENoYWxsZW5nZSAz', '2025-02-28 06:30:00', '12:00:00', '2025-02-28 06:30:00', '12:00:00', 'mediaCapture', 'auto', 10, 10, 100, 100, 'no', 'no', 'beginner', '2025-02-28 18:35:03', 'Admin', 0, 'yes', NULL, NULL, 100),
(5, 2, 'New Challenge 4', 'TmV3IENoYWxsZW5nZSA0', '2025-02-27 18:30:00', '00:00:00', '2025-03-31 06:30:00', '12:00:00', 'quiz', 'auto', 100, 100, 100, 100, 'no', 'no', 'beginner', '2025-02-28 18:46:22', 'Admin', 0, 'yes', NULL, NULL, 100),
(6, 2, 'New Challenge 5', 'TmV3IENoYWxsZW5nZSA1', '2025-02-27 18:30:00', '00:00:00', '2025-03-31 06:30:00', '12:00:00', 'map', 'auto', 10, 10, 10, 100, 'no', 'no', 'beginner', '2025-02-28 18:48:46', 'Admin', 0, 'yes', NULL, NULL, 100);

-- --------------------------------------------------------

--
-- Table structure for table `task_map`
--

CREATE TABLE `task_map` (
  `map_id` int NOT NULL,
  `task_id` int NOT NULL,
  `challenge_id` int NOT NULL,
  `reach_distance` float NOT NULL,
  `latitude` varchar(20) NOT NULL,
  `longitude` varchar(20) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `task_map`
--

INSERT INTO `task_map` (`map_id`, `task_id`, `challenge_id`, `reach_distance`, `latitude`, `longitude`) VALUES
(1, 6, 2, 100, '9.5869364', '76.4948362');

-- --------------------------------------------------------

--
-- Table structure for table `task_media`
--

CREATE TABLE `task_media` (
  `media_id` int NOT NULL,
  `task_id` int NOT NULL,
  `media_type` enum('photo','video') CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `media_path` varchar(250) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `task_media`
--

INSERT INTO `task_media` (`media_id`, `task_id`, `media_type`, `media_path`) VALUES
(2, 2, 'photo', 'file_67c1a672d8fd56.75835570.jpg'),
(3, 3, 'photo', 'file_67c1a672d8fd56.75835570.jpg'),
(4, 4, 'photo', 'file_67c1a672d8fd56.75835570.jpg'),
(5, 5, 'photo', 'file_67c1a672d8fd56.75835570.jpg'),
(6, 6, 'photo', 'file_67c1a672d8fd56.75835570.jpg');

-- --------------------------------------------------------

--
-- Table structure for table `task_pedometer`
--

CREATE TABLE `task_pedometer` (
  `id` int NOT NULL,
  `task_id` int NOT NULL,
  `steps` float NOT NULL,
  `direction` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `task_pedometer`
--

INSERT INTO `task_pedometer` (`id`, `task_id`, `steps`, `direction`) VALUES
(1, 2, 100, 'any');

-- --------------------------------------------------------

--
-- Table structure for table `task_relation`
--

CREATE TABLE `task_relation` (
  `relation_id` int NOT NULL,
  `challenge_id` int NOT NULL,
  `task_id` int NOT NULL,
  `order_id` int NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `task_relation`
--

INSERT INTO `task_relation` (`relation_id`, `challenge_id`, `task_id`, `order_id`) VALUES
(1, 2, 2, 1),
(2, 2, 3, 2),
(3, 2, 4, 3),
(4, 2, 5, 4),
(5, 2, 6, 5);

--
-- Indexes for dumped tables
--

--
-- Indexes for table `answers`
--
ALTER TABLE `answers`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `certificates`
--
ALTER TABLE `certificates`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `challenges`
--
ALTER TABLE `challenges`
  ADD PRIMARY KEY (`challenge_id`);

--
-- Indexes for table `challengeStore`
--
ALTER TABLE `challengeStore`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `challenge_media`
--
ALTER TABLE `challenge_media`
  ADD PRIMARY KEY (`media_id`);

--
-- Indexes for table `districts`
--
ALTER TABLE `districts`
  ADD PRIMARY KEY (`district_id`);

--
-- Indexes for table `media_tasks`
--
ALTER TABLE `media_tasks`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `questions`
--
ALTER TABLE `questions`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `rewards`
--
ALTER TABLE `rewards`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `tasks`
--
ALTER TABLE `tasks`
  ADD PRIMARY KEY (`task_id`);

--
-- Indexes for table `task_map`
--
ALTER TABLE `task_map`
  ADD PRIMARY KEY (`map_id`);

--
-- Indexes for table `task_media`
--
ALTER TABLE `task_media`
  ADD PRIMARY KEY (`media_id`);

--
-- Indexes for table `task_pedometer`
--
ALTER TABLE `task_pedometer`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `task_relation`
--
ALTER TABLE `task_relation`
  ADD PRIMARY KEY (`relation_id`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `answers`
--
ALTER TABLE `answers`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=17;

--
-- AUTO_INCREMENT for table `certificates`
--
ALTER TABLE `certificates`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `challenges`
--
ALTER TABLE `challenges`
  MODIFY `challenge_id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `challengeStore`
--
ALTER TABLE `challengeStore`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `challenge_media`
--
ALTER TABLE `challenge_media`
  MODIFY `media_id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `districts`
--
ALTER TABLE `districts`
  MODIFY `district_id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=91;

--
-- AUTO_INCREMENT for table `media_tasks`
--
ALTER TABLE `media_tasks`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `questions`
--
ALTER TABLE `questions`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `rewards`
--
ALTER TABLE `rewards`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `tasks`
--
ALTER TABLE `tasks`
  MODIFY `task_id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT for table `task_map`
--
ALTER TABLE `task_map`
  MODIFY `map_id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `task_media`
--
ALTER TABLE `task_media`
  MODIFY `media_id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT for table `task_pedometer`
--
ALTER TABLE `task_pedometer`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `task_relation`
--
ALTER TABLE `task_relation`
  MODIFY `relation_id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
