CREATE TABLE `realtime_message_translation` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `message_uid` VARCHAR(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `language` VARCHAR(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `content` TEXT COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_date` BIGINT NOT NULL,
  `updated_date` BIGINT NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci