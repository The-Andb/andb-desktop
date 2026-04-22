CREATE TABLE `cards` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `addressbookid` INT UNSIGNED NOT NULL,
  `carddata` LONGTEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci,
  `uri` VARCHAR(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  `lastmodified` INT UNSIGNED DEFAULT NULL,
  `etag` VARBINARY(32) DEFAULT NULL,
  `size` INT UNSIGNED NOT NULL,
  PRIMARY KEY (`id`),
  KEY `addressbookid` (`addressbookid`),
  FULLTEXT KEY `carddata` (`carddata`),
  KEY `uri` (`uri`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COMMENT='utf8_unicode_ci'