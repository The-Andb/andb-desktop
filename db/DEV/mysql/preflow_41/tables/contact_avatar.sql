CREATE TABLE `contact_avatar` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id` BIGINT UNSIGNED NOT NULL,
  `file_name` VARCHAR(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
  `file_ext` VARCHAR(10) CHARACTER SET latin1 COLLATE latin1_swedish_ci DEFAULT NULL,
  `object_href` TEXT COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'String, not null',
  `object_uid` VARBINARY(1000) NOT NULL,
  `size` INT NOT NULL COMMENT 'The size of the contact avatar is uploaded',
  `created_date` DOUBLE(13,3) NOT NULL,
  `updated_date` DOUBLE(13,3) DEFAULT NULL,
  PRIMARY KEY (`id`),
  FULLTEXT KEY `idx_object_href` (`object_href`),
  KEY `idx_user_id` (`user_id`),
  UNIQUE KEY `uniq_object_uid` (`object_uid`),
  CONSTRAINT `cst_user_id` FOREIGN KEY (`user_id`) REFERENCES `user` (`id`) ON DELETE CASCADE ON UPDATE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci