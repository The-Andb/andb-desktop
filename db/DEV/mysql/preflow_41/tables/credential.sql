CREATE TABLE `credential` (
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `user_id` BIGINT UNSIGNED NOT NULL,
  `created_date` DOUBLE(13,3) DEFAULT NULL,
  `updated_date` DOUBLE(13,3) DEFAULT NULL,
  `data_encrypted` TEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `type` TINYINT(1) NOT NULL DEFAULT '0',
  `checksum` VARCHAR(100) CHARACTER SET latin1 COLLATE latin1_swedish_ci DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_user_id` (`user_id`),
  UNIQUE KEY `unq_credential` (`user_id`,`type`,`checksum`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COMMENT='utf8_unicode_ci'