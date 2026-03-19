CREATE TABLE `storage_upload` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `upload_id` VARCHAR(500) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `file_uid` VARCHAR(200) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `path` VARCHAR(300) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `total_size` DOUBLE DEFAULT NULL,
  `owner` VARCHAR(200) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `total_part` INT DEFAULT NULL,
  `status` INT DEFAULT NULL COMMENT '0: pending, 1: uploading, 2: completed, 3: failed, 4: abort',
  `created_date` DOUBLE(13,3) DEFAULT NULL,
  `updated_date` DOUBLE(13,3) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `file_uid_idx` (`file_uid`) USING BTREE,
  UNIQUE KEY `upload_UN` (`upload_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci