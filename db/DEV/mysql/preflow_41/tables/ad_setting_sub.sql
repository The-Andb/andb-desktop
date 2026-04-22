CREATE TABLE `ad_setting_sub` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `notice_by_email` TINYINT NOT NULL DEFAULT '1',
  `notice_by_push` TINYINT NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COMMENT='utf8_unicode_ci'