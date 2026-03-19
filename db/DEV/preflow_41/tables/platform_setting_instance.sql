CREATE TABLE `platform_setting_instance` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id` BIGINT UNSIGNED NOT NULL,
  `app_reg_id` VARCHAR(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '',
  `incoming_call` TINYINT(1) NOT NULL DEFAULT '0' COMMENT '0 - Every one (default)\n1 - My Contacts Only\n2 - VIP only',
  `incoming_mail` TINYINT(1) NOT NULL DEFAULT '0' COMMENT '0 - Every one (default)\n1 - My Contacts Only \n 2 -VIP only ',
  `filter_chat` TINYINT(1) NOT NULL DEFAULT '0' COMMENT '0 - All Messages (default)\n1 - Mention for Me Only',
  `created_date` DOUBLE(13,3) NOT NULL,
  `updated_date` DOUBLE(13,3) DEFAULT NULL,
  PRIMARY KEY (`id`,`incoming_mail`),
  KEY `idx_user_id` (`user_id`),
  UNIQUE KEY `unq_platform_setting` (`user_id`,`app_reg_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='utf8mb4_unicode_ci'