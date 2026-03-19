CREATE TABLE `collection_criteria_history` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id` BIGINT UNSIGNED NOT NULL,
  `collection_id` BIGINT UNSIGNED NOT NULL,
  `object_type` VARBINARY(50) NOT NULL,
  `criteria_type` INT NOT NULL DEFAULT '0',
  `criteria_value` TEXT COLLATE utf8mb4_unicode_ci,
  `created_date` DOUBLE(13,3) NOT NULL,
  `criteria_action_group` VARCHAR(255) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='utf8mb4_unicode_ci'