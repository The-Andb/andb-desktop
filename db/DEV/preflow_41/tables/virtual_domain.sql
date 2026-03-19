CREATE TABLE `virtual_domain` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(50) CHARACTER SET latin1 COLLATE latin1_swedish_ci NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_domain` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1