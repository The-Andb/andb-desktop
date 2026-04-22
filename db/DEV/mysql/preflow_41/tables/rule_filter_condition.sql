CREATE TABLE `rule_filter_condition` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id` BIGINT UNSIGNED NOT NULL,
  `rule_id` BIGINT UNSIGNED NOT NULL,
  `filter_condition_id` BIGINT UNSIGNED NOT NULL COMMENT 'ID of email_fields table',
  `filter_operator_id` BIGINT UNSIGNED NOT NULL,
  `filter_value` VARCHAR(255) COLLATE utf8mb4_general_ci NOT NULL COMMENT 'keywords to filter  ',
  `created_date` DOUBLE(13,3) NOT NULL,
  `updated_date` DOUBLE(13,3) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_rule_filter_condition_rule_id` (`rule_id`),
  CONSTRAINT `cst_rule_filter_condition_rule_id` FOREIGN KEY (`rule_id`) REFERENCES `rule` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci