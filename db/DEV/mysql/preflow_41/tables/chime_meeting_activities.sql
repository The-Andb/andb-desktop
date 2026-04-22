CREATE TABLE `chime_meeting_activities` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `meeting_id` VARCHAR(50) COLLATE utf8mb4_general_ci NOT NULL,
  `type` enum('JOINED','LEAVED','HANGUP','ANSWERED','NOT_ANSWERED') COLLATE utf8mb4_general_ci NOT NULL,
  `activity_time` INT NOT NULL,
  `attendee_id` VARCHAR(50) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `phone_number` VARCHAR(100) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `created_date` DOUBLE(13,3) DEFAULT NULL,
  `updated_date` DOUBLE(13,3) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `chime_meeting_activities_attendee_id_IDX` (`attendee_id`) USING BTREE,
  KEY `chime_meeting_activities_meeting_id_IDX` (`meeting_id`) USING BTREE,
  KEY `chime_meeting_activities_phone_number_IDX` (`phone_number`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci