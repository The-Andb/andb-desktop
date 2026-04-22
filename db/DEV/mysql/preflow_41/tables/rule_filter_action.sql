CREATE TABLE `rule_filter_action` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id` BIGINT UNSIGNED NOT NULL,
  `rule_id` BIGINT UNSIGNED NOT NULL,
  `filter_action_id` BIGINT UNSIGNED DEFAULT NULL COMMENT 'ID of actions table',
  `filter_action_subvalue` VARCHAR(255) COLLATE utf8mb4_general_ci DEFAULT NULL COMMENT 'ID of collection table  ',
  `filter_action_value` VARCHAR(255) COLLATE utf8mb4_general_ci DEFAULT NULL COMMENT 'IMAP path  ',
  `created_date` DOUBLE(13,3) NOT NULL,
  `updated_date` DOUBLE(13,3) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_rule_id` (`rule_id`),
  CONSTRAINT `cst_rule_filter_action_rule_id` FOREIGN KEY (`rule_id`) REFERENCES `rule` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci