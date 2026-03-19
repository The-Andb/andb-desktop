CREATE TABLE `collection_user` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `collection_id` BIGINT UNSIGNED NOT NULL,
  `user_id` BIGINT UNSIGNED NOT NULL,
  `card_uri` VARCHAR(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `status` TINYINT UNSIGNED DEFAULT '0',
  `permission` TINYINT DEFAULT '0',
  `is_hide` TINYINT UNSIGNED DEFAULT '0',
  `created_date` DOUBLE(13,3) NOT NULL,
  `updated_date` DOUBLE(13,3) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_collection_user_on_collection_id` (`collection_id`),
  KEY `idx_collection_user_on_user_id` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci