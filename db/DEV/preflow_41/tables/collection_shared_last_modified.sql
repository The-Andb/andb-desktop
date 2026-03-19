CREATE TABLE `collection_shared_last_modified` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `collection_id` BIGINT UNSIGNED NOT NULL,
  `object_type` VARCHAR(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `is_trashed` TINYINT UNSIGNED NOT NULL DEFAULT '0',
  `created_date` DOUBLE(13,3) NOT NULL,
  `updated_date` DOUBLE(13,3) DEFAULT NULL,
  `user_id` BIGINT DEFAULT '0',
  PRIMARY KEY (`id`) USING BTREE,
  KEY `idx_collection_activity` (`collection_id`,`updated_date`) USING BTREE,
  KEY `idx_object_changes` (`object_type`,`updated_date`) USING BTREE,
  KEY `idx_updated_date` (`updated_date`) USING BTREE,
  UNIQUE KEY `uniq_collection_object` (`collection_id`,`object_type`,`user_id`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci