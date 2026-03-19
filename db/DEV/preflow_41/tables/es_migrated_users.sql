CREATE TABLE `es_migrated_users` (
  `id` INT NOT NULL AUTO_INCREMENT COMMENT 'Primary key',
  `email` VARCHAR(255) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Email of the user being migrated',
  `status` VARCHAR(50) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Migration status (success, partial_success, failed)',
  `message` VARCHAR(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Optional message field for storing error details',
  `retry_count` INT NOT NULL DEFAULT '0' COMMENT 'Counter for number of migration attempts',
  `migrated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Timestamp when first migration was attempted',
  `last_retry_at` timestamp NULL DEFAULT NULL COMMENT 'Timestamp of the last retry attempt',
  `calendar_count` INT NOT NULL DEFAULT '0',
  `object_count` INT NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`),
  UNIQUE KEY `idx_migrated_users_email` (`email`),
  KEY `idx_migrated_users_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Stores migration status and history for users'