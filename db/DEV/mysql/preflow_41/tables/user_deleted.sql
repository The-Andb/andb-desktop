CREATE TABLE `user_deleted` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id` BIGINT UNSIGNED NOT NULL,
  `username` VARCHAR(255) NOT NULL,
  `is_disabled` TINYINT(1) NOT NULL,
  `progress` TINYINT(1) NOT NULL,
  `cleaning_date` DOUBLE(13,3) UNSIGNED NOT NULL,
  `created_date` DOUBLE(13,3) UNSIGNED NOT NULL,
  `updated_date` DOUBLE(13,3) UNSIGNED DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_cleaning_date` (`cleaning_date`) USING BTREE,
  KEY `idx_progress` (`progress`),
  UNIQUE KEY `uniq_user_id` (`user_id`),
  UNIQUE KEY `uniq_username` (`username`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1