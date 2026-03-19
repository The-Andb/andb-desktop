CREATE TABLE `subscription_detail` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `sub_id` VARCHAR(255) NOT NULL DEFAULT '',
  `com_id` INT NOT NULL DEFAULT '0',
  `sub_value` INT NOT NULL DEFAULT '0',
  `description` VARCHAR(255) NOT NULL DEFAULT '',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COMMENT='utf8_unicode_ci'