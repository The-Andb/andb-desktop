CREATE TABLE `cloud` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id` BIGINT UNSIGNED NOT NULL,
  `uid` VARCHAR(255) CHARACTER SET latin1 COLLATE latin1_swedish_ci DEFAULT NULL,
  `real_filename` TEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `ext` VARCHAR(255) CHARACTER SET latin1 COLLATE latin1_swedish_ci DEFAULT NULL,
  `device_uid` VARCHAR(255) CHARACTER SET latin1 COLLATE latin1_swedish_ci DEFAULT NULL,
  `bookmark_data` TEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `size` INT DEFAULT '0',
  `upload_status` TINYINT UNSIGNED DEFAULT '0',
  `order_number` DECIMAL(20,10) DEFAULT '0.0000000000',
  `order_update_time` DOUBLE(13,3) DEFAULT NULL,
  `created_date` DOUBLE(13,3) NOT NULL,
  `updated_date` DOUBLE(13,3) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_user_id` (`user_id`),
  UNIQUE KEY `uniq_on_user_id_and_order_number` (`user_id`,`order_number`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COMMENT='utf8_unicode_ci'