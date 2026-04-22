CREATE TABLE `config_push_silent` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `show_sound` VARCHAR(255) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'default',
  `show_alert` VARCHAR(255) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'Hello Flo User',
  `has_alert` TINYINT UNSIGNED NOT NULL DEFAULT '0',
  `interval_stop_push` INT NOT NULL DEFAULT '3600',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='utf8mb4_unicode_ci'