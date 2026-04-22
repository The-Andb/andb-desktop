CREATE TABLE `user_platform_version` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id` BIGINT UNSIGNED NOT NULL,
  `platform_release_version_id` BIGINT NOT NULL,
  `app_id` VARCHAR(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `device_token` VARCHAR(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `user_agent` VARCHAR(255) COLLATE utf8mb4_unicode_ci DEFAULT '',
  `created_date` DOUBLE(13,3) NOT NULL,
  `updated_date` DOUBLE(13,3) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci