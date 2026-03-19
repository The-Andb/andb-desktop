CREATE TABLE `collection_last_used` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `collection_id` BIGINT UNSIGNED NOT NULL,
  `last_used` DOUBLE(13,3) NOT NULL,
  `created_date` DOUBLE(13,3) NOT NULL,
  `updated_date` DOUBLE(13,3) DEFAULT NULL,
  PRIMARY KEY (`id`) USING BTREE,
  KEY `idx_collection_last_used` (`collection_id`,`last_used`) USING BTREE,
  UNIQUE KEY `uniq_collection_id` (`collection_id`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci