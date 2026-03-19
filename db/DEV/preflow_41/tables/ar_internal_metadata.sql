CREATE TABLE `ar_internal_metadata` (
  `key` VARCHAR(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `value` VARCHAR(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_date` DOUBLE(13,3) NOT NULL,
  `updated_date` DOUBLE(13,3) DEFAULT NULL,
  PRIMARY KEY (`key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci