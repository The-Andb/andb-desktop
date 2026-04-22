CREATE TABLE `protect_page` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `verify_code` TEXT NOT NULL,
  `checksum` VARCHAR(128) CHARACTER SET latin1 COLLATE latin1_swedish_ci DEFAULT NULL,
  `time_code_expire` INT NOT NULL DEFAULT '0',
  `created_date` DOUBLE(13,3) NOT NULL,
  `updated_date` DOUBLE(13,3) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COMMENT='utf8_unicode_ci'