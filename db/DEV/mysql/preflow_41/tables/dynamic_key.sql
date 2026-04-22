CREATE TABLE `dynamic_key` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `public_key` TEXT COLLATE utf8mb4_unicode_ci NOT NULL,
  `secret_key` VARCHAR(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_date` DOUBLE(13,3) NOT NULL,
  `updated_date` DOUBLE(13,3) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci