CREATE TABLE `realtime_channel_user_language` (
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `channel_name` VARCHAR(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` VARCHAR(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `language` VARCHAR(10) COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_date` BIGINT NOT NULL DEFAULT '0',
  `updated_date` BIGINT NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`),
  UNIQUE KEY `idx_channel_email` (`channel_name`,`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci