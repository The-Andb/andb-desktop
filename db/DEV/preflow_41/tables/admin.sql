CREATE TABLE `admin` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `email` VARCHAR(255) CHARACTER SET latin1 COLLATE latin1_swedish_ci NOT NULL,
  `verify_code` VARCHAR(255) CHARACTER SET latin1 COLLATE latin1_swedish_ci NOT NULL,
  `time_code_expire` INT NOT NULL DEFAULT '0',
  `role_id` BIGINT NOT NULL DEFAULT '0',
  `role` INT NOT NULL DEFAULT '0' COMMENT '0 : QA\n1 : ',
  `created_date` DOUBLE(13,3) NOT NULL,
  `receive_mail` TINYINT(1) NOT NULL DEFAULT '0',
  `updated_date` DOUBLE(13,3) DEFAULT NULL,
  `is_2fa_enabled` TINYINT(1) NOT NULL DEFAULT '0',
  `secret_key` TEXT CHARACTER SET latin1 COLLATE latin1_swedish_ci,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uniq_email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COMMENT='utf8_unicode_ci'