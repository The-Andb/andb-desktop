CREATE TABLE `rule` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id` BIGINT UNSIGNED NOT NULL,
  `name` VARCHAR(255) COLLATE utf8mb4_general_ci NOT NULL,
  `match_type` TINYINT UNSIGNED NOT NULL COMMENT '- 0: Match all  - 1: Match any',
  `order_number` DECIMAL(20,10) NOT NULL DEFAULT '0.0000000000' COMMENT 'Order of rule  ',
  `is_enable` TINYINT UNSIGNED DEFAULT '1' COMMENT '- 0: Disable\n- 1: Enable',
  `is_trashed` TINYINT NOT NULL DEFAULT '0',
  `created_date` DOUBLE(13,3) NOT NULL,
  `updated_date` DOUBLE(13,3) DEFAULT NULL,
  `conditions` json NOT NULL,
  `destinations` json NOT NULL,
  `account_id` BIGINT UNSIGNED DEFAULT '0',
  `apply_all` TINYINT UNSIGNED DEFAULT '1',
  PRIMARY KEY (`id`),
  KEY `idx_user_id` (`user_id`),
  UNIQUE KEY `uniq_user_id_and_order_number` (`user_id`,`order_number`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci