CREATE TABLE `subscription_purchase` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id` BIGINT UNSIGNED NOT NULL,
  `sub_id` VARCHAR(255) NOT NULL DEFAULT '',
  `description` VARCHAR(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL DEFAULT '',
  `transaction_id` VARCHAR(500) NOT NULL DEFAULT '',
  `receipt_data` TEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
  `is_current` TINYINT UNSIGNED NOT NULL DEFAULT '0',
  `purchase_type` TINYINT UNSIGNED NOT NULL DEFAULT '0',
  `purchase_status` TINYINT UNSIGNED NOT NULL DEFAULT '1',
  `start_date` DOUBLE(13,3) NOT NULL DEFAULT '-1.000',
  `end_date` DOUBLE(13,3) NOT NULL DEFAULT '-1.000',
  `created_date` DOUBLE(13,3) NOT NULL,
  `updated_date` DOUBLE(13,3) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_on_end_date` (`end_date`),
  KEY `idx_on_start_date` (`start_date`),
  KEY `idx_on_user_id_and_is_current_and_sub_id` (`user_id`,`is_current`,`sub_id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COMMENT='utf8_unicode_ci'