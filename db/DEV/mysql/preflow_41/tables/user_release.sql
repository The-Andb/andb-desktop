CREATE TABLE `user_release` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `release_id` BIGINT UNSIGNED NOT NULL COMMENT 'ID of Flo app release',
  `user_id` BIGINT UNSIGNED NOT NULL COMMENT 'ID of group, refer to table Groups',
  `username` VARCHAR(255) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `created_date` DOUBLE(13,3) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_release_id` (`release_id`),
  CONSTRAINT `cst_release_id` FOREIGN KEY (`release_id`) REFERENCES `release` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci