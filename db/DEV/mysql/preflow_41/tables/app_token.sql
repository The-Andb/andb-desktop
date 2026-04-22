CREATE TABLE `app_token` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `app_preg_id` VARCHAR(255) CHARACTER SET latin1 COLLATE latin1_swedish_ci DEFAULT NULL,
  `key_api` VARCHAR(255) CHARACTER SET latin1 COLLATE latin1_swedish_ci DEFAULT NULL,
  `token` VARCHAR(255) CHARACTER SET latin1 COLLATE latin1_swedish_ci DEFAULT NULL,
  `user_id` BIGINT UNSIGNED NOT NULL,
  `email` VARCHAR(255) CHARACTER SET latin1 COLLATE latin1_swedish_ci DEFAULT NULL,
  `time_expire` DOUBLE(13,3) NOT NULL,
  `created_time` DOUBLE(13,3) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_key_api` (`key_api`) USING BTREE,
  KEY `idx_user_id` (`user_id`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COMMENT='utf8_unicode_ci'