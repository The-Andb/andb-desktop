CREATE TABLE `criterion` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `criterion_type` TINYINT NOT NULL DEFAULT '0',
  `name` VARCHAR(100) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '',
  `point` INT NOT NULL DEFAULT '0',
  `priority` INT NOT NULL DEFAULT '1',
  `created_date` DOUBLE(13,3) NOT NULL,
  `updated_date` DOUBLE(13,3) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='utf8mb4_unicode_ci'