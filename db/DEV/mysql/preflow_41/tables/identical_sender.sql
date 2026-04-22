CREATE TABLE `identical_sender` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `filing_id` BIGINT UNSIGNED DEFAULT NULL,
  `user_id` BIGINT UNSIGNED NOT NULL,
  `suggested_collection_id` BIGINT UNSIGNED DEFAULT NULL,
  `email_address` VARCHAR(255) CHARACTER SET latin1 COLLATE latin1_swedish_ci DEFAULT NULL,
  `created_date` DOUBLE(13,3) DEFAULT NULL,
  `updated_date` DOUBLE(13,3) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `suggested_collection_id` (`suggested_collection_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci