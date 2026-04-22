CREATE TABLE `gmail_history` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `history_id` INT UNSIGNED NOT NULL,
  `email_id` VARCHAR(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `gmail` VARCHAR(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `expiration` BIGINT NOT NULL,
  `watch_expired` BIGINT NOT NULL,
  `watch_date` DOUBLE(13,3) DEFAULT NULL,
  `created_date` DOUBLE(13,3) NOT NULL,
  `updated_date` DOUBLE(13,3) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uniq_gmail` (`gmail`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci