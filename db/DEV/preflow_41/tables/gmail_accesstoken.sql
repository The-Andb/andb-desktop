CREATE TABLE `gmail_accesstoken` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id` BIGINT UNSIGNED NOT NULL COMMENT 'Just tracking who upload/create this release Flo app',
  `app_id` VARCHAR(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `device_token` VARCHAR(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `gmail` VARCHAR(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `sub_key` TEXT COLLATE utf8mb4_unicode_ci,
  `access_token` TEXT COLLATE utf8mb4_unicode_ci NOT NULL,
  `refresh_token` TEXT COLLATE utf8mb4_unicode_ci NOT NULL,
  `scope` TEXT COLLATE utf8mb4_unicode_ci NOT NULL,
  `token_type` VARCHAR(45) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `expiry_date` BIGINT DEFAULT NULL,
  `status` enum('0','1') COLLATE utf8mb4_unicode_ci DEFAULT '0' COMMENT '0: Not registered to receive mail notifications\n1: Already registered to receive email notifications\n',
  `created_date` DOUBLE(13,3) NOT NULL,
  `updated_date` DOUBLE(13,3) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_user_id` (`user_id`),
  UNIQUE KEY `uniq_on_userid_and_app_id_and_gmail_and_device_token` (`user_id`,`app_id`,`gmail`,`device_token`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci