CREATE TABLE `storage_mount` (
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(100) COLLATE utf8mb4_bin DEFAULT NULL,
  `root_id` BIGINT NOT NULL,
  `email` VARCHAR(64) COLLATE utf8mb4_bin NOT NULL,
  `mount_point` VARCHAR(4000) COLLATE utf8mb4_bin NOT NULL,
  `storage` VARCHAR(100) COLLATE utf8mb4_bin NOT NULL,
  `storage_config` VARCHAR(400) COLLATE utf8mb4_bin DEFAULT NULL,
  `created_date` DOUBLE DEFAULT NULL,
  `updated_date` DOUBLE DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `mounts_user_root_index` (`email`,`root_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin