CREATE TABLE `storage_upload_part` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `upload_id` VARCHAR(500) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `part_no` INT DEFAULT NULL,
  `etag` VARCHAR(200) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `checksum_sha256` VARCHAR(300) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `size` DOUBLE DEFAULT NULL,
  `owner` VARCHAR(200) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `created_date` DOUBLE(13,3) DEFAULT NULL,
  `updated_date` DOUBLE(13,3) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `storage_upload_part_upload_id_IDX` (`upload_id`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci