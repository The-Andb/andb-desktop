CREATE TABLE `calendarsubscriptions` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `uri` VARCHAR(200) CHARACTER SET latin1 COLLATE latin1_swedish_ci DEFAULT NULL,
  `principaluri` VARCHAR(100) CHARACTER SET latin1 COLLATE latin1_swedish_ci DEFAULT NULL,
  `source` TEXT CHARACTER SET latin1 COLLATE latin1_swedish_ci,
  `displayname` VARCHAR(100) CHARACTER SET latin1 COLLATE latin1_swedish_ci DEFAULT NULL,
  `refreshrate` VARCHAR(10) CHARACTER SET latin1 COLLATE latin1_swedish_ci DEFAULT NULL,
  `calendarorder` INT UNSIGNED NOT NULL DEFAULT '0',
  `calendarcolor` VARCHAR(10) CHARACTER SET latin1 COLLATE latin1_swedish_ci DEFAULT NULL,
  `striptodos` TINYINT(1) DEFAULT NULL,
  `stripalarms` TINYINT(1) DEFAULT NULL,
  `stripattachments` TINYINT(1) DEFAULT NULL,
  `lastmodified` INT UNSIGNED DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `principaluri` (`principaluri`,`uri`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1