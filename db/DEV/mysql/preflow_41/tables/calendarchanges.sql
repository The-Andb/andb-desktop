CREATE TABLE `calendarchanges` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `uri` VARCHAR(200) CHARACTER SET latin1 COLLATE latin1_swedish_ci DEFAULT NULL,
  `synctoken` INT UNSIGNED NOT NULL,
  `calendarid` INT UNSIGNED NOT NULL,
  `operation` TINYINT(1) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `calendarid_synctoken` (`calendarid`,`synctoken`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1