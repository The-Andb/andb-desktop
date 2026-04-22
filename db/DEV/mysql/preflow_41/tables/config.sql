CREATE TABLE `config` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `group` VARCHAR(100) NOT NULL,
  `key` VARCHAR(100) NOT NULL,
  `value` json NOT NULL,
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE KEY `uniq_on_group_and_key` (`group`,`key`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=latin1