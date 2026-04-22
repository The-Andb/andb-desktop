CREATE TABLE `platform_setting_default` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `data_setting` json NOT NULL,
  `app_reg_id` VARCHAR(255) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '',
  `app_version` VARCHAR(255) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '',
  `created_date` DOUBLE(13,3) NOT NULL,
  `updated_date` DOUBLE(13,3) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_app_reg_id` (`app_reg_id`),
  KEY `idx_updated_date` (`updated_date`),
  UNIQUE KEY `uniq_on_app_reg_id_and_app_version` (`app_reg_id`,`app_version`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='utf8mb4_unicode_ci'