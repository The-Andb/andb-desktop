CREATE TABLE `collection_activity` (
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `collection_id` BIGINT NOT NULL DEFAULT '0',
  `old_collection_id` BIGINT NOT NULL,
  `user_id` BIGINT NOT NULL DEFAULT '0',
  `object_uid` VARBINARY(1000) NOT NULL,
  `object_type` VARBINARY(50) NOT NULL,
  `object_href` TEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `category` TINYINT NOT NULL DEFAULT '0',
  `created_date` DOUBLE(13,3) NOT NULL DEFAULT '0.000',
  `updated_date` DOUBLE(13,3) NOT NULL DEFAULT '0.000',
  PRIMARY KEY (`id`),
  KEY `idx_collection_id` (`collection_id`),
  KEY `idx_on_obj_uid_and_obj_type_and_collection_id` (`object_uid`,`object_type`,`collection_id`),
  KEY `idx_on_object_type` (`object_type`),
  KEY `idx_updated_date` (`updated_date`),
  KEY `idx_user_id` (`user_id`) USING BTREE,
  KEY `idx_user_id_and_collection_id` (`user_id`,`collection_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci