CREATE TABLE `app_register` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `app_reg_id` VARCHAR(255) CHARACTER SET latin1 COLLATE latin1_swedish_ci DEFAULT NULL,
  `app_alias` VARCHAR(255) CHARACTER SET latin1 COLLATE latin1_swedish_ci DEFAULT NULL,
  `email_register` VARCHAR(255) CHARACTER SET latin1 COLLATE latin1_swedish_ci DEFAULT NULL,
  `app_name` VARCHAR(255) CHARACTER SET latin1 COLLATE latin1_swedish_ci DEFAULT NULL,
  `created_date` DOUBLE(13,3) NOT NULL,
  `updated_date` DOUBLE(13,3) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uniq_app_reg_id` (`app_reg_id`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COMMENT='utf8_unicode_ci'