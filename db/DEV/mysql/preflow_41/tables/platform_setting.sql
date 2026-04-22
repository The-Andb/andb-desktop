CREATE TABLE `platform_setting` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id` BIGINT UNSIGNED NOT NULL,
  `data_setting` json NOT NULL,
  `app_reg_id` VARCHAR(255) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '',
  `app_version` VARCHAR(255) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '',
  `device_uid` VARCHAR(255) CHARACTER SET latin1 COLLATE latin1_swedish_ci NOT NULL DEFAULT '',
  `created_date` DOUBLE(13,3) NOT NULL,
  `updated_date` DOUBLE(13,3) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_on_user_id_and_app_reg_id` (`user_id`,`app_reg_id`),
  KEY `idx_on_user_id_and_app_reg_id_and_app_version` (`user_id`,`app_reg_id`,`app_version`),
  KEY `idx_on_user_id_and_app_version` (`user_id`,`app_version`),
  KEY `idx_user_id` (`user_id`),
  UNIQUE KEY `unq_platform_setting` (`user_id`,`app_reg_id`,`app_version`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='utf8mb4_unicode_ci'