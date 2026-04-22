CREATE TABLE `addressbookchanges` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `uri` VARCHAR(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
  `synctoken` INT UNSIGNED NOT NULL,
  `addressbookid` INT UNSIGNED NOT NULL,
  `operation` TINYINT NOT NULL,
  PRIMARY KEY (`id`),
  KEY `addressbookid_synctoken` (`addressbookid`,`synctoken`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1