CREATE TABLE `groupmembers` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `principal_id` INT UNSIGNED NOT NULL,
  `member_id` INT UNSIGNED NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `principal_id` (`principal_id`,`member_id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1