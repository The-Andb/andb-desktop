CREATE TABLE `os_version` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `os_name` VARCHAR(255) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `os_version` VARCHAR(100) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `os_type` TINYINT UNSIGNED DEFAULT '0' COMMENT 'int: 0 = mac (default ), 1 = window, 2 = ubuntu',
  `created_date` DOUBLE(13,3) NOT NULL,
  `updated_date` DOUBLE(13,3) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uniq_on_os_type_and_os_version` (`os_type`,`os_version`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci