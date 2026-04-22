CREATE TABLE `addressbooks` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `principaluri` VARCHAR(255) CHARACTER SET latin1 COLLATE latin1_swedish_ci DEFAULT NULL,
  `displayname` VARCHAR(255) CHARACTER SET latin1 COLLATE latin1_swedish_ci DEFAULT NULL,
  `uri` VARCHAR(200) CHARACTER SET latin1 COLLATE latin1_swedish_ci DEFAULT NULL,
  `description` TEXT CHARACTER SET latin1 COLLATE latin1_swedish_ci,
  `synctoken` INT UNSIGNED NOT NULL DEFAULT '1',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uniq_principaluri` (`principaluri`,`uri`),
  KEY `uri_idx` (`uri`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1