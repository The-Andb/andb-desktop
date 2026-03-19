CREATE TABLE `report_cached_migrated_platform` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id` BIGINT NOT NULL,
  `app_reg_id` VARCHAR(255) NOT NULL,
  `created_date` DOUBLE(13,3) NOT NULL DEFAULT '0.000',
  `updated_date` DOUBLE(13,3) NOT NULL DEFAULT '0.000',
  PRIMARY KEY (`id`),
  KEY `app_reg_id` (`app_reg_id`) USING BTREE,
  KEY `user_id` (`user_id`) USING BTREE,
  UNIQUE KEY `user_id_app_reg_id` (`user_id`,`app_reg_id`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=latin1