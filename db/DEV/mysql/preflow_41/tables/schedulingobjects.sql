CREATE TABLE `schedulingobjects` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `principaluri` VARCHAR(255) CHARACTER SET latin1 COLLATE latin1_swedish_ci DEFAULT NULL,
  `calendardata` MEDIUMBLOB,
  `uri` VARCHAR(200) CHARACTER SET latin1 COLLATE latin1_swedish_ci DEFAULT NULL,
  `lastmodified` INT UNSIGNED DEFAULT NULL,
  `etag` VARCHAR(32) CHARACTER SET latin1 COLLATE latin1_swedish_ci DEFAULT NULL,
  `size` INT UNSIGNED NOT NULL,
  PRIMARY KEY (`id`),
  KEY `principaluri` (`principaluri`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=latin1