CREATE TABLE `timezone` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `city` VARCHAR(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `country` VARCHAR(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `timezone` VARCHAR(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`id`),
  KEY `city` (`city`),
  KEY `country` (`country`),
  KEY `timezone` (`timezone`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='utf8mb4_unicode_ci'