CREATE TABLE `propertystorage` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `path` VARBINARY(1024) NOT NULL,
  `name` VARBINARY(100) NOT NULL,
  `valuetype` INT UNSIGNED DEFAULT NULL,
  `value` MEDIUMBLOB,
  PRIMARY KEY (`id`),
  UNIQUE KEY `path_property` (`path`,`name`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1