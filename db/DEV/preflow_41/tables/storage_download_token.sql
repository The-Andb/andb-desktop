CREATE TABLE `storage_download_token` (
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `path` VARCHAR(600) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `owner` VARCHAR(200) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `token` VARCHAR(500) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `download_time` BIGINT NOT NULL DEFAULT '0',
  `expired_at` DOUBLE(13,3) DEFAULT NULL,
  `created_date` DOUBLE(13,3) DEFAULT NULL,
  `updated_date` DOUBLE(13,3) DEFAULT NULL,
  `file_uid` VARCHAR(200) COLLATE utf8mb4_general_ci DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci