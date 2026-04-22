CREATE TABLE `file` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id` BIGINT UNSIGNED NOT NULL,
  `uid` VARCHAR(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `local_path` TEXT COLLATE utf8mb4_unicode_ci,
  `url` TEXT COLLATE utf8mb4_unicode_ci,
  `source` TINYINT UNSIGNED NOT NULL DEFAULT '0',
  `filename` TEXT COLLATE utf8mb4_unicode_ci NOT NULL,
  `ext` VARCHAR(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `object_uid` VARBINARY(1000) NOT NULL,
  `object_type` VARBINARY(50) NOT NULL,
  `client_id` VARCHAR(255) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '',
  `size` INT UNSIGNED NOT NULL,
  `created_date` DOUBLE(13,3) NOT NULL,
  `updated_date` DOUBLE(13,3) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_object_uid` (`object_uid`),
  KEY `idx_user_id` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='utf8mb4_unicode_ci'